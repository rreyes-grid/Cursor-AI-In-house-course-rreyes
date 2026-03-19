import type { ChartConfig } from '../../../types/analytics'

function LineSvg() {
  return (
    <svg viewBox="0 0 300 120" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="line-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" className="[stop-color:var(--color-indigo-400)]" stopOpacity={0.3} />
          <stop offset="100%" className="[stop-color:var(--color-indigo-400)]" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d="M0,90 Q30,85 60,70 T120,50 T180,60 T240,30 T300,20" fill="none" className="stroke-indigo-500 dark:stroke-indigo-400" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M0,90 Q30,85 60,70 T120,50 T180,60 T240,30 T300,20 V120 H0 Z" fill="url(#line-grad)" />
      {[0, 60, 120, 180, 240, 300].map((x, i) => (
        <line key={i} x1={x} y1="0" x2={x} y2="120" className="stroke-gray-200 dark:stroke-gray-700" strokeWidth="0.5" strokeDasharray="3 3" />
      ))}
    </svg>
  )
}

function BarSvg() {
  const bars = [65, 45, 80, 55, 90, 40, 70, 85, 60, 75, 50, 95]
  const barW = 18
  const gap = 7
  return (
    <svg viewBox={`0 0 ${bars.length * (barW + gap)} 120`} className="h-full w-full" aria-hidden="true">
      {bars.map((h, i) => (
        <rect
          key={i}
          x={i * (barW + gap)}
          y={120 - h}
          width={barW}
          height={h}
          rx={3}
          className={i % 3 === 0 ? 'fill-indigo-500 dark:fill-indigo-400' : 'fill-indigo-300 dark:fill-indigo-600'}
          opacity={0.85}
        />
      ))}
    </svg>
  )
}

function PieSvg() {
  const slices = [
    { pct: 40, cls: 'text-indigo-500 dark:text-indigo-400' },
    { pct: 25, cls: 'text-emerald-500 dark:text-emerald-400' },
    { pct: 20, cls: 'text-amber-500 dark:text-amber-400' },
    { pct: 15, cls: 'text-rose-400 dark:text-rose-500' },
  ]
  const r = 45
  const cx = 60
  const cy = 60
  let cumulative = 0

  return (
    <svg viewBox="0 0 120 120" className="mx-auto h-full w-full max-w-[160px]" aria-hidden="true">
      {slices.map((s, i) => {
        const start = cumulative
        cumulative += s.pct
        const startAngle = (start / 100) * 2 * Math.PI - Math.PI / 2
        const endAngle = (cumulative / 100) * 2 * Math.PI - Math.PI / 2
        const largeArc = s.pct > 50 ? 1 : 0
        const x1 = cx + r * Math.cos(startAngle)
        const y1 = cy + r * Math.sin(startAngle)
        const x2 = cx + r * Math.cos(endAngle)
        const y2 = cy + r * Math.sin(endAngle)
        return (
          <path
            key={i}
            d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`}
            fill="currentColor"
            className={s.cls}
            opacity={0.85}
          />
        )
      })}
      <circle cx={cx} cy={cy} r={22} className="fill-white dark:fill-gray-800" />
    </svg>
  )
}

function AreaSvg() {
  return (
    <svg viewBox="0 0 300 120" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="area-grad-1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" className="[stop-color:var(--color-indigo-400)]" stopOpacity={0.4} />
          <stop offset="100%" className="[stop-color:var(--color-indigo-400)]" stopOpacity={0.05} />
        </linearGradient>
        <linearGradient id="area-grad-2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" className="[stop-color:var(--color-emerald-400)]" stopOpacity={0.35} />
          <stop offset="100%" className="[stop-color:var(--color-emerald-400)]" stopOpacity={0.05} />
        </linearGradient>
      </defs>
      <path d="M0,80 Q50,65 100,55 T200,45 T300,35 V120 H0 Z" fill="url(#area-grad-1)" />
      <path d="M0,80 Q50,65 100,55 T200,45 T300,35" fill="none" className="stroke-indigo-500 dark:stroke-indigo-400" strokeWidth="2" />
      <path d="M0,95 Q50,85 100,80 T200,65 T300,55 V120 H0 Z" fill="url(#area-grad-2)" />
      <path d="M0,95 Q50,85 100,80 T200,65 T300,55" fill="none" className="stroke-emerald-500 dark:stroke-emerald-400" strokeWidth="2" />
    </svg>
  )
}

const chartMap: Record<ChartConfig['type'], React.ReactNode> = {
  line: <LineSvg />,
  bar: <BarSvg />,
  pie: <PieSvg />,
  area: <AreaSvg />,
}

function ExpandIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
    </svg>
  )
}

function EllipsisIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
    </svg>
  )
}

export function ChartPlaceholder({ chart }: { chart: ChartConfig }) {
  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 ${
        chart.span === 2 ? 'md:col-span-2' : ''
      }`}
    >
      {/* Chart header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          {chart.title}
        </h3>
        <div className="flex gap-1">
          <button
            aria-label={`Expand ${chart.title}`}
            className="cursor-pointer rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          >
            <ExpandIcon />
          </button>
          <button
            aria-label={`More options for ${chart.title}`}
            className="cursor-pointer rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          >
            <EllipsisIcon />
          </button>
        </div>
      </div>

      {/* Chart area */}
      <div className="flex items-end justify-center p-5">
        <div className="h-40 w-full">{chartMap[chart.type]}</div>
      </div>
    </div>
  )
}
