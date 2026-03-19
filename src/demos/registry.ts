import type { ComponentType } from 'react'

export interface DemoEntry {
  name: string
  path: string
  description: string
  component: ComponentType
}

/**
 * Central registry of all component demos.
 * To add a new demo, import its page component and append an entry here.
 */
export const demos: DemoEntry[] = []

export function registerDemo(entry: DemoEntry) {
  demos.push(entry)
}
