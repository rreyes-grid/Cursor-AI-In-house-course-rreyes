import { Link } from 'react-router'
import { demos } from '../demos/registry'

const COMPLETE_INTERFACE_PATHS = [
  '/demos/complete-interface',
  '/demos/social-media',
  '/demos/customer-support',
  '/demos/ecommerce',
]

export function Home() {
  const completeInterfaceDemos = demos.filter((d) => COMPLETE_INTERFACE_PATHS.includes(d.path))
  const componentDemos = demos.filter((d) => !COMPLETE_INTERFACE_PATHS.includes(d.path))

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Component Demos</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Browse the available components. Pick one from the list below or use
          the sidebar to navigate.
        </p>
      </header>

      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        Complete Interfaces
      </h2>
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        {completeInterfaceDemos.map((demo) => (
          <Link
            key={demo.path}
            to={demo.path}
            className="block rounded-xl border-2 border-indigo-200 bg-indigo-50/50 p-5 shadow-sm transition-all hover:border-indigo-400 hover:bg-indigo-50 hover:shadow-md dark:border-indigo-800 dark:bg-indigo-950/30 dark:hover:border-indigo-600 dark:hover:bg-indigo-950/50"
          >
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-indigo-600 px-2.5 py-0.5 text-xs font-semibold text-white">
                Full App
              </span>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {demo.name}
              </h3>
            </div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {demo.description}
            </p>
          </Link>
        ))}
      </div>

      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        Independent Components
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {componentDemos.map((demo) => (
          <Link
            key={demo.path}
            to={demo.path}
            className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-indigo-600"
          >
            <h2 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
              {demo.name}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{demo.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
