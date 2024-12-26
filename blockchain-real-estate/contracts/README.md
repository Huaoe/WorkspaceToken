# Blockchain Real Estate Smart Contracts

A decentralized real estate platform built on Ethereum, enabling property tokenization, management, and staking.

## 🏗 Architecture

### Core Contracts
- **PropertyToken**: ERC20Upgradeable token representing individual properties with fractional ownership
- **PropertyFactory**: Factory contract for deploying and managing PropertyTokens
- **Whitelist**: Access control for authorized addresses
- **StakingFactory**: Manages staking pools for property tokens
- **MockEURC**: Test stablecoin for transactions (EURC)

### Features
- Property tokenization (ERC20Upgradeable)
- Fractional property ownership
- Upgradeable proxy pattern
- Whitelist-based access control
- Property staking mechanism
- EURC stablecoin integration

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- Yarn v4.5+
- Hardhat
- Local Ethereum node (e.g., Hardhat Network)

### Installation
```bash
# Install dependencies
yarn install

# Compile contracts
yarn hardhat compile
```

### Environment Setup
Create `.env` file in the contracts directory:

## 📜 Scripts

### Deployment
```bash
# Deploy all contracts
yarn hardhat run scripts/deploy-proxy-optimized.ts --network localhost

# Show deployed addresses
yarn show-addresses
```

### Contract Management
```bash
# Whitelist an address
yarn whitelist --address <ethereum_address> --network localhost

# Distribute mock EURC
yarn hardhat run scripts/distribute-mock-eurc-optimized.ts --network localhost

# Fund staking factory
yarn fund:factory
```

### Testing
```bash
# Run all tests
yarn hardhat test

# Run specific test suites
yarn test:pt  # PropertyToken tests
yarn test:pf  # PropertyFactory tests
```

## 🔒 Security

### Proxy Pattern
- Transparent proxy pattern for upgradeability
- Admin controls for proxy management
- Implementation contracts are immutable

### Access Control
- Whitelist-based authorization
- Role-based access control for admin functions
- Timelock for critical operations

### Best Practices
- OpenZeppelin contracts for standard implementations
- Comprehensive test coverage
- External audit recommended before mainnet deployment

## 🛠 Development Workflow

1. **Local Development**
   ```bash
   # Start local node
   yarn hardhat node
   
   # Deploy contracts
   yarn hardhat run scripts/deploy-proxy-optimized.ts --network localhost
   
   # Verify deployment
   yarn show-addresses
   ```

2. **Testing Changes**
   ```bash
   # Run tests
   yarn hardhat test
   
   # Check test coverage
   yarn hardhat coverage
   ```

3. **Upgrading Contracts**
   - Deploy new implementation
   - Update proxy to point to new implementation
   - Verify state preservation

## 📝 Contract Addresses Management

The system maintains contract addresses in two locations:
1. `/contracts/.env`: For hardhat and contract interactions
2. `/.env.local`: For frontend integration (with NEXT_PUBLIC_ prefix)

The deploy script automatically syncs both files.

## ⚠️ Important Notes

- Always run scripts with the correct network flag
- Keep private keys secure and never commit them
- Verify contract addresses after deployment
- Test thoroughly before mainnet deployment
- Monitor gas costs for optimizations

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

MIT License - see LICENSE.md for details


## 🚀 Quick Start

1. User calls PropertyFactory.createProperty()
2. Factory deploys new PropertyToken contract (Factory is owner)
3. Factory transfers ownership to the creator
4. Creator now has full control of their PropertyToken

