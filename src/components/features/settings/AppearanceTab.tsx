import { Select } from '../../ui/Select'
import { Button } from '../../ui/Button'

interface AppearanceTabProps {
  theme: string
  onThemeChange: (theme: string) => void
}

const themes: { value: string; label: string; preview: string }[] = [
  { value: 'light', label: 'Light', preview: 'bg-white border-gray-300' },
  { value: 'dark', label: 'Dark', preview: 'bg-gray-900 border-gray-600' },
  { value: 'system', label: 'System', preview: 'bg-gradient-to-r from-white to-gray-900 border-gray-400' },
]

const accentColors = [
  { name: 'Indigo', cls: 'bg-indigo-500' },
  { name: 'Blue', cls: 'bg-blue-500' },
  { name: 'Emerald', cls: 'bg-emerald-500' },
  { name: 'Rose', cls: 'bg-rose-500' },
  { name: 'Amber', cls: 'bg-amber-500' },
  { name: 'Violet', cls: 'bg-violet-500' },
]

export function AppearanceTab({ theme, onThemeChange }: AppearanceTabProps) {
  return (
    <div className="space-y-8">
      {/* Theme selector */}
      <fieldset>
        <legend className="text-base font-semibold text-gray-900 dark:text-white">
          Theme
        </legend>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Choose how the interface looks for you.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-3" role="radiogroup" aria-label="Theme selection">
          {themes.map((t) => {
            const selected = theme === t.value
            return (
              <button
                key={t.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onThemeChange(t.value)}
                className={`cursor-pointer rounded-xl border-2 p-3 text-center transition-all ${
                  selected
                    ? 'border-indigo-600 ring-2 ring-indigo-200 dark:ring-indigo-800'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500'
                }`}
              >
                <div className={`mx-auto h-10 w-full rounded-lg border ${t.preview}`} />
                <p className={`mt-2 text-sm font-medium ${selected ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300'}`}>
                  {t.label}
                </p>
              </button>
            )
          })}
        </div>
      </fieldset>

      {/* Accent color */}
      <fieldset>
        <legend className="text-base font-semibold text-gray-900 dark:text-white">
          Accent Color
        </legend>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Pick a primary accent color for buttons and highlights.
        </p>
        <div className="mt-4 flex flex-wrap gap-3" role="radiogroup" aria-label="Accent color selection">
          {accentColors.map((color, i) => (
            <button
              key={color.name}
              type="button"
              role="radio"
              aria-checked={i === 0}
              aria-label={color.name}
              className={`h-9 w-9 cursor-pointer rounded-full transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none dark:focus-visible:ring-offset-gray-800 ${color.cls} ${
                i === 0 ? 'ring-2 ring-offset-2 ring-indigo-600 dark:ring-offset-gray-800' : ''
              }`}
            />
          ))}
        </div>
      </fieldset>

      {/* Font & density */}
      <div className="grid gap-5 sm:grid-cols-2">
        <Select
          id="appearance-font-size"
          label="Font size"
          value="medium"
          onChange={() => {}}
          options={[
            { value: 'small', label: 'Small' },
            { value: 'medium', label: 'Medium (default)' },
            { value: 'large', label: 'Large' },
          ]}
        />
        <Select
          id="appearance-density"
          label="Display density"
          description="Controls spacing between elements."
          value="comfortable"
          onChange={() => {}}
          options={[
            { value: 'compact', label: 'Compact' },
            { value: 'comfortable', label: 'Comfortable (default)' },
            { value: 'spacious', label: 'Spacious' },
          ]}
        />
      </div>

      <div className="flex items-center gap-3 border-t border-gray-200 pt-5 dark:border-gray-700">
        <Button>Save preferences</Button>
        <Button variant="outline">Reset to defaults</Button>
      </div>
    </div>
  )
}
