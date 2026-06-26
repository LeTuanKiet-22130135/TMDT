#!/usr/bin/env bash
# Run both backend services with uvicorn --reload in parallel

set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

cleanup() {
  echo ""
  echo "Stopping services..."
  kill "$PID1" "$PID2" 2>/dev/null
  wait "$PID1" "$PID2" 2>/dev/null
  exit 0
}
trap cleanup INT TERM

echo "[bk-tmdt]  starting on :8000"
(cd "$ROOT/bk-tmdt" && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload) &
PID1=$!

echo "[bk-cacao] starting on :8001"
(cd "$ROOT/bk-cacao" && uv run uvicorn main:app --host 0.0.0.0 --port 8001 --reload) &
PID2=$!

wait "$PID1" "$PID2"
