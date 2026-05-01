/**
 * Smoke / performance checks against ecommerce API.
 * Prerequisites: API running (e.g. flask) at K6_TARGET or http://127.0.0.1:5004
 *
 * The ecommerce API uses Flask-Limiter with a default of "100 per minute" (see
 * ecommerce_api/app/config.py RATELIMIT_DEFAULT). Bursty traffic from many VUs
 * will return 429 and fail the http_req_failed threshold. This script paces
 * requests below that limit by default.
 *
 * For heavier load, run the API with a higher limit or RATELIMIT_ENABLED=0
 * (dev only) and set K6_AGGRESSIVE=1.
 */
import http from 'k6/http'
import { check, sleep } from 'k6'

const TARGET = __ENV.K6_TARGET || 'http://127.0.0.1:5004'
const PRODUCTS = `${TARGET.replace(/\/$/, '')}/api/products`
const AGGRESSIVE = __ENV.K6_AGGRESSIVE === '1'

// 90 requests/minute sustained (under default 100/min Flask-Limiter cap).
// Note: k6 requires `rate` to be an integer—use timeUnit '1m' for per-minute pacing.
const gentle = {
  scenarios: {
    catalog: {
      executor: 'constant-arrival-rate',
      rate: 90,
      timeUnit: '1m',
      duration: '45s',
      preAllocatedVUs: 5,
      maxVUs: 15,
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
  },
}

const aggressive = {
  vus: 5,
  duration: '20s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
  },
}

export const options = AGGRESSIVE ? aggressive : gentle

export default function () {
  const res = http.get(PRODUCTS)
  check(res, {
    'products 200': (r) => r.status === 200,
    'has json': (r) => String(r.headers['Content-Type'] || '').includes('json'),
  })
  if (AGGRESSIVE) {
    sleep(0.3)
  }
}
