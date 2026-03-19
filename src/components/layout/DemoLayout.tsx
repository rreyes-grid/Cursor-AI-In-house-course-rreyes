import { NavLink, Outlet } from 'react-router'
import { demos } from '../../demos/registry'
import { NavBar } from './NavBar'

export function DemoLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-100">
      <NavBar />

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-gray-200 bg-white md:block">
          <div className="sticky top-16 flex h-[calc(100vh-4rem)] flex-col">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-sm font-semibold tracking-wide text-gray-500 uppercase">
                Components
              </h2>
            </div>

            <nav aria-label="Demo navigation" className="flex-1 overflow-y-auto p-4">
              <ul className="space-y-1">
                {demos.map((demo) => (
                  <li key={demo.path}>
                    <NavLink
                      to={demo.path}
                      className={({ isActive }) =>
                        `block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`
                      }
                    >
                      {demo.name}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </aside>

        {/* Main content area */}
        <div className="flex flex-1 flex-col">
          {/* Mobile demo tabs */}
          <div className="flex gap-2 overflow-x-auto border-b border-gray-200 bg-white px-4 py-2 md:hidden">
            {demos.map((demo) => (
              <NavLink
                key={demo.path}
                to={demo.path}
                className={({ isActive }) =>
                  `shrink-0 rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                {demo.name}
              </NavLink>
            ))}
          </div>

          {/* Page content */}
          <main className="flex-1 p-4 sm:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
