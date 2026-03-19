import { useState } from 'react'
import type { TableColumn, SortDirection } from '../../../types/analytics'

interface DataTableProps<T extends object> {
  columns: TableColumn<T>[]
  data: T[]
  caption: string
}

function SortIcon({ direction }: { direction: SortDirection }) {
  return (
    <svg className="ml-1 inline-block h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path
        d="M8 3l3.5 4h-7L8 3z"
        opacity={direction === 'asc' ? 1 : 0.25}
      />
      <path
        d="M8 13l3.5-4h-7L8 13z"
        opacity={direction === 'desc' ? 1 : 0.25}
      />
    </svg>
  )
}

export function DataTable<T extends object>({
  columns,
  data,
  caption,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDirection>(null)

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : d === 'desc' ? null : 'asc'))
      if (sortDir === 'desc') setSortKey(null)
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = [...data].sort((a, b) => {
    if (!sortKey || !sortDir) return 0
    const av = (a as Record<string, unknown>)[sortKey]
    const bv = (b as Record<string, unknown>)[sortKey]
    const cmp = typeof av === 'number' && typeof bv === 'number'
      ? av - bv
      : String(av).localeCompare(String(bv))
    return sortDir === 'asc' ? cmp : -cmp
  })

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm dark:border-gray-700">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <caption className="sr-only">{caption}</caption>
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={`px-4 py-3 text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400 ${
                    col.align === 'right' ? 'text-right' : 'text-left'
                  } ${col.sortable ? 'cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200' : ''}`}
                  onClick={() => col.sortable && handleSort(col.key)}
                  aria-sort={
                    sortKey === col.key && sortDir
                      ? sortDir === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : undefined
                  }
                >
                  {col.label}
                  {col.sortable && (
                    <SortIcon direction={sortKey === col.key ? sortDir : null} />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-700 dark:bg-gray-900">
            {sorted.map((row, i) => (
              <tr
                key={i}
                className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`whitespace-nowrap px-4 py-3 text-sm ${
                      col.align === 'right' ? 'text-right' : 'text-left'
                    } text-gray-700 dark:text-gray-300`}
                  >
                    {String((row as Record<string, unknown>)[col.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
