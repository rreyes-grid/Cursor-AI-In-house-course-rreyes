import { AnalyticsDashboard } from '../components/features/analytics/AnalyticsDashboard'

export function AnalyticsDemo() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-2 text-gray-600">
          A data analytics dashboard with KPI cards, SVG chart placeholders
          (line, bar, pie, area), a sortable data table, filter controls, and
          date range selector. Toggle dark mode with the moon/sun icon.
        </p>
      </header>

      <AnalyticsDashboard />
    </div>
  )
}
