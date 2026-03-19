import type { UserProfile as UserProfileData } from '../types/user'
import { UserProfile } from '../components/features/UserProfile'

const profiles: { label: string; description: string; user: UserProfileData }[] = [
  {
    label: 'Visitor View',
    description: 'How a profile looks when visiting another user. Shows Follow and Message buttons.',
    user: {
      id: '1',
      name: 'Jane Cooper',
      username: 'janecooper',
      avatarUrl: 'https://i.pravatar.cc/256?u=janecooper',
      bio: 'Product designer and creative thinker. Building beautiful interfaces that people love to use. Coffee enthusiast and weekend hiker.',
      stats: { followers: 12400, following: 534, posts: 289 },
      isFollowing: false,
      isOwnProfile: false,
    },
  },
  {
    label: 'Already Following',
    description: 'When you already follow a user. The button reflects the "Following" state.',
    user: {
      id: '2',
      name: 'Marcus Chen',
      username: 'marcuschen',
      avatarUrl: 'https://i.pravatar.cc/256?u=marcuschen',
      bio: 'Data scientist at heart. I turn messy datasets into clear stories. Speaker, mentor, and occasional board-game strategist.',
      stats: { followers: 98200, following: 312, posts: 1045 },
      isFollowing: true,
      isOwnProfile: false,
    },
  },
  {
    label: 'Own Profile',
    description: 'How your own profile appears. Shows an Edit Profile button instead of follow/message.',
    user: {
      id: '3',
      name: 'Alex Rivera',
      username: 'alexrivera',
      avatarUrl: 'https://i.pravatar.cc/256?u=alexrivera',
      bio: 'Full-stack developer. Open source contributor. I write about TypeScript, React, and system design.',
      stats: { followers: 3250, following: 180, posts: 142 },
      isFollowing: false,
      isOwnProfile: true,
    },
  },
  {
    label: 'High Follower Count',
    description: 'Demonstrates how large numbers are formatted (e.g. 2.1M followers).',
    user: {
      id: '4',
      name: 'Priya Sharma',
      username: 'priyasharma',
      avatarUrl: 'https://i.pravatar.cc/256?u=priyasharma',
      bio: 'Travel photographer capturing the world one frame at a time. National Geographic contributor. Currently exploring Patagonia.',
      stats: { followers: 2_130_000, following: 845, posts: 3720 },
      isFollowing: false,
      isOwnProfile: false,
    },
  },
  {
    label: 'New User',
    description: 'A fresh profile with low counts and a short bio.',
    user: {
      id: '5',
      name: 'Sam Okafor',
      username: 'samokafor',
      avatarUrl: 'https://i.pravatar.cc/256?u=samokafor',
      bio: 'Just getting started!',
      stats: { followers: 12, following: 45, posts: 3 },
      isFollowing: false,
      isOwnProfile: false,
    },
  },
]

export function UserProfileDemo() {
  return (
    <div className="mx-auto max-w-3xl space-y-12">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">UserProfile</h1>
        <p className="mt-2 text-gray-600">
          A social media profile card with avatar, stats, bio, and contextual
          action buttons. Fully responsive and accessible.
        </p>
      </header>

      {profiles.map(({ label, description, user }) => (
        <section key={user.id} className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">{label}</h2>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
          <UserProfile
            user={user}
            onFollow={(id) => console.log('Follow toggled for', id)}
            onMessage={(id) => console.log('Message', id)}
            onEditProfile={() => console.log('Edit profile clicked')}
          />
        </section>
      ))}
    </div>
  )
}
