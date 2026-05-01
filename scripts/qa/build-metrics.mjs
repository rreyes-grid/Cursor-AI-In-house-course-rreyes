#!/usr/bin/env node
/**
 * Aggregates QA outputs into qa-reports/metrics.json and qa-reports/dashboard/index.html
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '../..')
const OUT = join(ROOT, 'qa-reports')
const RAW = join(OUT, 'raw')

function readJson(path) {
  try {
    if (!existsSync(path)) return null
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return null
  }
}

function readText(path) {
  try {
    if (!existsSync(path)) return null
    return readFileSync(path, 'utf8')
  } catch {
    return null
  }
}

function frontendCoveragePct() {
  const s = readJson(join(OUT, 'coverage/frontend/coverage-summary.json'))
  if (!s?.total?.lines?.pct) return null
  return Number(s.total.lines.pct)
}

function backendCoveragePct() {
  const j = readJson(join(OUT, 'coverage/backend-coverage.json'))
  if (j?.totals?.percent_covered != null) return Number(j.totals.percent_covered)
  return null
}

function radonAverageComplexity() {
  const t = readText(join(RAW, 'radon.txt'))
  if (!t) return null
  let m = t.match(/Average complexity[^0-9]*([\d.]+)/i)
  if (!m) m = t.match(/\(\s*([\d.]+)\s*\)\s*$/) // fallback " … (5.2)"
  return m ? Number(m[1]) : null
}

function eslintMaxComplexity() {
  const rows = readJson(join(RAW, 'eslint-lib-ui.json'))
  if (!Array.isArray(rows)) return null
  let max = 0
  for (const file of rows) {
    for (const m of file.messages || []) {
      if (m.ruleId === 'complexity' && typeof m.message === 'string') {
        const g = m.message.match(/(\d+)/)
        if (g) max = Math.max(max, Number(g[1]))
      }
    }
  }
  return max || null
}

function snykCriticalCount() {
  const j = readJson(join(RAW, 'snyk.json'))
  if (!j || !Array.isArray(j.vulnerabilities)) return null
  return j.vulnerabilities.filter((v) => (v.severity || '').toLowerCase() === 'critical').length
}

function zapHighCount() {
  const j = readJson(join(OUT, 'zap/zap-report.json'))
  if (!j) return null
  const alerts = j.site?.[0]?.alerts || j.alerts || []
  let high = 0
  for (const a of alerts) {
    const risk = (a.riskdesc || a.risk || '').toLowerCase()
    if (risk.includes('high')) high++
  }
  return high
}

function k6Metrics() {
  const j = readJson(join(RAW, 'k6-summary.json'))
  if (!j?.metrics) return { p95Ms: null, errorRatePct: null }
  const d = j.metrics.http_req_duration?.values?.['p(95)']
  const p95Ms = d != null ? Number(d) : null
  const failed = j.metrics.http_req_failed?.values?.rate
  const errorRatePct = failed != null ? Number(failed) * 100 : null
  return { p95Ms, errorRatePct }
}

const targets = {
  coveragePct: 80,
  complexityMax: 10,
  criticalVulns: 0,
  highZap: 0,
  p95Ms: 500,
  errorRatePct: 1,
}

const fe = frontendCoveragePct()
const be = backendCoveragePct()
const coverageBlend =
  fe != null && be != null ? (fe + be) / 2 : fe ?? be ?? null

const radonAvg = radonAverageComplexity()
const tsComplexity = eslintMaxComplexity()
const pythonComplexityPass =
  radonAvg != null ? radonAvg < targets.complexityMax : null
const tsComplexityPass =
  tsComplexity != null ? tsComplexity <= targets.complexityMax : null

const snykCrit = snykCriticalCount()
const zapHigh = zapHighCount()
const { p95Ms, errorRatePct } = k6Metrics()

const metrics = {
  generatedAt: new Date().toISOString(),
  targets,
  results: {
    frontendCoverageLinesPct: fe,
    backendCoverageLinesPct: be,
    blendedCoveragePct: coverageBlend,
    pythonAvgComplexity: radonAvg,
    typescriptMaxComplexity: tsComplexity,
    snykCritical: snykCrit,
    zapHigh: zapHigh,
    k6P95Ms: p95Ms,
    k6ErrorRatePct: errorRatePct,
  },
  pass: {
    coverage:
      coverageBlend != null ? coverageBlend >= targets.coveragePct : null,
    complexityPython: pythonComplexityPass,
    complexityTypeScript: tsComplexityPass,
    securityCritical:
      snykCrit != null ? snykCrit <= targets.criticalVulns : null,
    securityZapHigh: zapHigh != null ? zapHigh <= targets.highZap : null,
    perfP95: p95Ms != null ? p95Ms < targets.p95Ms : null,
    perfErrors:
      errorRatePct != null ? errorRatePct < targets.errorRatePct : null,
  },
}

mkdirSync(join(OUT, 'dashboard'), { recursive: true })
writeFileSync(join(OUT, 'metrics.json'), JSON.stringify(metrics, null, 2), 'utf8')

const chartData = JSON.stringify({
  labels: [
    'Coverage %',
    'Python CC (inv)',
    'TS max CC (inv)',
    'Snyk critical',
    'ZAP high',
    'k6 p95 (ms)',
    'k6 err %',
  ],
  targets: [
    targets.coveragePct,
    targets.complexityMax,
    targets.complexityMax,
    targets.criticalVulns,
    targets.highZap,
    targets.p95Ms,
    targets.errorRatePct,
  ],
  actual: [
    coverageBlend ?? 0,
    radonAvg != null ? radonAvg * 10 : 0,
    tsComplexity != null ? tsComplexity * 10 : 0,
    snykCrit ?? 0,
    zapHigh ?? 0,
    p95Ms ?? 0,
    errorRatePct ?? 0,
  ],
})

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>QA quality dashboard</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.6/dist/chart.umd.min.js"></script>
  <style>
    :root { color-scheme: light dark; font-family: system-ui, sans-serif; }
    body { margin: 24px; max-width: 1100px; }
    h1 { font-size: 1.25rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
    .card { border: 1px solid #8884; border-radius: 8px; padding: 12px; }
    .ok { color: #0a0; } .bad { color: #c00; } .na { color: #888; }
    pre { font-size: 12px; overflow: auto; }
  </style>
</head>
<body>
  <h1>QA metrics</h1>
  <p>Generated: <code>${metrics.generatedAt}</code></p>
  <div class="grid" id="cards"></div>
  <canvas id="chart" height="120"></canvas>
  <h2>Raw metrics.json</h2>
  <pre id="raw"></pre>
  <script>
    const metrics = ${JSON.stringify(metrics)};
    const chartPayload = ${chartData};

    function pill(ok) {
      if (ok === null) return '<span class="na">n/a</span>';
      return ok ? '<span class="ok">pass</span>' : '<span class="bad">fail</span>';
    }
    const cards = [
      ['Blended coverage %', (metrics.results.blendedCoveragePct ?? 'n/a') + ' (target ≥ ' + metrics.targets.coveragePct + ')', pill(metrics.pass.coverage)],
      ['Python avg complexity', metrics.results.pythonAvgComplexity ?? 'n/a', pill(metrics.pass.complexityPython)],
      ['TS max complexity (lib/ui)', metrics.results.typescriptMaxComplexity ?? 'n/a', pill(metrics.pass.complexityTypeScript)],
      ['Snyk critical', metrics.results.snykCritical ?? 'n/a', pill(metrics.pass.securityCritical)],
      ['ZAP high', metrics.results.zapHigh ?? 'n/a', pill(metrics.pass.securityZapHigh)],
      ['k6 p95 (ms)', metrics.results.k6P95Ms ?? 'n/a', pill(metrics.pass.perfP95)],
      ['k6 error rate %', metrics.results.k6ErrorRatePct ?? 'n/a', pill(metrics.pass.perfErrors)],
    ];
    document.getElementById('cards').innerHTML = cards
      .map(([t, v, p]) => '<div class="card"><strong>' + t + '</strong><div>' + v + '</div><div>' + p + '</div></div>')
      .join('');
    document.getElementById('raw').textContent = JSON.stringify(metrics, null, 2);

    const ctx = document.getElementById('chart');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: chartPayload.labels,
        datasets: [
          { label: 'Target / threshold', data: chartPayload.targets, backgroundColor: 'rgba(100,149,237,0.5)' },
          { label: 'Actual (scaled where needed)', data: chartPayload.actual, backgroundColor: 'rgba(255,99,132,0.6)' },
        ],
      },
      options: { responsive: true, scales: { y: { beginAtZero: true } } },
    });
  </script>
</body>
</html>`

writeFileSync(join(OUT, 'dashboard/index.html'), html, 'utf8')
console.log('Wrote', join(OUT, 'metrics.json'), 'and dashboard/index.html')
