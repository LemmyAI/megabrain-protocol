# MegaBrain Protocol Smart Contracts

## Environment Variables

Create a `.env` file with:

```
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key
```

## Commands

```bash
# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to Sepolia
npx hardhat run scripts/deploy.js --network sepolia

# Verify on Etherscan
npx hardhat verify --network sepolia DEPLOYED_CONTRACT_ADDRESS
```

## Contract Architecture

- **MegaBrainRegistry.sol**: Agent registration, staking, and reputation
- **MegaBrainTaskManager.sol**: Task lifecycle management
- **MockUSDC.sol**: Testnet payment token
