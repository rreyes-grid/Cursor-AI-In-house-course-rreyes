#!/usr/bin/env bash
# OWASP ZAP baseline scan against a reachable URL (API or site).
#
# IMPORTANT: ZAP runs inside Docker. http://127.0.0.1 or http://localhost in the
# container is NOT your Mac/Linux host—they point at the container itself, so you
# get "connection refused". This script rewrites loopback URLs to host.docker.internal
# (Docker Desktop) and passes --add-host=host.docker.internal:host-gateway (Linux Docker).
#
# Usage:
#   ZAP_TARGET=http://127.0.0.1:5004 bash scripts/qa/zap-baseline.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
OUT="${ROOT}/qa-reports/zap"
TARGET="${ZAP_TARGET:-}"

if [[ -z "$TARGET" ]]; then
  echo "Set ZAP_TARGET to a reachable http(s) URL (e.g. http://127.0.0.1:5004 — will be rewired for Docker)." >&2
  exit 2
fi

# URL handed to zap-baseline: reach host apps from inside the container
SCAN_URL="$TARGET"
if [[ "$SCAN_URL" == *"127.0.0.1"* ]] || [[ "$SCAN_URL" == *"localhost"* ]]; then
  SCAN_URL="${SCAN_URL//127.0.0.1/host.docker.internal}"
  SCAN_URL="${SCAN_URL//localhost/host.docker.internal}"
  echo "Docker: scanning host service at $SCAN_URL (rewritten from $TARGET)" >&2
fi

mkdir -p "$OUT"

docker run --rm \
  --add-host=host.docker.internal:host-gateway \
  -v "${OUT}:/zap/wrk/:rw" \
  ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py \
  -t "$SCAN_URL" \
  -J zap-report.json \
  -x zap-report.xml || true

echo "Reports written under ${OUT} (baseline may exit non-zero when findings exist)."
