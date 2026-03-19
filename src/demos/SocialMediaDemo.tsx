import type { SocialPost, SocialUser } from '../types/social'
import { ThemeProvider, useThemeOptional } from '../context/ThemeContext'
import { SocialMediaFeed } from '../components/features/social/SocialMediaFeed'

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

const currentUser: SocialUser = {
  id: '1',
  name: 'Alex Rivera',
  username: 'alexrivera',
  avatarUrl: 'https://i.pravatar.cc/256?u=alexrivera',
}

const posts: SocialPost[] = [
  {
    id: '1',
    user: {
      id: '2',
      name: 'Jane Cooper',
      username: 'janecooper',
      avatarUrl: 'https://i.pravatar.cc/256?u=janecooper',
    },
    content: 'Just shipped a major update to our design system! 🎉\n\nNew components, improved accessibility, and better dark mode support. Huge thanks to the team for making this happen.',
    images: ['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=400&fit=crop'],
    likes: 42,
    comments: [
      {
        id: 'c1',
        user: {
          id: '3',
          name: 'Marcus Chen',
          username: 'marcuschen',
          avatarUrl: 'https://i.pravatar.cc/256?u=marcuschen',
        },
        content: 'This looks amazing! Can\'t wait to try it out.',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        likes: 3,
      },
      {
        id: 'c2',
        user: {
          id: '4',
          name: 'Priya Sharma',
          username: 'priyasharma',
          avatarUrl: 'https://i.pravatar.cc/256?u=priyasharma',
        },
        content: 'The dark mode improvements are 🔥',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        likes: 8,
      },
    ],
    shares: 5,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: '2',
    user: {
      id: '5',
      name: 'Sam Okafor',
      username: 'samokafor',
      avatarUrl: 'https://i.pravatar.cc/256?u=samokafor',
    },
    content: 'Weekend project: Built a small CLI tool for automating our deployment pipeline. Open source soon!',
    likes: 28,
    comments: [
      {
        id: 'c3',
        user: currentUser,
        content: 'Would love to see the repo when it\'s ready!',
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        likes: 1,
      },
    ],
    shares: 2,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: '3',
    user: {
      id: '6',
      name: 'Jordan Lee',
      username: 'jordanlee',
      avatarUrl: 'https://i.pravatar.cc/256?u=jordanlee',
    },
    content: 'Sunset from the office today 🌅\n\nGrateful for this view and this team.',
    images: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=500&fit=crop',
    ],
    likes: 156,
    comments: [],
    shares: 12,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
]

function SocialMediaContent() {
  const theme = useThemeOptional()
  const dark = theme?.isDark ?? false
  const toggleDark = theme?.toggleTheme ?? (() => {})

  return (
    <div className={dark ? 'dark' : ''}>
      <div className="mx-auto max-w-4xl space-y-8 rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-lg dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <header>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Social Media Feed</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Post cards with user info, content, images, like/comment/share actions, and comment threads.
              Includes post creation form and infinite scroll placeholder.
            </p>
          </header>
          <button
            type="button"
            onClick={toggleDark}
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            {dark ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>

        <SocialMediaFeed
          posts={posts}
          currentUser={currentUser}
        />
      </div>
    </div>
  )
}

export function SocialMediaDemo() {
  return (
    <ThemeProvider defaultTheme="light">
      <SocialMediaContent />
    </ThemeProvider>
  )
}
