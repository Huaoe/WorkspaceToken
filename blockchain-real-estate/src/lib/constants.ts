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

export type PropertyStatus = typeof STATUS_OPTIONS[number]

export const PROPERTY_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_PROPERTY_FACTORY_PROXY_ADDRESS;
export const WHITELIST_ADDRESS = process.env.NEXT_PUBLIC_WHITELIST_PROXY_ADDRESS;
export const EURC_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_EURC_TOKEN_ADDRESS;

if (!PROPERTY_FACTORY_ADDRESS) {
  throw new Error('NEXT_PUBLIC_PROPERTY_FACTORY_PROXY_ADDRESS is not defined');
}

if (!WHITELIST_ADDRESS) {
  throw new Error('NEXT_PUBLIC_WHITELIST_PROXY_ADDRESS is not defined');
}

if (!EURC_TOKEN_ADDRESS) {
  throw new Error('NEXT_PUBLIC_EURC_TOKEN_ADDRESS is not defined');
}
