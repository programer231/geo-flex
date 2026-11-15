"""Flask REST API for regional and pixel-wise MERRA-2 trend analysis."""

from datetime import date
import math

from flask import Flask, jsonify, request
from flask_cors import CORS

from .engine import HF_ZARR_URI, get_dataset, run_analysis, slice_data

app = Flask(__name__)
CORS(app)


def _error(message, status=400):
    return jsonify({"error": message}), status


def _parse_date(value, name):
    if not isinstance(value, str):
        raise ValueError(f"{name} must be an ISO date in YYYY-MM-DD format.")
    try:
        parsed = date.fromisoformat(value)
    except ValueError as exc:
        raise ValueError(f"{name} must be an ISO date in YYYY-MM-DD format.") from exc
    if parsed.isoformat() != value:
        raise ValueError(f"{name} must be an ISO date in YYYY-MM-DD format.")
    return parsed.isoformat()


def _parse_parameters(params):
    variable = params.get("variable", "TS")
    if not isinstance(variable, str) or not variable.strip():
        raise ValueError("variable must be a non-empty string.")

    coordinate_names = ("west", "south", "east", "north")
    missing = [name for name in coordinate_names if name not in params]
    if missing:
        raise ValueError(f"Missing required parameter(s): {', '.join(missing)}.")
    raw_bounds = tuple(params[name] for name in coordinate_names)
    if any(isinstance(value, bool) for value in raw_bounds):
        raise ValueError("west, south, east, and north must be numbers.")
    try:
        bounds = tuple(float(value) for value in raw_bounds)
    except (TypeError, ValueError) as exc:
        raise ValueError("west, south, east, and north must be numbers.") from exc
    if not all(math.isfinite(value) for value in bounds):
        raise ValueError("Bounding coordinates must be finite numbers.")
    west, south, east, north = bounds
    if not -180 <= west <= 180 or not -180 <= east <= 180:
        raise ValueError("Longitude bounds must be between -180 and 180.")
    if not -90 <= south <= 90 or not -90 <= north <= 90:
        raise ValueError("Latitude bounds must be between -90 and 90.")
    if west >= east:
        raise ValueError("west must be less than east.")
    if south >= north:
        raise ValueError("south must be less than north.")

    if "start_date" not in params or "end_date" not in params:
        raise ValueError("start_date and end_date are required.")
    start_date = _parse_date(params["start_date"], "start_date")
    end_date = _parse_date(params["end_date"], "end_date")
    if start_date > end_date:
        raise ValueError("start_date must be on or before end_date.")

    raw_alpha = params.get("alpha", 0.05)
    if isinstance(raw_alpha, bool):
        raise ValueError("alpha must be a number greater than 0 and less than 1.")
    try:
        alpha = float(raw_alpha)
    except (TypeError, ValueError) as exc:
        raise ValueError("alpha must be a number greater than 0 and less than 1.") from exc
    if not math.isfinite(alpha) or not 0 < alpha < 1:
        raise ValueError("alpha must be a number greater than 0 and less than 1.")

    return variable.strip(), bounds, start_date, end_date, alpha


def _request_parameters():
    if request.method == "GET":
        return request.args
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        raise ValueError("POST requests must contain a JSON object.")
    return payload


@app.get("/api/health")
def health():
    return jsonify({"status": "ok"}), 200


@app.get("/api/metadata")
def metadata():
    try:
        dataset = get_dataset()
        variables = [
            {
                "name": name,
                "units": data_array.attrs.get("units"),
                "long_name": data_array.attrs.get("long_name"),
            }
            for name, data_array in dataset.data_vars.items()
        ]
        latitudes = dataset["lat"].values
        longitudes = dataset["lon"].values
        time_range = [
            str(dataset["time"].min().values)[:10],
            str(dataset["time"].max().values)[:10],
        ]
        return jsonify({
            "source": HF_ZARR_URI,
            "variables": variables,
            "time_range": time_range,
            "spatial_bounds": [
                float(longitudes.min()),
                float(latitudes.min()),
                float(longitudes.max()),
                float(latitudes.max()),
            ],
        })
    except Exception:
        app.logger.exception("Unable to read dataset metadata")
        return _error("Dataset metadata is temporarily unavailable.", 500)


@app.route("/api/analyze", methods=["GET", "POST"])
def analyze():
    try:
        variable, bounds, start_date, end_date, alpha = _parse_parameters(
            _request_parameters()
        )
    except ValueError as exc:
        return _error(str(exc))

    try:
        dataset = get_dataset()
        if variable not in dataset.data_vars:
            return _error(
                f"Unknown variable {variable!r}; available variables are "
                f"{list(dataset.data_vars)}."
            )
        data_array = slice_data(
            dataset,
            variable,
            bounds,
            start_date,
            end_date,
        )
        result = run_analysis(
            data_array,
            variable,
            bounds,
            start_date,
            end_date,
            alpha,
        )
        return jsonify(result), 200
    except (KeyError, ValueError) as exc:
        return _error(str(exc))
    except Exception:
        app.logger.exception("Trend analysis failed")
        return _error("Trend analysis failed.", 500)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
