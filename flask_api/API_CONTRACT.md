# MERRA-2 Trend API Contract

Audience: frontend developers integrating React, TypeScript, Deck.gl, and Plotly.

## 1. Overview & Base Configuration

The API reads the MERRA-2 Zarr dataset at `hf://datasets/ChahediCodeLabs/m2tmnxslv-zarr/`. The remote dataset is opened lazily on the first metadata or analysis request and retained as a thread-safe process-local singleton. Xarray reads remote Zarr metadata and only the spatial-temporal chunks needed by a selected request, using the Hugging Face filesystem's remote/range reads where supported; the selected subset is loaded into RAM for analysis. The API does not download the full dataset to local disk. An optional `HF_TOKEN` environment variable can be used for authenticated Hugging Face access.

CORS is enabled with `flask-cors` via `CORS(app)`. This uses flask-cors defaults; configure an explicit allowed-origin list before exposing the service publicly if the deployment requires origin restrictions.

From the repository root, install the API dependencies and start a local Flask server:

```powershell
pip install -r flask_api/requirements.txt
flask --app flask_api.app run --port 5000
```

The local module entrypoint is also available with `python -m flask_api.app`; it binds to `0.0.0.0:5000` with Flask debug mode enabled. Do not use debug mode in production. For a Linux WSGI deployment, the included Gunicorn dependency can serve the exported `app` object, for example:

```sh
gunicorn --bind 0.0.0.0:5000 flask_api.app:app
```

Local base URL: `http://127.0.0.1:5000`.

## 2. Endpoints & Request Inputs

### `GET /api/health`

A lightweight liveness check. It does not call `get_dataset()` and therefore does not open the remote Zarr store.

```json
{"status":"ok"}
```

Status: `200 OK`.

### `GET /api/metadata`

Returns dataset information for populating variable dropdowns, date controls, and map bounds. The endpoint opens the lazy dataset if this is the process's first data request.

Response schema:

```ts
interface ApiMetadata {
  source: string;
  variables: Array<{
    name: string;
    units: string | null;
    long_name: string | null;
  }>;
  time_range: [minDate: string, maxDate: string];
  spatial_bounds: [minLon: number, minLat: number, maxLon: number, maxLat: number];
}
```

`time_range` uses `YYYY-MM-DD` strings. `spatial_bounds` is ordered `[west, south, east, north]` and reports the dataset coordinate extrema, not a selected request extent. Attribute values absent from the source Zarr metadata are returned as `null`.

Example:

```json
{
  "source": "hf://datasets/ChahediCodeLabs/m2tmnxslv-zarr/",
  "variables": [
    {"name": "TS", "units": "K", "long_name": "Surface skin temperature"}
  ],
  "time_range": ["1980-01-01", "2025-12-01"],
  "spatial_bounds": [-180.0, -90.0, 180.0, 90.0]
}
```

The dates, bounds, and variable attributes above illustrate the format; actual values come from the opened dataset.

### `GET /api/analyze` and `POST /api/analyze`

Both methods run the same analysis. GET inputs are query parameters; POST inputs are a JSON object. The four bounds and both dates are required. `variable` defaults to `TS`, and `alpha` defaults to `0.05`.

| Parameter | Type | Required / default | Validation and meaning |
| --- | --- | --- | --- |
| `variable` | string | Optional; `TS` | Must name a variable in the dataset. Matching is case-sensitive. |
| `west` | number | Required | Longitude in `[-180, 180]`; must be less than `east`. |
| `south` | number | Required | Latitude in `[-90, 90]`; must be less than `north`. |
| `east` | number | Required | Longitude in `[-180, 180]`; must be greater than `west`. |
| `north` | number | Required | Latitude in `[-90, 90]`; must be greater than `south`. |
| `start_date` | string | Required | Exact ISO date format `YYYY-MM-DD`; inclusive start. |
| `end_date` | string | Required | Exact ISO date format `YYYY-MM-DD`; inclusive end and on or after `start_date`. |
| `alpha` | number | Optional; `0.05` | Must be finite and strictly between 0 and 1; significance threshold. |

Coordinates must be finite values; booleans are not accepted as numbers. Bounding boxes crossing the antimeridian are not supported because `west < east` is required. The selected spatial grid must contain at most `5,000` pixels (`latitudes * longitudes`). A larger selection is rejected before the subset is loaded; zoom in to a smaller bounding box.

GET example:

```text
GET http://127.0.0.1:5000/api/analyze?variable=TS&west=-15&south=30&east=5&north=45&start_date=2000-01-01&end_date=2010-12-31&alpha=0.05
```

POST example:

```http
POST /api/analyze
Content-Type: application/json
```

```json
{
  "variable": "TS",
  "west": -15,
  "south": 30,
  "east": 5,
  "north": 45,
  "start_date": "2000-01-01",
  "end_date": "2010-12-31",
  "alpha": 0.05
}
```

The successful response is a GeoJSON `FeatureCollection` with additional analysis metadata, described below. The entire result is JSON-safe: NumPy values are converted to native JSON values and non-finite floating-point values become `null`.

| Status | Meaning |
| --- | --- |
| `200` | Analysis completed; `features` may be empty when no pixels meet the minimum-valid-observation requirement. |
| `400` | Invalid/missing parameters, unknown variable, unsupported dimensions, empty selected subset, insufficient regional time steps, or selected region exceeds the pixel limit. |
| `500` | Remote dataset/upstream or unexpected internal analysis failure. |

Errors use this shape:

```json
{"error":"The selected region exceeds the 5,000-pixel limit. Zoom in to a smaller bounding box."}
```

Client code should display the returned error text where appropriate and should not assume that every valid request produces at least one pixel feature.

## 3. Backend Execution Pipeline (Input $\\rightarrow$ Output Walkthrough)

1. **Parse and validate.** The route reads query parameters or a JSON object, applies defaults, checks coordinate ranges and ordering, validates exact ISO dates and date order, and checks that `alpha` is finite and in `(0, 1)`.
2. **Access and slice the remote dataset.** `get_dataset()` uses a lock-protected singleton, opens `HfFileSystem` and `xr.open_zarr()` on first use, and tries consolidated metadata before falling back to unconsolidated metadata. `slice_data()` selects the requested variable, inclusive time range, and lat/lon bounds using coordinate-direction-aware slices. It checks the pixel limit before `.load()`, then loads only the selected subset into RAM. The underlying Hugging Face filesystem/Zarr access reads remote metadata and chunks as requested; no complete local disk copy is created.
3. **Analyze the regional spatial median.** `_analyze_regional()` takes the spatial median at each timestamp. For records with at least 60 monthly observations (five 12-month cycles), it fits robust STL and tests the deseasonalized series. Shorter records skip STL and test the raw median; `record_note` explains this condition. The regional test suite includes ordinary Mann-Kendall, Hamed-Rao modified Mann-Kendall, Seasonal Mann-Kendall, Sen's slope and 95% confidence interval, Spearman correlation, ADF/KPSS stationarity tests, Ljung-Box autocorrelation tests, and Pettitt, SNHT, and Buishand change-point tests. Some tests report `available: false` when the record is too short or unsuitable.
4. **Analyze pixels in parallel.** `_analyze_pixel()` evaluates eligible grid cells using the same trend, seasonal, slope, and stationarity methods. A cell needs at least `max(10, ceil(0.80 * time_steps))` finite observations. Gaps are interpolated for analysis after this threshold is met. `joblib.Parallel` uses `n_jobs=-1` and prefers threads to process pixel tasks. This is parallel threaded work; it does not promise a separate process per CPU core.
5. **Build the response.** `run_analysis()` combines regional results, grid counts, time-series arrays, and GeoJSON point features. `_json_safe()` converts NumPy/Pandas values and replaces non-finite numbers with JSON `null` before Flask serializes the result.

## 4. Complete Output Schema & Frontend Mapping Guide

### Top-level FeatureCollection

```ts
interface TrendFeatureCollection {
  type: "FeatureCollection";
  metadata: AnalysisMetadata;
  features: PixelFeature[];
}

interface PixelFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [longitude: number, latitude: number];
  };
  properties: PixelProperties;
}
```

### `metadata`

| Field | Type | Description |
| --- | --- | --- |
| `source` | string | Hugging Face Zarr URI. |
| `variable` | string | Analyzed dataset variable. |
| `units` | string or `null` | Variable's source units attribute. |
| `bounding_box` | `[west, south, east, north]` | Requested extent. |
| `start_date`, `end_date` | string | Requested inclusive date bounds. |
| `alpha` | number | Significance threshold used by the tests. |
| `seasonal_period` | number | Seasonal period; currently 12 monthly samples. |
| `grid` | object | `time_steps`, `latitudes`, `longitudes`, `pixels_total`, `pixels_analyzed`, `pixels_significant`, `significant_percent`. |
| `regional_summary` | object | Regional test results described next. |
| `regional_timeseries` | object | Aligned timestamp and spatial-median component arrays described below. |

`pixels_analyzed` counts pixels that passed the finite-observation threshold; `pixels_significant` counts features with modified Mann-Kendall `p_value < alpha`. Percent is `0.0` if no pixels were analyzed.

### `metadata.regional_summary`

- `test_basis`: string describing whether trend tests used the STL-deseasonalized or raw regional median.
- `record_note`: string for a short record that skipped STL; otherwise `null`.
- `mann_kendall`: `s`, `z`, `tau`, `p_value`, `trend`, and `significant`.
- `hamed_rao_modified_mann_kendall`: `z`, `p_value`, `variance_correction`, `trend`, and `significant`. This is the primary significance measure for pixel features.
- `seasonal_mann_kendall`: when available, `available`, `z`, `p_value`, `slope_per_year`, and `trend`; otherwise `available: false` and `reason`.
- `sen_slope`: `per_month`, `per_decade`, `intercept`, `ci_95_per_month`, and `ci_95_per_decade`. Each confidence interval is a two-element `[lower, upper]` array; a non-finite endpoint is `null`.
- `spearman`: `rho`, `p_value`, and `significant`; these are `null` for a constant test series.
- `stationarity`: always has `available`. If false, `reason` explains why. If true, includes `adf_statistic`, `adf_p_value`, `adf_stationary`, `kpss_statistic`, `kpss_p_value`, `kpss_stationary`, `kpss_p_value_at_table_bound`, and `warnings`. The regional result also includes `adf_trend_statistic`, `adf_trend_p_value`, `adf_trend_stationary`, `kpss_trend_statistic`, `kpss_trend_p_value`, and `kpss_trend_stationary` when available.
- `ljung_box`: array of `{lag, statistic, p_value}`. For a constant series, statistic and p-value are `null`.
- `change_points`: `pettitt`, `snht`, and `buishand`. Available results have `available`, `statistic`, `index`, `p_value`, and `change`; unavailable SNHT/Buishand results have `available: false` and `reason`.

### `metadata.regional_timeseries`

All arrays align by index with `timestamps`:

| Field | Type | Description |
| --- | --- | --- |
| `timestamps` | string[] | ISO timestamps from the selected time coordinate. |
| `raw_median` | number[] | Spatial median for each timestamp before decomposition. |
| `deseasonalized` | number[] | Series used for trend tests when STL is available; otherwise a copy of the raw median. |
| `seasonal` | `(number | null)[]` | STL seasonal component, or `null` at every index when STL was skipped. |
| `trend` | `(number | null)[]` | STL trend component, or `null` at every index when STL was skipped. |

### `features[i]`

`geometry.coordinates` is always `[lon, lat]`, the GeoJSON order used by Deck.gl. `properties` contains:

| Property | Type | Description |
| --- | --- | --- |
| `lat`, `lon` | number | Pixel center coordinates. |
| `n_valid` | number | Finite observations before interpolation. |
| `slope` | number | Theil-Sen slope per time step (monthly for the current dataset). |
| `slope_intercept` | number | Theil-Sen intercept for the fitted index-based line. |
| `slope_ci_95` | `[number | null, number | null]` | 95% confidence interval for slope per time step. |
| `p_value` | number | Hamed-Rao modified Mann-Kendall p-value. |
| `z` | number | Hamed-Rao modified Mann-Kendall z statistic. |
| `tau` | number | Ordinary Mann-Kendall Kendall tau. |
| `trend` | `"increasing" | "decreasing" | "no trend"` | Modified Mann-Kendall direction at the requested alpha. |
| `significant` | boolean | Modified Mann-Kendall p-value is less than alpha. |
| `mann_kendall_significant` | boolean | Ordinary Mann-Kendall p-value is less than alpha. |
| `seasonal_mk_p_value` | number or `null` | Seasonal Mann-Kendall p-value, or null when unavailable. |
| `seasonal_mk_significant` | boolean or `null` | Seasonal significance, or null when unavailable. |
| `adf_stationary` | boolean or `null` | ADF stationarity result, or null when unavailable. |
| `kpss_stationary` | boolean or `null` | KPSS stationarity result, or null when unavailable. |

### Example successful response

This is a full response shape generated from a small synthetic 12-month, one-pixel input. Real values and test availability depend on the requested dataset subset.

```json
{
  "type": "FeatureCollection",
  "metadata": {
    "source": "hf://datasets/ChahediCodeLabs/m2tmnxslv-zarr/",
    "variable": "TS",
    "units": "K",
    "bounding_box": [19.5, 9.5, 20.5, 10.5],
    "start_date": "2000-01-01",
    "end_date": "2000-12-01",
    "alpha": 0.05,
    "seasonal_period": 12,
    "grid": {
      "time_steps": 12,
      "latitudes": 1,
      "longitudes": 1,
      "pixels_total": 1,
      "pixels_analyzed": 1,
      "pixels_significant": 1,
      "significant_percent": 100.0
    },
    "regional_summary": {
      "test_basis": "raw regional spatial median (short record; STL not fitted)",
      "record_note": "Short record: fewer than five seasonal cycles; STL was not fitted and trend tests use the raw regional median.",
      "mann_kendall": {
        "s": 60.0,
        "z": 4.045780339810076,
        "tau": 0.9090909090909091,
        "p_value": 5.2149115824402456e-05,
        "trend": "increasing",
        "significant": true
      },
      "hamed_rao_modified_mann_kendall": {
        "z": 3.3476411750804917,
        "p_value": 0.000815024640350979,
        "variance_correction": 1.4605848696757788,
        "trend": "increasing",
        "significant": true
      },
      "seasonal_mann_kendall": {
        "available": false,
        "reason": "insufficient observations in each seasonal group"
      },
      "sen_slope": {
        "per_month": 0.6873015873015875,
        "per_decade": 82.47619047619051,
        "intercept": 280.3198412698413,
        "ci_95_per_month": [0.5999999999999943, 0.8000000000000114],
        "ci_95_per_decade": [71.99999999999932, 96.00000000000136]
      },
      "spearman": {
        "rho": 0.9790209790209792,
        "p_value": 3.089801398548709e-08,
        "significant": true
      },
      "stationarity": {
        "available": false,
        "reason": "requires 20+ non-constant observations"
      },
      "ljung_box": [
        {"lag": 5, "statistic": 12.718410520659825, "p_value": 0.026165423746054225}
      ],
      "change_points": {
        "pettitt": {
          "available": true,
          "statistic": 35.0,
          "index": 5,
          "p_value": 0.03943368531462139,
          "change": true
        },
        "snht": {
          "available": true,
          "statistic": 8.060118653198433,
          "index": 7,
          "p_value": 0.006496751624187906,
          "change": true
        },
        "buishand": {
          "available": true,
          "statistic": 4.848574987061822,
          "index": 7,
          "p_value": 0.011494252873563218,
          "change": true
        }
      }
    },
    "regional_timeseries": {
      "timestamps": [
        "2000-01-01T00:00:00", "2000-02-01T00:00:00", "2000-03-01T00:00:00",
        "2000-04-01T00:00:00", "2000-05-01T00:00:00", "2000-06-01T00:00:00",
        "2000-07-01T00:00:00", "2000-08-01T00:00:00", "2000-09-01T00:00:00",
        "2000-10-01T00:00:00", "2000-11-01T00:00:00", "2000-12-01T00:00:00"
      ],
      "raw_median": [280.1, 281.0, 282.0, 281.4, 283.2, 284.0, 283.5, 285.1, 286.0, 285.4, 287.2, 288.0],
      "deseasonalized": [280.1, 281.0, 282.0, 281.4, 283.2, 284.0, 283.5, 285.1, 286.0, 285.4, 287.2, 288.0],
      "seasonal": [null, null, null, null, null, null, null, null, null, null, null, null],
      "trend": [null, null, null, null, null, null, null, null, null, null, null, null]
    }
  },
  "features": [
    {
      "type": "Feature",
      "geometry": {"type": "Point", "coordinates": [20.0, 10.0]},
      "properties": {
        "lat": 10.0,
        "lon": 20.0,
        "n_valid": 12,
        "slope": 0.6873015873015875,
        "slope_intercept": 280.3198412698413,
        "slope_ci_95": [0.5999999999999943, 0.8000000000000114],
        "p_value": 0.000815024640350979,
        "z": 3.3476411750804917,
        "tau": 0.9090909090909091,
        "trend": "increasing",
        "significant": true,
        "mann_kendall_significant": true,
        "seasonal_mk_p_value": null,
        "seasonal_mk_significant": null,
        "adf_stationary": null,
        "kpss_stationary": null
      }
    }
  ]
}
```

### Frontend Integration Mapping

| Frontend view | Contract fields | Suggested use |
| --- | --- | --- |
| 3D Globe / Deck.gl map layer | `features[i].geometry.coordinates`, `features[i].properties.slope`, `p_value`, `significant`, `trend` | Position is `[lon, lat]`; color or height can encode slope, and filters can use significance/trend. `p_value` is the Hamed-Rao modified MK p-value. |
| Regional Overview Cards | `metadata.regional_summary` | Show regional slope and confidence interval, primary modified MK result, seasonal result availability, stationarity, and change-point summaries. Respect `available` and `null` values. |
| Time-Series Charts / Plotly | `metadata.regional_timeseries.timestamps`, `raw_median`, `deseasonalized`, `seasonal`, `trend` | Use `timestamps` as the shared x-axis. STL component arrays contain nulls when the record is too short for decomposition. |
| Controls and labels | `GET /api/metadata` response | Populate variable choices from `variables`; constrain date pickers with `time_range`; initialize map extent from `spatial_bounds`. |
