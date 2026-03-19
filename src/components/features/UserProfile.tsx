import { useState } from 'react'
import type { UserProfile as UserProfileData } from '../../types/user'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'

interface UserProfileProps {
  user: UserProfileData
  onFollow?: (userId: string) => void
  onMessage?: (userId: string) => void
  onEditProfile?: () => void
}

function formatCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`
  return count.toString()
}

interface StatItemProps {
  label: string
  value: number
}

function StatItem({ label, value }: StatItemProps) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-lg font-bold text-gray-900 sm:text-xl">
        {formatCount(value)}
      </span>
      <span className="text-xs text-gray-500 sm:text-sm">{label}</span>
    </div>
  )
}

export function UserProfile({
  user,
  onFollow,
  onMessage,
  onEditProfile,
}: UserProfileProps) {
  const [following, setFollowing] = useState(user.isFollowing)

  const handleFollow = () => {
    setFollowing((prev) => !prev)
    onFollow?.(user.id)
  }

  return (
    <article
      aria-label={`${user.name}'s profile`}
      className="mx-auto w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-lg"
    >
      {/* Cover / banner area */}
      <div className="h-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 sm:h-40" />

      <div className="px-4 pb-6 sm:px-8">
        {/* Avatar + name row */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end">
          <div className="-mt-14 sm:-mt-16">
            <Avatar src={user.avatarUrl} alt={user.name} size="xl" />
          </div>

          <div className="flex flex-1 flex-col items-center gap-3 pt-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                {user.name}
              </h2>
              <p className="text-sm text-gray-500">@{user.username}</p>
            </div>

            {/* Action buttons */}
            <div
              className="flex gap-2"
              role="group"
              aria-label="Profile actions"
            >
              {user.isOwnProfile ? (
                <Button variant="outline" onClick={onEditProfile}>
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button
                    variant={following ? 'secondary' : 'primary'}
                    onClick={handleFollow}
                    aria-pressed={following}
                  >
                    {following ? 'Following' : 'Follow'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => onMessage?.(user.id)}
                    aria-label={`Send message to ${user.name}`}
                  >
                    Message
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        {user.bio && (
          <p className="mt-4 text-sm leading-relaxed text-gray-700 sm:text-base">
            {user.bio}
          </p>
        )}

        {/* Stats */}
        <div
          className="mt-6 flex justify-around border-t border-gray-100 pt-6"
          role="list"
          aria-label="Profile statistics"
        >
          <div role="listitem">
            <StatItem label="Posts" value={user.stats.posts} />
          </div>
          <div role="listitem">
            <StatItem label="Followers" value={user.stats.followers} />
          </div>
          <div role="listitem">
            <StatItem label="Following" value={user.stats.following} />
          </div>
        </div>
      </div>
    </article>
  )
}
