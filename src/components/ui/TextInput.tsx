import type { InputHTMLAttributes } from 'react'

interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  description?: string
}

export function TextInput({
  id,
  label,
  value,
  onChange,
  description,
  ...props
}: TextInputProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-900 dark:text-white"
      >
        {label}
      </label>
      {description && (
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      )}
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-indigo-400 dark:focus:ring-indigo-800"
        {...props}
      />
    </div>
  )
}
