export interface SocialUser {
  id: string
  name: string
  username: string
  avatarUrl: string
}

export interface SocialComment {
  id: string
  user: SocialUser
  content: string
  timestamp: string
  likes: number
  replies?: SocialComment[]
}

export interface SocialPost {
  id: string
  user: SocialUser
  content: string
  images?: string[]
  likes: number
  comments: SocialComment[]
  shares: number
  timestamp: string
  liked?: boolean
}
