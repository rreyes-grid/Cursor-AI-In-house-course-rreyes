import type { AnalyticsFilters } from '../../../types/analytics'

interface FilterBarProps {
  filters: AnalyticsFilters
  onChange: (filters: AnalyticsFilters) => void
}

function CalendarIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  )
}

function FunnelIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
    </svg>
  )
}

const selectClasses =
  'rounded-lg border border-gray-300 bg-white py-2 pr-8 pl-3 text-sm text-gray-700 shadow-sm transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:focus:border-indigo-400 dark:focus:ring-indigo-800'

export function FilterBar({ filters, onChange }: FilterBarProps) {
  const update = (patch: Partial<AnalyticsFilters>) =>
    onChange({ ...filters, ...patch })

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Date range */}
      <div className="flex items-center gap-2">
        <CalendarIcon />
        <label htmlFor="filter-date-range" className="sr-only">
          Date range
        </label>
        <select
          id="filter-date-range"
          value={filters.dateRange}
          onChange={(e) => update({ dateRange: e.target.value })}
          className={selectClasses}
        >
          <option value="7d">Last 7 days</option>
          <option value="14d">Last 14 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="12m">Last 12 months</option>
          <option value="custom">Custom range</option>
        </select>
      </div>

      {/* Channel */}
      <div className="flex items-center gap-2">
        <FunnelIcon />
        <label htmlFor="filter-channel" className="sr-only">
          Channel
        </label>
        <select
          id="filter-channel"
          value={filters.channel}
          onChange={(e) => update({ channel: e.target.value })}
          className={selectClasses}
        >
          <option value="all">All Channels</option>
          <option value="organic">Organic Search</option>
          <option value="paid">Paid Ads</option>
          <option value="social">Social Media</option>
          <option value="email">Email</option>
          <option value="direct">Direct</option>
        </select>
      </div>

      {/* Region */}
      <div>
        <label htmlFor="filter-region" className="sr-only">
          Region
        </label>
        <select
          id="filter-region"
          value={filters.region}
          onChange={(e) => update({ region: e.target.value })}
          className={selectClasses}
        >
          <option value="all">All Regions</option>
          <option value="na">North America</option>
          <option value="eu">Europe</option>
          <option value="apac">Asia Pacific</option>
          <option value="latam">Latin America</option>
        </select>
      </div>

      {/* Reset */}
      <button
        onClick={() =>
          onChange({ dateRange: '30d', channel: 'all', region: 'all' })
        }
        className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
      >
        Reset filters
      </button>
    </div>
  )
}
