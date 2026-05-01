#!/usr/bin/env bash
# Run the full local QA pipeline (see package.json "qa:*" scripts).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${ROOT}"
mkdir -p qa-reports/raw

export NODE_OPTIONS="${NODE_OPTIONS:-}"

echo "== Vitest (unit + coverage) =="
npm run qa:test:unit

echo "== ESLint =="
npm run qa:lint:ts

echo "== ESLint complexity export (lib + ui) =="
npx eslint "src/lib" "src/components/ui" --format json --output-file qa-reports/raw/eslint-lib-ui.json || true

echo "== npm audit =="
npm audit --audit-level=high

echo "== Snyk (optional) =="
if [[ -n "${SNYK_TOKEN:-}" ]]; then
  npx -y snyk@latest test --severity-threshold=high --json-file-output=qa-reports/raw/snyk.json || true
fi
[[ -s qa-reports/raw/snyk.json ]] || echo '{"vulnerabilities":[]}' > qa-reports/raw/snyk.json

echo "== Python (ecommerce_api) =="
bash scripts/qa/python-checks.sh

echo "== k6 (optional; needs API at K6_TARGET) =="
if command -v k6 >/dev/null 2>&1 && [[ -n "${RUN_K6:-}" ]]; then
  k6 run k6/scripts/ecommerce-smoke.js --summary-export=qa-reports/raw/k6-summary.json
else
  echo "Skip k6 (install k6 and set RUN_K6=1; start API or set K6_TARGET)."
  echo '{}' > qa-reports/raw/k6-summary.json
fi

echo "== OWASP ZAP baseline (optional; Docker + ZAP_TARGET) =="
if [[ -n "${RUN_ZAP:-}" && -n "${ZAP_TARGET:-}" ]]; then
  bash scripts/qa/zap-baseline.sh
else
  echo "Skip ZAP (set RUN_ZAP=1 and ZAP_TARGET=https://...)."
fi

echo "== Aggregate metrics + dashboard =="
node scripts/qa/build-metrics.mjs

echo "Done. Open qa-reports/dashboard/index.html"
