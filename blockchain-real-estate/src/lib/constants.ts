export const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?q=80&w=1470&auto=format&fit=crop'

export const PROPERTIES_PER_PAGE = 6

export const STATUS_COLORS = {
  pending: 'yellow',
  approved: 'green',
  rejected: 'red',
  onchain: 'yellow',
  live: 'purple',
  staking: 'blue',
  closed: 'gray',
  paused: 'orange'
} as const

export const STATUS_OPTIONS = ['pending', 'approved', 'rejected', 'onchain', 'live',  'staking', 'closed', 'paused'] as const

export type PropertyStatus = typeof STATUS_OPTIONS[number]
