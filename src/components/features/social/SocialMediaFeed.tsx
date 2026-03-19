import { useState, useRef, useEffect } from 'react'
import { PostCard } from './PostCard'
import { PostCreationForm } from './PostCreationForm'
import type { SocialPost, SocialUser } from '../../../types/social'

interface SocialMediaFeedProps {
  posts: SocialPost[]
  currentUser: SocialUser
  onLike?: (postId: string) => void
  onComment?: (postId: string, content: string) => void
  onShare?: (postId: string) => void
  onCreatePost?: (content: string) => void
}

function InfiniteScrollPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 py-12 dark:border-gray-700 dark:bg-gray-900">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
        Loading more posts...
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-500">
        Infinite scroll placeholder
      </p>
    </div>
  )
}

export function SocialMediaFeed({
  posts: initialPosts,
  currentUser,
  onLike,
  onComment,
  onShare,
  onCreatePost,
}: SocialMediaFeedProps) {
  const [posts, setPosts] = useState(initialPosts)
  const [loading, setLoading] = useState(false)
  const [showPlaceholder, setShowPlaceholder] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const handleCreatePost = (content: string) => {
    const newPost: SocialPost = {
      id: `post-${Date.now()}`,
      user: currentUser,
      content,
      likes: 0,
      comments: [],
      shares: 0,
      timestamp: new Date().toISOString(),
    }
    setPosts((prev) => [newPost, ...prev])
    onCreatePost?.(content)
  }

  const handleComment = (postId: string, content: string) => {
    const newComment = {
      id: `comment-${Date.now()}`,
      user: currentUser,
      content,
      timestamp: new Date().toISOString(),
      likes: 0,
    }
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, comments: [...p.comments, newComment] }
          : p
      )
    )
    onComment?.(postId, content)
  }

  // IntersectionObserver for infinite scroll placeholder
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry?.isIntersecting) {
          setShowPlaceholder(true)
          setLoading(true)
          setTimeout(() => {
            setLoading(false)
            setShowPlaceholder(false)
          }, 1500)
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Post creation form */}
      <PostCreationForm currentUser={currentUser} onSubmit={handleCreatePost} />

      {/* Feed */}
      <div className="space-y-6">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onLike={onLike ?? (() => {})}
            onComment={handleComment}
            onShare={onShare ?? (() => {})}
          />
        ))}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-4" aria-hidden />

        {/* Infinite scroll placeholder */}
        {showPlaceholder && loading && <InfiniteScrollPlaceholder />}
      </div>
    </div>
  )
}
