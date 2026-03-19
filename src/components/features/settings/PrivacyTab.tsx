import { useState } from 'react'
import { Toggle } from '../../ui/Toggle'
import { Select } from '../../ui/Select'
import { Button } from '../../ui/Button'

export function PrivacyTab() {
  const [profileVisibility, setProfileVisibility] = useState('public')
  const [activityStatus, setActivityStatus] = useState(true)
  const [searchEngineIndexing, setSearchEngineIndexing] = useState(true)
  const [readReceipts, setReadReceipts] = useState(false)
  const [dataSharing, setDataSharing] = useState(false)
  const [twoFactor, setTwoFactor] = useState(true)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-8">
      {/* Visibility */}
      <fieldset>
        <legend className="text-base font-semibold text-gray-900 dark:text-white">
          Profile Visibility
        </legend>
        <div className="mt-4 space-y-5">
          <Select
            id="privacy-profile-vis"
            label="Who can see your profile"
            description="Controls who can view your full profile and posts."
            value={profileVisibility}
            onChange={setProfileVisibility}
            options={[
              { value: 'public', label: 'Everyone (Public)' },
              { value: 'followers', label: 'Followers only' },
              { value: 'private', label: 'Only me (Private)' },
            ]}
          />
          <Toggle
            id="privacy-activity"
            label="Show activity status"
            description="Let others see when you were last active."
            enabled={activityStatus}
            onChange={setActivityStatus}
          />
          <Toggle
            id="privacy-search-index"
            label="Search engine indexing"
            description="Allow search engines to link to your profile."
            enabled={searchEngineIndexing}
            onChange={setSearchEngineIndexing}
          />
        </div>
      </fieldset>

      {/* Messaging */}
      <fieldset>
        <legend className="text-base font-semibold text-gray-900 dark:text-white">
          Messaging
        </legend>
        <div className="mt-4 space-y-5">
          <Toggle
            id="privacy-read-receipts"
            label="Read receipts"
            description="Let senders know when you've read their messages."
            enabled={readReceipts}
            onChange={setReadReceipts}
          />
        </div>
      </fieldset>

      {/* Security */}
      <fieldset>
        <legend className="text-base font-semibold text-gray-900 dark:text-white">
          Security &amp; Data
        </legend>
        <div className="mt-4 space-y-5">
          <Toggle
            id="privacy-2fa"
            label="Two-factor authentication"
            description="Add an extra layer of security to your account."
            enabled={twoFactor}
            onChange={setTwoFactor}
          />
          <Toggle
            id="privacy-data-sharing"
            label="Data sharing for analytics"
            description="Help us improve by sharing anonymous usage data."
            enabled={dataSharing}
            onChange={setDataSharing}
          />
        </div>
      </fieldset>

      {/* Danger zone */}
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
        <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">
          Danger Zone
        </h3>
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
          Permanently delete your account and all associated data. This action
          cannot be undone.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3 border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900"
        >
          Delete account
        </Button>
      </div>

      <div className="flex items-center gap-3 border-t border-gray-200 pt-5 dark:border-gray-700">
        <Button onClick={handleSave}>
          {saved ? 'Saved!' : 'Save settings'}
        </Button>
        <Button variant="outline">Cancel</Button>
      </div>
    </div>
  )
}
