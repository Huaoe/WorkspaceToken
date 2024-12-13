# Blockchain Real Estate Token Platform

A decentralized application for tokenizing real estate properties on the blockchain, enabling fractional ownership through ERC20 tokens and EURC-based transactions.

## Features

- 🏢 Tokenize real estate properties into ERC20 tokens
- 💎 Purchase property tokens using EURC (EUR-pegged stablecoin)
- 👥 Track token holders and ownership distribution
- 💰 View real-time token balances and property details
- 🔐 Secure smart contract architecture
- 🌐 Modern web interface with Web3 integration
- 📊 Real-time market insights powered by AI
- 🔍 KYC verification system for property access
- 🎯 Staking rewards for token holders

## Quick Start

### Prerequisites

- Node.js v18+
- Yarn
- MetaMask or compatible Web3 wallet
- Local blockchain node (Hardhat)
- Supabase account
- Mistral API key

### Setup

1. Install dependencies:
```bash
yarn install
```

2. Configure environment:
```bash
# Root directory
cp .env.example .env.local

# Contracts directory
cd contracts
cp .env.example .env
```

3. Set up Supabase:
- Create a new Supabase project
- Run the migrations in `supabase/migrations`
- Update environment variables with your Supabase credentials

4. Start local blockchain:
```bash
cd contracts
npx hardhat node
```

5. Deploy contracts:
```bash
npx hardhat run scripts/deploy-local.ts --network localhost
```

6. Start development server:
```bash
cd ..
yarn dev
```

Visit `http://localhost:3000` to access the application.

## Smart Contracts

### Core Contracts

- **PropertyToken.sol**: ERC20 token representing property ownership
  - Purchase/sell tokens using EURC
  - Track property details and token distribution
  - Manage token holder information

- **PropertyFactory.sol**: Factory contract for property tokens
  - Create new property token contracts
  - Manage property validation and deployment
  - Handle admin functions

- **StakingRewards.sol**: Staking contract for property tokens
  - Distribute rewards to stakers
  - Track staking periods and rewards
  - Handle reward rate adjustments

### Test Tokens

- **MockEURC.sol**: Test stablecoin for development
  - ERC20 token with 6 decimals
  - Mintable functionality for testing
  - Simulates real EURC token behavior

## Development

### Contract Development

```bash
cd contracts

# Run tests
npx hardhat test

# Deploy to local network
npx hardhat run scripts/deploy-local.ts --network localhost

# Deploy to testnet
npx hardhat run scripts/deploy.ts --network sepolia
```

### Frontend Development

```bash
# Start development server
yarn dev

# Build for production
yarn build

# Start production server
yarn start
```

## Architecture

### Smart Contract Architecture

- OpenZeppelin's ERC20 implementation
- Proxy pattern for upgradeable contracts
- Access control for admin functions
- Event emission for frontend tracking
- Decimal handling between tokens (18/6 decimals)
- Staking rewards distribution system

### Frontend Architecture

- Next.js 13 with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- wagmi hooks for Web3 interaction
- Supabase for off-chain data
- Mistral AI for market insights
- Shadcn/ui components

### Database Schema

#### KYC Submissions
```sql
create table kyc_submissions (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null unique,
  status text not null default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now())
);
```

#### Market Insights Cache
```sql
create table market_insights_cache (
  id uuid primary key default gen_random_uuid(),
  location text not null unique,
  insights text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
```

## Environment Variables

### Root (.env.local)
```
NEXT_PUBLIC_PROPERTY_FACTORY_PROXY_ADDRESS=
NEXT_PUBLIC_EURC_TOKEN_ADDRESS=
NEXT_PUBLIC_ADMIN_ADDRESS=
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
MISTRAL_API_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

### Contracts (.env)
```
FACTORY_ADDRESS=
NEXT_PUBLIC_EURC_TOKEN_ADDRESS=
```

## Features Documentation

### KYC System
- Submit KYC information through the `/kyc` page
- Only wallets with KYC submissions can view detailed property information
- Admin dashboard for KYC approval management

### Market Insights
- AI-powered market analysis for each property location
- Caching system to optimize API usage
- Visual presentation with markdown support

### Staking System
- Stake property tokens to earn rewards
- Dynamic APY based on staking parameters
- Real-time staking metrics and history

## Testing

### Smart Contract Tests

```bash
cd contracts
npx hardhat test
```

Tests cover:
- Token deployment
- Purchase/sell functionality
- Access controls
- Edge cases and error conditions
- Staking functionality

### Frontend Tests

```bash
yarn test
```

## Security

- OpenZeppelin contracts for security
- Input validation on all functions
- Access control modifiers
- Safe math operations
- Proper decimal handling
- KYC verification for property access
- Rate limiting for API calls

## License

MIT License. See [LICENSE](LICENSE) for details.
