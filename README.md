# GEO-FLEX — Earth Intelligence Platform
**Understand Earth. Detect Change. Reveal the Future.**

NASA Space Apps Challenge prototype: pick an Earth-science variable, a region and a period; GEO-FLEX answers
**what / where / how / how much is changing — and is it statistically significant?**

## Run it
Requirements: Python 3.10+, Node 20+.

```bash
./run.sh                 # installs deps, builds the UI, serves everything at http://localhost:5000
```
Development (hot reload):
```bash
cd backend  && pip install -r requirements.txt && uvicorn app.main:app --reload --port 5000
cd frontend && npm install && npm run dev        # http://localhost:5173 (proxies /api to :5000)
```
Tests: `cd backend && python -m pytest` (includes cross-checks against `pymannkendall`).

The MERRA-2 Trend API is implemented in the existing FastAPI backend (the repository does not contain the Flask app described in the supplied contract). `GET /api/health`, `GET /api/metadata`, and `GET`/`POST /api/analyze` follow the contract. The previous synchronous analysis endpoint remains at `/api/analyze/legacy`; the existing progress stream stays at `/api/analyze/stream`.

The **MERRA-2** navigation page uses the actual public Hugging Face Zarr v3 dataset, with lazy remote reads and no synthetic fallback. This dataset requires Python 3.11+ (the pre-existing GEO-FLEX services continue to support Python 3.10). Set `HF_TOKEN` only if Hugging Face access requires authentication. If the remote store cannot be reached, the API reports an error instead of substituting another dataset.

## Data honesty (important)
Every result carries one badge: **LIVE DATA**, **HISTORICAL DATA** or **DEMONSTRATION DATA**.
* **NASA POWER** (monthly MERRA-2: temperature, precipitation, humidity, pressure, soil wetness) is the real connector, no key needed. Dataset mode `auto` uses it when reachable.
* If NASA is unreachable, `auto` falls back to a **synthetic demo generator**, loudly labelled — it is never presented as NASA data. In the build sandbox NASA was blocked, so the screenshots/tests used demo data; **run on your own machine with internet to get real POWER data**, and check the sidebar for "NASA POWER reachable".
* Variables without a connector (NDVI, sea level, ocean, cryosphere…) are listed as *Not connected* rather than faked. NASA Earthdata (MODIS etc.) needs a free account/token; adding a connector means implementing `datasets/base.py::Connector` and registering it in `services/data_service.py`.
* `GISTEMP` connector exists for global temperature anomalies.

## What is implemented
| Area | Where |
|---|---|
| Linear regression (+autocorrelation-robust p), Mann-Kendall (autocorr-corrected), Sen's slope + CI | `backend/app/statistics/trend.py` |
| Seasonal decomposition (STL), per-month trends, anomalies (robust-z + IsolationForest) | `statistics/timeseries.py` |
| Per-cell grid trends with Benjamini–Hochberg FDR | `geospatial/grid.py` |
| Discover Earth screening (54 variable×region tests, FDR) | `services/discovery.py` |
| Deterministic explanation engine (no API key) | `services/explain.py` |
| PDF / CSV reports | `services/report.py` |
| Streaming analysis pipeline (real progress steps) | `analysis/pipeline.py` |
| Contract-based MERRA-2 API, lazy Zarr reader, regional/pixel trends, GeoJSON, and null-aware test results | `backend/app/datasets/merra2.py`, `backend/app/analysis/merra2.py`, `backend/app/api/merra2_routes.py` |
| UI: Overview (3D globe + map), Explore Earth, Data Explorer, MERRA-2 analysis, Change Analysis, Discover Earth, AI Insights, Reports, About, guided demo | `frontend/src` |

## Demo script (Morocco surface temperature)
Click **Guided demo** on the Overview — it walks the 10 steps: dashboard → variable → Morocco → 1991–2025 → analyze →
time series → map → significance → ask the assistant → report.

## Known limitations
* Analyses live in server memory; restart = re-run.
* Grid cells are NASA-POWER cell values at sample points (~0.5° native), not interpolated fields.
* Basemap tiles (CARTO / NASA GIBS) and Google Fonts need internet; analysis does not.
* Statistical significance ≠ causation; the app says so wherever it interprets results.
