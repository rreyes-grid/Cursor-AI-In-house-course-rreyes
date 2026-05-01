#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
API="${ROOT}/ecommerce_api"
OUT="${ROOT}/qa-reports"
RAW="${OUT}/raw"
VENV="${ROOT}/.qa-venv"
mkdir -p "${RAW}" "${OUT}/coverage"

if [[ ! -x "${VENV}/bin/python" ]]; then
  python3 -m venv "${VENV}"
fi
# shellcheck disable=SC1091
source "${VENV}/bin/activate"
pip install -q -r "${API}/requirements-dev.txt"

cd "${API}"
pylint app run.py --output-format=json > "${RAW}/pylint.json" || true
radon cc app -a > "${RAW}/radon.txt" || true
pytest tests/ -q --tb=short \
  --cov=app \
  --cov-report=term-missing \
  --cov-report=json:"${OUT}/coverage/backend-coverage.json"

pip-audit -r requirements.txt -f json > "${RAW}/pip-audit.json" || true

echo "Python QA artifacts under ${OUT}"
