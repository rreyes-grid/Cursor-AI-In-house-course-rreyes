import { useState } from 'react'
import { Avatar } from '../../ui/Avatar'
import { CommentThread } from './CommentThread'
import type { SocialPost } from '../../../types/social'

function HeartIcon({ filled }: { filled?: boolean }) {
  return (
    <svg className="h-5 w-5" fill={filled ? 'currentColor' : 'none'} viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  )
}

function ChatIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
    </svg>
  )
}

function ShareIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
    </svg>
  )
}

function formatTimeAgo(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

interface PostCardProps {
  post: SocialPost
  onLike: (postId: string) => void
  onComment: (postId: string, content: string) => void
  onShare: (postId: string) => void
}

export function PostCard({ post, onLike, onComment, onShare }: PostCardProps) {
  const [liked, setLiked] = useState(post.liked ?? false)
  const [likeCount, setLikeCount] = useState(post.likes)
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState('')

  const handleLike = () => {
    setLiked((prev) => !prev)
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1))
    onLike(post.id)
  }

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newComment.trim()
    if (trimmed) {
      onComment(post.id, trimmed)
      setNewComment('')
      setShowComments(true)
    }
  }

  return (
    <article className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      {/* User info */}
      <div className="flex items-center gap-3 p-4">
        <Avatar src={post.user.avatarUrl} alt={post.user.name} size="md" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900 dark:text-white">{post.user.name}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">@{post.user.username}</p>
        </div>
        <time className="text-sm text-gray-500 dark:text-gray-400" dateTime={post.timestamp}>
          {formatTimeAgo(post.timestamp)}
        </time>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">{post.content}</p>
      </div>

      {/* Images */}
      {post.images && post.images.length > 0 && (
        <div className={`grid gap-1 px-4 pb-3 ${post.images.length === 1 ? '' : 'grid-cols-2'}`}>
          {post.images.map((img, i) => (
            <img
              key={i}
              src={img}
              alt=""
              className="max-h-80 w-full rounded-xl object-cover"
            />
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex border-t border-gray-100 px-4 py-3 dark:border-gray-700">
        <button
          type="button"
          onClick={handleLike}
          className={`flex flex-1 items-center justify-center gap-2 py-2 text-sm font-medium transition-colors ${
            liked ? 'text-rose-500' : 'text-gray-600 hover:text-rose-500 dark:text-gray-400 dark:hover:text-rose-400'
          }`}
        >
          <HeartIcon filled={liked} />
          <span>{likeCount}</span>
        </button>
        <button
          type="button"
          onClick={() => setShowComments((c) => !c)}
          className="flex flex-1 items-center justify-center gap-2 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
        >
          <ChatIcon />
          <span>{post.comments.length}</span>
        </button>
        <button
          type="button"
          onClick={() => onShare(post.id)}
          className="flex flex-1 items-center justify-center gap-2 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
        >
          <ShareIcon />
          <span>{post.shares}</span>
        </button>
      </div>

      {/* Comment thread */}
      {(showComments || post.comments.length > 0) && (
        <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-700">
          <div className="space-y-1">
            {post.comments.map((comment) => (
              <CommentThread key={comment.id} comment={comment} />
            ))}
          </div>
          <form onSubmit={handleCommentSubmit} className="mt-4 flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:placeholder-gray-400"
            />
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600"
            >
              Reply
            </button>
          </form>
        </div>
      )}
    </article>
  )
}
