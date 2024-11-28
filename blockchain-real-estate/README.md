# Blockchain Real Estate Token Platform

A decentralized application for tokenizing real estate properties on the blockchain, enabling fractional ownership through ERC20 tokens and EURC-based transactions.

## Features

- 🏢 Tokenize real estate properties into ERC20 tokens
- 💎 Purchase property tokens using EURC (EUR-pegged stablecoin)
- 👥 Track token holders and ownership distribution
- 💰 View real-time token balances and property details
- 🔐 Secure smart contract architecture
- 🌐 Modern web interface with Web3 integration

## Quick Start

### Prerequisites

- Node.js v18+
- pnpm
- MetaMask or compatible Web3 wallet
- Local blockchain node (Hardhat)

### Setup

1. Install dependencies:
```bash
pnpm install
```

2. Configure environment:
```bash
# Root directory
cp .env.example .env.local

# Contracts directory
cd contracts
cp .env.example .env
```

3. Start local blockchain:
```bash
cd contracts
npx hardhat node
```

4. Deploy contracts:
```bash
npx hardhat run scripts/deploy-local.ts --network localhost
```

5. Start development server:
```bash
cd ..
pnpm dev
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
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## Architecture

### Smart Contract Architecture

- OpenZeppelin's ERC20 implementation
- Proxy pattern for upgradeable contracts
- Access control for admin functions
- Event emission for frontend tracking
- Decimal handling between tokens (18/6 decimals)

### Frontend Architecture

- Next.js 13 with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- wagmi hooks for Web3 interaction
- Supabase for off-chain data

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

### Frontend Tests

```bash
pnpm test
```

## Security

- OpenZeppelin contracts for security
- Input validation on all functions
- Access control modifiers
- Safe math operations
- Proper decimal handling

## Environment Variables

### Root (.env.local)
```
NEXT_PUBLIC_PROPERTY_FACTORY_ADDRESS=
NEXT_PUBLIC_EURC_TOKEN_ADDRESS=
NEXT_PUBLIC_ADMIN_ADDRESS=
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### Contracts (.env)
```
FACTORY_ADDRESS=
NEXT_PUBLIC_EURC_TOKEN_ADDRESS=
```

## License

MIT License. See [LICENSE](LICENSE) for details.
