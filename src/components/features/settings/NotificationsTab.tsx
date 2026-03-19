import { useState } from 'react'
import { Toggle } from '../../ui/Toggle'
import { Select } from '../../ui/Select'
import { Button } from '../../ui/Button'

interface NotificationGroup {
  title: string
  items: { id: string; label: string; description: string; default: boolean }[]
}

const groups: NotificationGroup[] = [
  {
    title: 'Email Notifications',
    items: [
      {
        id: 'email-comments',
        label: 'Comments',
        description: 'Get notified when someone comments on your post.',
        default: true,
      },
      {
        id: 'email-mentions',
        label: 'Mentions',
        description: 'Get notified when someone mentions you.',
        default: true,
      },
      {
        id: 'email-follows',
        label: 'New followers',
        description: 'Get notified when someone follows your account.',
        default: false,
      },
      {
        id: 'email-digest',
        label: 'Weekly digest',
        description: 'Receive a weekly summary of activity.',
        default: true,
      },
    ],
  },
  {
    title: 'Push Notifications',
    items: [
      {
        id: 'push-messages',
        label: 'Direct messages',
        description: 'Get push notifications for new messages.',
        default: true,
      },
      {
        id: 'push-reminders',
        label: 'Task reminders',
        description: 'Receive reminders for upcoming tasks.',
        default: true,
      },
      {
        id: 'push-updates',
        label: 'Product updates',
        description: 'Stay informed about new features and changes.',
        default: false,
      },
    ],
  },
]

export function NotificationsTab() {
  const [toggles, setToggles] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    groups.forEach((g) => g.items.forEach((item) => (initial[item.id] = item.default)))
    return initial
  })
  const [frequency, setFrequency] = useState('instant')
  const [saved, setSaved] = useState(false)

  const handleToggle = (id: string, value: boolean) => {
    setToggles((prev) => ({ ...prev, [id]: value }))
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-8">
      <Select
        id="notif-frequency"
        label="Notification frequency"
        description="How often grouped notifications are delivered."
        value={frequency}
        onChange={setFrequency}
        options={[
          { value: 'instant', label: 'Instant' },
          { value: 'hourly', label: 'Hourly digest' },
          { value: 'daily', label: 'Daily digest' },
        ]}
      />

      {groups.map((group) => (
        <fieldset key={group.title}>
          <legend className="text-base font-semibold text-gray-900 dark:text-white">
            {group.title}
          </legend>
          <div className="mt-4 space-y-5">
            {group.items.map((item) => (
              <Toggle
                key={item.id}
                id={item.id}
                label={item.label}
                description={item.description}
                enabled={toggles[item.id]}
                onChange={(val) => handleToggle(item.id, val)}
              />
            ))}
          </div>
        </fieldset>
      ))}

      <div className="flex items-center gap-3 border-t border-gray-200 pt-5 dark:border-gray-700">
        <Button onClick={handleSave}>
          {saved ? 'Saved!' : 'Save preferences'}
        </Button>
        <Button variant="outline">Reset to defaults</Button>
      </div>
    </div>
  )
}
