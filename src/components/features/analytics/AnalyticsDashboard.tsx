import { useState } from 'react'
import type { Kpi, ChartConfig, AnalyticsFilters, TableColumn } from '../../../types/analytics'
import { KpiCard } from './KpiCard'
import { ChartPlaceholder } from './ChartPlaceholder'
import { DataTable } from './DataTable'
import { FilterBar } from './FilterBar'

function SunIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  )
}

const kpis: Kpi[] = [
  { id: 'revenue', label: 'Total Revenue', value: '$84,254', change: 14.2, changeLabel: 'vs last period', icon: 'revenue' },
  { id: 'users', label: 'Active Users', value: '12,847', change: 7.1, changeLabel: 'vs last period', icon: 'users' },
  { id: 'orders', label: 'Total Orders', value: '3,428', change: -2.4, changeLabel: 'vs last period', icon: 'orders' },
  { id: 'conversion', label: 'Conversion Rate', value: '3.24%', change: 0.8, changeLabel: 'vs last period', icon: 'conversion' },
]

const charts: ChartConfig[] = [
  { id: 'revenue-trend', title: 'Revenue Over Time', type: 'line', span: 2 },
  { id: 'traffic-sources', title: 'Traffic Sources', type: 'pie' },
  { id: 'orders-by-month', title: 'Orders by Month', type: 'bar' },
  { id: 'user-growth', title: 'User Growth & Retention', type: 'area', span: 2 },
]

interface TopPage {
  page: string
  views: number
  unique: number
  bounceRate: string
  avgDuration: string
}

const topPages: TopPage[] = [
  { page: '/home', views: 24520, unique: 18340, bounceRate: '32.1%', avgDuration: '2m 45s' },
  { page: '/products', views: 18930, unique: 14200, bounceRate: '41.3%', avgDuration: '3m 12s' },
  { page: '/pricing', views: 12745, unique: 9820, bounceRate: '28.7%', avgDuration: '4m 05s' },
  { page: '/blog/react-tips', views: 9430, unique: 7650, bounceRate: '45.2%', avgDuration: '5m 30s' },
  { page: '/about', views: 6215, unique: 5180, bounceRate: '52.8%', avgDuration: '1m 48s' },
  { page: '/contact', views: 4870, unique: 3920, bounceRate: '38.4%', avgDuration: '2m 10s' },
  { page: '/docs/getting-started', views: 3650, unique: 2890, bounceRate: '22.5%', avgDuration: '6m 20s' },
  { page: '/changelog', views: 2140, unique: 1760, bounceRate: '55.1%', avgDuration: '1m 15s' },
]

const tableColumns: TableColumn<TopPage>[] = [
  { key: 'page', label: 'Page', sortable: true },
  { key: 'views', label: 'Views', sortable: true, align: 'right' },
  { key: 'unique', label: 'Unique', sortable: true, align: 'right' },
  { key: 'bounceRate', label: 'Bounce Rate', align: 'right' },
  { key: 'avgDuration', label: 'Avg Duration', align: 'right' },
]

export function AnalyticsDashboard() {
  const [dark, setDark] = useState(false)
  const [filters, setFilters] = useState<AnalyticsFilters>({
    dateRange: '30d',
    channel: 'all',
    region: 'all',
  })

  return (
    <div className={dark ? 'dark' : ''}>
      <div className="rounded-2xl border border-gray-200 bg-gray-50 shadow-lg dark:border-gray-700 dark:bg-gray-900">
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-gray-200 bg-white px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-gray-700 dark:bg-gray-800">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Analytics
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Monitor your key metrics and performance indicators.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDark((d) => !d)}
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="cursor-pointer rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              {dark ? <SunIcon /> : <MoonIcon />}
            </button>
            <button className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
              <DownloadIcon />
              Export
            </button>
          </div>
        </div>

        <div className="space-y-6 p-4 sm:p-6">
          {/* Filters */}
          <FilterBar filters={filters} onChange={setFilters} />

          {/* KPI cards */}
          <section aria-label="Key performance indicators">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {kpis.map((kpi) => (
                <KpiCard key={kpi.id} kpi={kpi} />
              ))}
            </div>
          </section>

          {/* Charts */}
          <section aria-label="Charts">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {charts.map((chart) => (
                <ChartPlaceholder key={chart.id} chart={chart} />
              ))}
            </div>
          </section>

          {/* Data table */}
          <section aria-label="Top pages">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Top Pages
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {topPages.length} pages
              </span>
            </div>
            <DataTable
              columns={tableColumns}
              data={topPages}
              caption="Top pages by views"
            />
          </section>
        </div>
      </div>
    </div>
  )
}
