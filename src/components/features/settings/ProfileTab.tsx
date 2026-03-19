import { useState } from 'react'
import { TextInput } from '../../ui/TextInput'
import { Select } from '../../ui/Select'
import { Button } from '../../ui/Button'
import { Avatar } from '../../ui/Avatar'

export function ProfileTab() {
  const [fullName, setFullName] = useState('Alex Rivera')
  const [email, setEmail] = useState('alex@example.com')
  const [username, setUsername] = useState('alexrivera')
  const [bio, setBio] = useState(
    'Full-stack developer. Open source contributor.',
  )
  const [timezone, setTimezone] = useState('america_ny')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-8">
      {/* Avatar section */}
      <div className="flex items-center gap-5">
        <Avatar
          src="https://i.pravatar.cc/256?u=alexrivera"
          alt="Alex Rivera"
          size="lg"
        />
        <div className="space-y-2">
          <Button variant="outline" size="sm">
            Change avatar
          </Button>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            JPG, PNG, or GIF. Max 2 MB.
          </p>
        </div>
      </div>

      {/* Form fields */}
      <div className="grid gap-5 sm:grid-cols-2">
        <TextInput
          id="settings-fullname"
          label="Full name"
          value={fullName}
          onChange={setFullName}
        />
        <TextInput
          id="settings-email"
          label="Email address"
          type="email"
          value={email}
          onChange={setEmail}
        />
        <TextInput
          id="settings-username"
          label="Username"
          value={username}
          onChange={setUsername}
          description="Your public display name."
        />
        <Select
          id="settings-timezone"
          label="Timezone"
          value={timezone}
          onChange={setTimezone}
          options={[
            { value: 'america_ny', label: 'Eastern Time (ET)' },
            { value: 'america_chi', label: 'Central Time (CT)' },
            { value: 'america_den', label: 'Mountain Time (MT)' },
            { value: 'america_la', label: 'Pacific Time (PT)' },
            { value: 'europe_lon', label: 'GMT (London)' },
            { value: 'asia_tokyo', label: 'JST (Tokyo)' },
          ]}
        />
      </div>

      {/* Bio */}
      <div>
        <label
          htmlFor="settings-bio"
          className="block text-sm font-medium text-gray-900 dark:text-white"
        >
          Bio
        </label>
        <textarea
          id="settings-bio"
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="mt-2 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-800"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {bio.length}/160 characters
        </p>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3 border-t border-gray-200 pt-5 dark:border-gray-700">
        <Button onClick={handleSave}>
          {saved ? 'Saved!' : 'Save changes'}
        </Button>
        <Button variant="outline">Cancel</Button>
      </div>
    </div>
  )
}
