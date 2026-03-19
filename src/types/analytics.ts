export interface Kpi {
  id: string
  label: string
  value: string
  change: number
  changeLabel: string
  icon: 'revenue' | 'users' | 'orders' | 'conversion'
}

export interface ChartConfig {
  id: string
  title: string
  type: 'line' | 'bar' | 'pie' | 'area'
  span?: 1 | 2
}

export type SortDirection = 'asc' | 'desc' | null

export interface TableColumn<T> {
  key: keyof T & string
  label: string
  sortable?: boolean
  align?: 'left' | 'right'
}

export interface AnalyticsFilters {
  dateRange: string
  channel: string
  region: string
}
