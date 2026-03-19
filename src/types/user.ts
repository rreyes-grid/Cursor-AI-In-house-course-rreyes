export interface UserStats {
  followers: number
  following: number
  posts: number
}

export interface UserProfile {
  id: string
  name: string
  username: string
  avatarUrl: string
  bio: string
  stats: UserStats
  isFollowing: boolean
  isOwnProfile: boolean
}
