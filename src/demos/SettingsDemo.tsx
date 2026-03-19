import { SettingsPanel } from '../components/features/settings/SettingsPanel'

export function SettingsDemo() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Settings Panel</h1>
        <p className="mt-2 text-gray-600">
          A tabbed settings interface with Profile, Notifications, Privacy, and
          Appearance sections. Includes form inputs, toggle switches, dropdowns,
          and dark mode support — use the moon/sun toggle in the panel header.
        </p>
      </header>

      <SettingsPanel />
    </div>
  )
}
