import { Avatar } from '../../ui/Avatar'
import type { SocialComment as SocialCommentType } from '../../../types/social'

function HeartIcon({ filled }: { filled?: boolean }) {
  return (
    <svg className="h-4 w-4" fill={filled ? 'currentColor' : 'none'} viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  )
}

interface CommentThreadProps {
  comment: SocialCommentType
  onLike?: (commentId: string) => void
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

export function CommentThread({ comment, onLike }: CommentThreadProps) {
  return (
    <div className="flex gap-3 py-3">
      <Avatar src={comment.user.avatarUrl} alt={comment.user.name} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="rounded-2xl bg-gray-100 px-4 py-2 dark:bg-gray-700">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {comment.user.name}
          </p>
          <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-300">
            {comment.content}
          </p>
        </div>
        <div className="mt-1 flex items-center gap-4 pl-2">
          <time className="text-xs text-gray-500 dark:text-gray-400">
            {formatTimeAgo(comment.timestamp)}
          </time>
          <button
            type="button"
            onClick={() => onLike?.(comment.id)}
            className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-rose-500 dark:text-gray-400 dark:hover:text-rose-400"
          >
            <HeartIcon />
            {comment.likes > 0 && <span>{comment.likes}</span>}
          </button>
        </div>
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2 ml-4 space-y-2 border-l-2 border-gray-200 pl-4 dark:border-gray-600">
            {comment.replies.map((reply) => (
              <CommentThread key={reply.id} comment={reply} onLike={onLike} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
