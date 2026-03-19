import { registerDemo } from './registry'
import { UserProfileDemo } from './UserProfileDemo'
import { ProductCardDemo } from './ProductCardDemo'
import { DashboardDemo } from './DashboardDemo'
import { SettingsDemo } from './SettingsDemo'
import { AnalyticsDemo } from './AnalyticsDemo'
import { CompleteInterfaceDemo } from './CompleteInterfaceDemo'
import { SocialMediaDemo } from './SocialMediaDemo'

registerDemo({
  name: 'UserProfile',
  path: '/demos/user-profile',
  description: 'Social media user profile card with avatar, stats, and actions.',
  component: UserProfileDemo,
})

registerDemo({
  name: 'ProductCard',
  path: '/demos/product-card',
  description: 'E-commerce product card with image, rating, pricing, and add-to-cart.',
  component: ProductCardDemo,
})

registerDemo({
  name: 'Dashboard',
  path: '/demos/dashboard',
  description: 'Task management dashboard with sidebar, stats, kanban board, and dark mode.',
  component: DashboardDemo,
})

registerDemo({
  name: 'Settings',
  path: '/demos/settings',
  description: 'Tabbed settings panel with forms, toggles, dropdowns, and dark mode.',
  component: SettingsDemo,
})

registerDemo({
  name: 'Analytics',
  path: '/demos/analytics',
  description: 'Data analytics dashboard with KPI cards, charts, data table, and filters.',
  component: AnalyticsDemo,
})

registerDemo({
  name: 'Team Collaboration',
  path: '/demos/complete-interface',
  description: 'Team collaboration interface: active projects with progress, tasks per project, team, activity feed, and quick actions.',
  component: CompleteInterfaceDemo,
})

registerDemo({
  name: 'Social Media Feed',
  path: '/demos/social-media',
  description: 'Social media feed with post cards, user info, images, like/comment/share, comment threads, post creation, and infinite scroll.',
  component: SocialMediaDemo,
})
