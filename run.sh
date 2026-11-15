#!/usr/bin/env bash
# One-command start: builds the frontend (if needed) and serves everything from FastAPI on :5000.
set -e
cd "$(dirname "$0")"
python3 -m pip install -q -r backend/requirements.txt --break-system-packages 2>/dev/null || python3 -m pip install -q -r backend/requirements.txt
[ -d frontend/node_modules ] || (cd frontend && npm install)
[ -d frontend/dist ] || (cd frontend && npm run build)
cd backend && exec python3 -m uvicorn app.main:app --port 5000
