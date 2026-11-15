"""MERRA-2 regional and pixel-wise trend analysis for the Flask API."""

import os
import threading
import warnings

import numpy as np
import pandas as pd
import xarray as xr
from joblib import Parallel, delayed
from scipy import stats
from statsmodels.stats.diagnostic import acorr_ljungbox
from statsmodels.tools.sm_exceptions import InterpolationWarning
from statsmodels.tsa.seasonal import STL
from statsmodels.tsa.stattools import adfuller, kpss

HF_ZARR_URI = "hf://datasets/ChahediCodeLabs/m2tmnxslv-zarr/"
HF_TOKEN_CONFIG = ""
HF_TOKEN = os.getenv("HF_TOKEN", "") or HF_TOKEN_CONFIG
SEASONAL_PERIOD = 12
MAX_PIXELS = 5000
MIN_PIXEL_OBSERVATIONS = 10
MIN_VALID_FRACTION = 0.80
SNHT_SIMULATIONS = 2000
N_JOBS = -1
STL_MIN_OBSERVATIONS = 5 * SEASONAL_PERIOD
_STATIONARITY_WARNING_LOCK = threading.Lock()
_DATASET_LOCK = threading.Lock()
_DATASET = None


def get_dataset():
    """Return the persistent, lazily opened remote dataset singleton."""
    global _DATASET

    if _DATASET is None:
        with _DATASET_LOCK:
            if _DATASET is None:
                from huggingface_hub import HfFileSystem

                filesystem = HfFileSystem(token=HF_TOKEN or False)
                store = filesystem.get_mapper(HF_ZARR_URI.removeprefix("hf://"))
                try:
                    _DATASET = xr.open_zarr(store, consolidated=True)
                except (ValueError, KeyError, FileNotFoundError):
                    _DATASET = xr.open_zarr(store, consolidated=False)
    return _DATASET


def _coordinate_slice(coordinate, lower, upper):
    """Create a slice that works with ascending or descending coordinates."""
    values = np.asarray(coordinate.values)
    if values.size < 2 or values[0] <= values[-1]:
        return slice(lower, upper)
    return slice(upper, lower)


def slice_data(dataset, variable, bounding_box, start_date, end_date):
    """Select and load one variable and region from the persistent dataset."""
    if variable not in dataset.data_vars:
        raise KeyError(
            f"Variable {variable!r} is absent from the dataset; "
            f"available variables are {list(dataset.data_vars)}."
        )
    west, south, east, north = bounding_box
    selected = dataset[variable].sel(
        time=slice(start_date, end_date),
        lat=_coordinate_slice(dataset["lat"], south, north),
        lon=_coordinate_slice(dataset["lon"], west, east),
    )
    if not {"time", "lat", "lon"}.issubset(selected.dims):
        raise ValueError(
            f"{variable!r} must have time, lat, and lon dimensions; "
            f"received {selected.dims}."
        )
    n_pixels = selected.sizes.get("lat", 0) * selected.sizes.get("lon", 0)
    if n_pixels > MAX_PIXELS:
        raise ValueError(
            "The selected region exceeds the 5,000-pixel limit. "
            "Zoom in to a smaller bounding box."
        )
    data_array = selected.transpose("time", "lat", "lon").load()
    if (
        not data_array.sizes.get("time")
        or not data_array.sizes.get("lat")
        or not data_array.sizes.get("lon")
    ):
        raise ValueError("The requested dates and bounding box selected no data.")
    return data_array


def _s_and_var(values):
    """Mann-Kendall S statistic and tie-corrected variance."""
    n = len(values)
    s = sum(np.sum(np.sign(values[k + 1:] - values[k])) for k in range(n - 1))
    _, counts = np.unique(values, return_counts=True)
    var_s = (
        n * (n - 1) * (2 * n + 5)
        - np.sum(counts * (counts - 1) * (2 * counts + 5))
    ) / 18.0
    return float(s), float(var_s)


def _z_from_s(s, var_s):
    if var_s <= 0:
        return 0.0
    if s > 0:
        return float((s - 1) / np.sqrt(var_s))
    if s < 0:
        return float((s + 1) / np.sqrt(var_s))
    return 0.0


def _is_constant(values):
    values = np.asarray(values, dtype=float)
    if not values.size:
        return True
    scale = max(1.0, float(np.max(np.abs(values))))
    return bool(np.ptp(values) <= 1e-12 * scale)


def _trend_label(p_value, z, alpha):
    if p_value < alpha and z > 0:
        return "increasing"
    if p_value < alpha and z < 0:
        return "decreasing"
    return "no trend"


def sens_slope(values, var_s=None, alpha=0.05):
    """Return Theil-Sen slope, intercept, and its two-sided confidence interval."""
    values = np.asarray(values, dtype=float)
    n = len(values)
    i, j = np.triu_indices(n, k=1)
    slopes = (values[j] - values[i]) / (j - i)
    slope = float(np.median(slopes))
    intercept = float(np.median(values - slope * np.arange(n)))
    lower = upper = np.nan
    if var_s is not None and len(slopes):
        count = len(slopes)
        confidence = stats.norm.ppf(1 - alpha / 2) * np.sqrt(max(var_s, 0))
        low_index = int(np.floor((count - confidence) / 2))
        high_index = int(np.ceil((count + confidence) / 2))
        ordered = np.sort(slopes)
        lower = float(ordered[max(low_index - 1, 0)])
        upper = float(ordered[min(high_index, count - 1)])
    return slope, intercept, lower, upper


def mann_kendall(values, alpha=0.05):
    values = np.asarray(values, dtype=float)
    s, var_s = _s_and_var(values)
    z = _z_from_s(s, var_s)
    p_value = float(2 * stats.norm.sf(abs(z)))
    n = len(values)
    tau = float(s / (0.5 * n * (n - 1)))
    return {
        "s": s,
        "var_s": var_s,
        "z": z,
        "p_value": p_value,
        "tau": tau,
        "trend": _trend_label(p_value, z, alpha),
    }


def modified_mann_kendall(values, alpha=0.05):
    """Hamed-Rao modified Mann-Kendall test with detrended-rank correction."""
    values = np.asarray(values, dtype=float)
    n = len(values)
    s, var_s = _s_and_var(values)
    if n < 3 or var_s <= 0:
        z = 0.0
        correction = 1.0
    else:
        slope, _, _, _ = sens_slope(values)
        detrended_ranks = stats.rankdata(values - slope * np.arange(n))
        centered_ranks = detrended_ranks - detrended_ranks.mean()
        rank_energy = np.sum(centered_ranks ** 2)
        autocorrelation = (
            np.correlate(centered_ranks, centered_ranks, mode="full")[n - 1:]
            / rank_energy
            if rank_energy > 0 else np.zeros(n)
        )
        correction_sum = 0.0
        for lag in range(1, n - 1):
            lower = (-1 - 1.96 * np.sqrt(n - lag - 1)) / (n - lag)
            upper = (-1 + 1.96 * np.sqrt(n - lag - 1)) / (n - lag)
            if autocorrelation[lag] < lower or autocorrelation[lag] > upper:
                correction_sum += (
                    (n - lag) * (n - lag - 1) * (n - lag - 2)
                    * autocorrelation[lag]
                )
        correction = 1 + 2 * correction_sum / (n * (n - 1) * (n - 2))
        modified_variance = var_s * correction
        z = _z_from_s(s, modified_variance) if modified_variance > 0 else 0.0
    p_value = float(2 * stats.norm.sf(abs(z)))
    return {
        "z": float(z),
        "p_value": p_value,
        "variance_correction": float(correction),
        "trend": _trend_label(p_value, z, alpha),
    }


def seasonal_mann_kendall(values, period=SEASONAL_PERIOD, alpha=0.05):
    """Seasonal Mann-Kendall with Sen slopes computed within each season."""
    values = np.asarray(values, dtype=float)
    total_s, total_variance = 0.0, 0.0
    seasonal_slopes = []
    for season in range(period):
        season_values = values[season::period]
        season_values = season_values[np.isfinite(season_values)]
        if len(season_values) < 4:
            continue
        s, variance = _s_and_var(season_values)
        total_s += s
        total_variance += variance
        i, j = np.triu_indices(len(season_values), k=1)
        seasonal_slopes.extend((season_values[j] - season_values[i]) / (j - i))
    if not seasonal_slopes or total_variance <= 0:
        return None
    z = _z_from_s(total_s, total_variance)
    p_value = float(2 * stats.norm.sf(abs(z)))
    return {
        "z": z,
        "p_value": p_value,
        "slope_per_year": float(np.median(seasonal_slopes)),
        "trend": _trend_label(p_value, z, alpha),
    }


def pettitt_test(values, alpha=0.05):
    values = np.asarray(values, dtype=float)
    n = len(values)
    ranks = stats.rankdata(values)
    statistic_series = np.array([
        2 * ranks[:index + 1].sum() - (index + 1) * (n + 1)
        for index in range(n - 1)
    ])
    statistic = float(np.max(np.abs(statistic_series)))
    index = int(np.argmax(np.abs(statistic_series))) + 1
    p_value = float(min(1.0, 2 * np.exp(-6 * statistic ** 2 / (n ** 3 + n ** 2))))
    return {
        "available": True,
        "statistic": statistic,
        "index": index,
        "p_value": p_value,
        "change": p_value < alpha,
    }


def _snht_statistic(values):
    n = len(values)
    standardized = (values - values.mean()) / values.std(ddof=1)
    cumulative = np.cumsum(standardized)
    split = np.arange(1, n)
    first_mean = cumulative[:-1] / split
    second_mean = (cumulative[-1] - cumulative[:-1]) / (n - split)
    values_at_split = split * first_mean ** 2 + (n - split) * second_mean ** 2
    return float(values_at_split.max()), int(values_at_split.argmax()) + 1


def snht_test(values, alpha=0.05, n_sim=SNHT_SIMULATIONS, seed=42):
    values = np.asarray(values, dtype=float)
    if len(values) < 3 or _is_constant(values):
        return {"available": False, "reason": "requires 3+ non-constant observations"}
    statistic, index = _snht_statistic(values)
    rng = np.random.default_rng(seed)
    simulations = np.array([
        _snht_statistic(rng.normal(size=len(values)))[0] for _ in range(n_sim)
    ])
    p_value = float((np.sum(simulations >= statistic) + 1) / (n_sim + 1))
    return {
        "available": True,
        "statistic": statistic,
        "index": index,
        "p_value": p_value,
        "change": p_value < alpha,
    }


def _buishand_statistic(values):
    cumulative = np.cumsum(values - values.mean())
    statistic = (cumulative.max() - cumulative.min()) / values.std(ddof=1)
    return float(statistic), int(np.argmax(np.abs(cumulative))) + 1


def buishand_range_test(values, alpha=0.05, n_sim=SNHT_SIMULATIONS, seed=43):
    values = np.asarray(values, dtype=float)
    if len(values) < 3 or _is_constant(values):
        return {"available": False, "reason": "requires 3+ non-constant observations"}
    statistic, index = _buishand_statistic(values)
    rng = np.random.default_rng(seed)
    simulations = np.array([
        _buishand_statistic(rng.normal(size=len(values)))[0] for _ in range(n_sim)
    ])
    p_value = float((np.sum(simulations >= statistic) + 1) / (n_sim + 1))
    return {
        "available": True,
        "statistic": statistic,
        "index": index,
        "p_value": p_value,
        "change": p_value < alpha,
    }


def _stationarity_tests(values, alpha, include_trend=False):
    if len(values) < 20 or _is_constant(values):
        return {"available": False, "reason": "requires 20+ non-constant observations"}
    try:
        with _STATIONARITY_WARNING_LOCK:
            with warnings.catch_warnings(record=True) as captured:
                warnings.simplefilter("always")
                adf_result = adfuller(
                    values, regression="c", autolag="AIC", result_object=False
                )
                kpss_result = kpss(
                    values, regression="c", nlags="auto", result_object=False
                )
                if include_trend:
                    adf_trend_result = adfuller(
                        values, regression="ct", autolag="AIC", result_object=False
                    )
                    kpss_trend_result = kpss(
                        values, regression="ct", nlags="auto", result_object=False
                    )
    except (ValueError, np.linalg.LinAlgError) as exc:
        return {"available": False, "reason": f"{type(exc).__name__}: {exc}"}
    result = {
        "available": True,
        "adf_statistic": float(adf_result[0]),
        "adf_p_value": float(adf_result[1]),
        "adf_stationary": bool(adf_result[1] < alpha),
        "kpss_statistic": float(kpss_result[0]),
        "kpss_p_value": float(kpss_result[1]),
        "kpss_stationary": bool(kpss_result[1] > alpha),
        "kpss_p_value_at_table_bound": any(
            issubclass(item.category, InterpolationWarning) for item in captured
        ),
        "warnings": [
            f"{item.category.__name__}: {item.message}" for item in captured
        ],
    }
    if include_trend:
        result.update({
            "adf_trend_statistic": float(adf_trend_result[0]),
            "adf_trend_p_value": float(adf_trend_result[1]),
            "adf_trend_stationary": bool(adf_trend_result[1] < alpha),
            "kpss_trend_statistic": float(kpss_trend_result[0]),
            "kpss_trend_p_value": float(kpss_trend_result[1]),
            "kpss_trend_stationary": bool(kpss_trend_result[1] > alpha),
        })
    return result


def _analyze_regional(data_array, alpha):
    timestamps = pd.DatetimeIndex(pd.to_datetime(data_array.time.values))
    median_series = data_array.median(dim=("lat", "lon"), skipna=True).to_series()
    median_series.index = timestamps
    median_series = median_series.replace([np.inf, -np.inf], np.nan)
    valid = median_series.notna()
    if int(valid.sum()) < 3:
        raise ValueError("Regional spatial-median series has fewer than three valid observations.")
    if not valid.all():
        median_series = median_series.interpolate(limit_direction="both")
    raw = median_series.to_numpy(dtype=float)

    if len(raw) >= STL_MIN_OBSERVATIONS:
        decomposition = STL(median_series, period=SEASONAL_PERIOD, robust=True).fit()
        seasonal = np.asarray(decomposition.seasonal, dtype=float)
        trend_component = np.asarray(decomposition.trend, dtype=float)
        deseasonalized = raw - seasonal
        test_series = deseasonalized
        test_basis = "STL-deseasonalized regional spatial median"
    else:
        decomposition = None
        seasonal = np.full(len(raw), np.nan)
        trend_component = np.full(len(raw), np.nan)
        deseasonalized = raw.copy()
        test_series = raw
        test_basis = "raw regional spatial median (short record; STL not fitted)"
    if _is_constant(test_series):
        test_series = np.full(len(test_series), test_series[0])

    mk = mann_kendall(test_series, alpha)
    modified = modified_mann_kendall(test_series, alpha)
    slope, intercept, lower, upper = sens_slope(test_series, mk["var_s"], alpha)
    seasonal_mk = seasonal_mann_kendall(raw, SEASONAL_PERIOD, alpha)
    if seasonal_mk is None:
        seasonal_result = {
            "available": False,
            "reason": "insufficient observations in each seasonal group",
        }
    else:
        seasonal_result = {"available": True, **seasonal_mk}

    n = len(test_series)
    if _is_constant(test_series):
        spearman_rho, spearman_p_value = None, None
    else:
        spearman_result = stats.spearmanr(np.arange(n), test_series)
        spearman_rho = float(spearman_result.statistic)
        spearman_p_value = float(spearman_result.pvalue)
    stationarity = _stationarity_tests(test_series, alpha, include_trend=True)
    ljung_box_lags = [lag for lag in (6, 12, 24) if lag < n // 2] or [min(5, n - 1)]
    if _is_constant(test_series):
        ljung_box_rows = [
            {"lag": int(lag), "statistic": None, "p_value": None}
            for lag in ljung_box_lags
        ]
    else:
        ljung_box = acorr_ljungbox(test_series, lags=ljung_box_lags, return_df=True)
        ljung_box_rows = [
            {
                "lag": int(lag),
                "statistic": float(row["lb_stat"]),
                "p_value": float(row["lb_pvalue"]),
            }
            for lag, row in ljung_box.iterrows()
        ]
    regional_tests = {
        "test_basis": test_basis,
        "record_note": (
            "Short record: fewer than five seasonal cycles; STL was not fitted "
            "and trend tests use the raw regional median."
            if decomposition is None else None
        ),
        "mann_kendall": {
            "s": mk["s"], "z": mk["z"], "tau": mk["tau"],
            "p_value": mk["p_value"], "trend": mk["trend"],
            "significant": bool(mk["p_value"] < alpha),
        },
        "hamed_rao_modified_mann_kendall": {
            **modified,
            "significant": bool(modified["p_value"] < alpha),
        },
        "seasonal_mann_kendall": seasonal_result,
        "sen_slope": {
            "per_month": slope,
            "per_decade": slope * 120,
            "intercept": intercept,
            "ci_95_per_month": [lower, upper],
            "ci_95_per_decade": [lower * 120, upper * 120],
        },
        "spearman": {
            "rho": spearman_rho,
            "p_value": spearman_p_value,
            "significant": (
                bool(spearman_p_value < alpha) if spearman_p_value is not None else None
            ),
        },
        "stationarity": stationarity,
        "ljung_box": ljung_box_rows,
        "change_points": {
            "pettitt": pettitt_test(test_series, alpha),
            "snht": snht_test(test_series, alpha),
            "buishand": buishand_range_test(test_series, alpha),
        },
    }
    series_output = {
        "timestamps": [timestamp.isoformat() for timestamp in timestamps],
        "raw_median": raw.tolist(),
        "deseasonalized": deseasonalized.tolist(),
        "seasonal": seasonal.tolist(),
        "trend": trend_component.tolist(),
    }
    return median_series, decomposition, test_series, regional_tests, series_output


def _analyze_pixel(values, lat, lon, min_valid_count, alpha):
    values = np.asarray(values, dtype=float)
    finite_mask = np.isfinite(values)
    n_valid = int(finite_mask.sum())
    if n_valid < min_valid_count:
        return None
    filled = pd.Series(values).replace([np.inf, -np.inf], np.nan)
    if not finite_mask.all():
        filled = filled.interpolate(limit_direction="both")
    raw = filled.to_numpy(dtype=float)
    test_values = raw
    if len(raw) >= STL_MIN_OBSERVATIONS:
        test_values = raw - np.asarray(
            STL(raw, period=SEASONAL_PERIOD, robust=True).fit().seasonal,
            dtype=float,
        )
    if _is_constant(test_values):
        test_values = np.full(len(test_values), test_values[0])
    mk = mann_kendall(test_values, alpha)
    modified = modified_mann_kendall(test_values, alpha)
    slope, intercept, lower, upper = sens_slope(test_values, mk["var_s"], alpha)
    seasonal = seasonal_mann_kendall(raw, SEASONAL_PERIOD, alpha)
    stationarity = _stationarity_tests(test_values, alpha)
    p_value = modified["p_value"]
    properties = {
        "lat": float(lat),
        "lon": float(lon),
        "n_valid": n_valid,
        "slope": slope,
        "slope_intercept": intercept,
        "slope_ci_95": [lower, upper],
        "p_value": p_value,
        "z": modified["z"],
        "tau": mk["tau"],
        "trend": modified["trend"],
        "significant": bool(p_value < alpha),
        "mann_kendall_significant": bool(mk["p_value"] < alpha),
        "seasonal_mk_p_value": seasonal["p_value"] if seasonal else None,
        "seasonal_mk_significant": (
            bool(seasonal["p_value"] < alpha) if seasonal else None
        ),
        "adf_stationary": stationarity.get("adf_stationary"),
        "kpss_stationary": stationarity.get("kpss_stationary"),
    }
    return {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [float(lon), float(lat)]},
        "properties": properties,
    }


def _json_safe(value):
    """Convert NumPy/Pandas values and non-finite floats to strict JSON values."""
    if isinstance(value, dict):
        return {str(key): _json_safe(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [_json_safe(item) for item in value]
    if isinstance(value, np.ndarray):
        return [_json_safe(item) for item in value.tolist()]
    if isinstance(value, (np.integer,)):
        return int(value)
    if isinstance(value, (np.floating, float)):
        return float(value) if np.isfinite(value) else None
    if isinstance(value, (np.bool_, bool)):
        return bool(value)
    if isinstance(value, (pd.Timestamp, np.datetime64)):
        return pd.Timestamp(value).isoformat()
    return value


def run_analysis(
    data_array,
    variable,
    bounding_box,
    start_date,
    end_date,
    alpha,
):
    """Return regional statistics and pixel GeoJSON for one loaded subset."""
    required_dims = {"time", "lat", "lon"}
    if not required_dims.issubset(data_array.dims):
        raise ValueError(f"DataArray must have time, lat, lon dimensions; got {data_array.dims}.")
    data_array = data_array.transpose("time", "lat", "lon")
    if data_array.sizes["time"] < 3 or not data_array.sizes["lat"] or not data_array.sizes["lon"]:
        raise ValueError("DataArray must contain at least three times and a non-empty grid.")

    _, _, _, regional_tests, regional_timeseries = _analyze_regional(data_array, alpha)
    values = np.asarray(data_array.values, dtype=float)
    lats = np.asarray(data_array.lat.values, dtype=float)
    lons = np.asarray(data_array.lon.values, dtype=float)
    n_times = values.shape[0]
    min_valid_count = max(
        MIN_PIXEL_OBSERVATIONS,
        int(np.ceil(n_times * MIN_VALID_FRACTION)),
    )
    tasks = (
        (values[:, i, j], lats[i], lons[j], min_valid_count, alpha)
        for i in range(len(lats))
        for j in range(len(lons))
    )
    total_pixels = len(lats) * len(lons)
    pixel_results = Parallel(
        n_jobs=N_JOBS,
        prefer="threads",
        return_as="generator_unordered",
    )(
        delayed(_analyze_pixel)(series, lat, lon, min_count, task_alpha)
        for series, lat, lon, min_count, task_alpha in tasks
    )
    features = [feature for feature in pixel_results if feature is not None]
    significant_count = sum(
        feature["properties"]["significant"] for feature in features
    )
    pixel_summary = {
        "pixels_total": int(total_pixels),
        "pixels_analyzed": int(len(features)),
        "pixels_significant": int(significant_count),
        "significant_percent": (
            float(100 * significant_count / len(features)) if features else 0.0
        ),
    }
    metadata = {
        "source": HF_ZARR_URI,
        "variable": variable,
        "units": data_array.attrs.get("units"),
        "bounding_box": list(bounding_box),
        "start_date": start_date,
        "end_date": end_date,
        "alpha": float(alpha),
        "seasonal_period": int(SEASONAL_PERIOD),
        "grid": {
            "time_steps": int(n_times),
            "latitudes": int(len(lats)),
            "longitudes": int(len(lons)),
            **pixel_summary,
        },
        "regional_summary": regional_tests,
        "regional_timeseries": regional_timeseries,
    }
    return _json_safe({
        "type": "FeatureCollection",
        "metadata": metadata,
        "features": features,
    })
