import { useState, useId } from 'react'
import { ProfileTab } from './ProfileTab'
import { NotificationsTab } from './NotificationsTab'
import { PrivacyTab } from './PrivacyTab'
import { AppearanceTab } from './AppearanceTab'

interface Tab {
  key: string
  label: string
  icon: React.ReactNode
}

function UserIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  )
}

function PaletteIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" />
    </svg>
  )
}

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

const tabs: Tab[] = [
  { key: 'profile', label: 'Profile', icon: <UserIcon /> },
  { key: 'notifications', label: 'Notifications', icon: <BellIcon /> },
  { key: 'privacy', label: 'Privacy', icon: <ShieldIcon /> },
  { key: 'appearance', label: 'Appearance', icon: <PaletteIcon /> },
]

export function SettingsPanel() {
  const [activeTab, setActiveTab] = useState('profile')
  const [dark, setDark] = useState(false)
  const [theme, setTheme] = useState('light')
  const tablistId = useId()

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
    setDark(newTheme === 'dark')
  }

  return (
    <div className={dark ? 'dark' : ''}>
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-5 sm:px-6 dark:border-gray-700 dark:bg-gray-800">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Settings
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage your account preferences and configuration.
            </p>
          </div>
          <button
            onClick={() => {
              const next = !dark
              setDark(next)
              setTheme(next ? 'dark' : 'light')
            }}
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="cursor-pointer rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            {dark ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>

        <div className="flex flex-col md:flex-row">
          {/* Tab list — vertical on desktop, horizontal scrollable on mobile */}
          <div
            role="tablist"
            aria-label="Settings sections"
            className="flex overflow-x-auto border-b border-gray-200 md:w-56 md:shrink-0 md:flex-col md:overflow-x-visible md:border-r md:border-b-0 dark:border-gray-700"
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  role="tab"
                  id={`${tablistId}-tab-${tab.key}`}
                  aria-selected={isActive}
                  aria-controls={`${tablistId}-panel-${tab.key}`}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex shrink-0 cursor-pointer items-center gap-2.5 px-4 py-3 text-sm font-medium transition-colors md:px-5 md:py-3.5 ${
                    isActive
                      ? 'border-b-2 border-indigo-600 text-indigo-700 md:border-b-0 md:border-r-2 md:bg-indigo-50 dark:border-indigo-400 dark:text-indigo-300 dark:md:bg-indigo-950'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Tab panels */}
          <div className="flex-1 p-4 sm:p-6">
            {tabs.map((tab) => (
              <div
                key={tab.key}
                role="tabpanel"
                id={`${tablistId}-panel-${tab.key}`}
                aria-labelledby={`${tablistId}-tab-${tab.key}`}
                hidden={activeTab !== tab.key}
              >
                {tab.key === 'profile' && <ProfileTab />}
                {tab.key === 'notifications' && <NotificationsTab />}
                {tab.key === 'privacy' && <PrivacyTab />}
                {tab.key === 'appearance' && (
                  <AppearanceTab theme={theme} onThemeChange={handleThemeChange} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
