export const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?q=80&w=1470&auto=format&fit=crop'

export const PROPERTIES_PER_PAGE = 6

export const STATUS_COLORS = {
  pending: 'yellow',
  approved: 'green',
  rejected: 'red',
  onchain: 'yellow',
  funding: 'purple',
  staking: 'blue',
  closed: 'gray',
  paused: 'orange'
} as const

export const STATUS_OPTIONS = ['pending', 'approved', 'rejected', 'onchain', 'funding',  'staking', 'closed', 'paused'] as const

export enum PropertyStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ONCHAIN = 'onchain',
  FUNDING = 'funding',
  STAKING = 'staking',
  CLOSED = 'closed',
  PAUSED = 'paused'
}

export type PropertyStatusType = typeof STATUS_OPTIONS[number]
