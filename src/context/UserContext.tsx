import { createContext, useContext, type ReactNode } from 'react'

export interface CurrentUser {
  id: string
  name: string
  email: string
  avatarUrl: string
  role?: string
}

interface UserContextValue {
  user: CurrentUser | null
}

const UserContext = createContext<UserContextValue | null>(null)

interface UserProviderProps {
  children: ReactNode
  user: CurrentUser | null
}

export function UserProvider({ children, user }: UserProviderProps) {
  return (
    <UserContext.Provider value={{ user }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext)
  if (!ctx) {
    throw new Error('useUser must be used within UserProvider')
  }
  return ctx
}

export function useUserOptional(): UserContextValue | null {
  return useContext(UserContext)
}
