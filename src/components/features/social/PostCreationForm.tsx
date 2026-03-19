import { useState } from 'react'
import { Avatar } from '../../ui/Avatar'
import { Button } from '../../ui/Button'
import type { SocialUser } from '../../../types/social'

interface PostCreationFormProps {
  currentUser: SocialUser
  onSubmit: (content: string) => void
}

export function PostCreationForm({ currentUser, onSubmit }: PostCreationFormProps) {
  const [content, setContent] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = content.trim()
    if (trimmed) {
      onSubmit(trimmed)
      setContent('')
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="flex gap-3">
        <Avatar
          src={currentUser.avatarUrl}
          alt={currentUser.name}
          size="md"
        />
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            rows={3}
            className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:placeholder-gray-400 dark:focus:border-indigo-400 dark:focus:ring-indigo-900/50"
          />
          <div className="mt-3 flex justify-end">
            <Button type="submit" size="sm" disabled={!content.trim()}>
              Post
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
