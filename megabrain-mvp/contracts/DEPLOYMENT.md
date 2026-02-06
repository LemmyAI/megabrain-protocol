# Deploying to Sepolia Testnet

This guide walks you through deploying the MegaBrain Protocol contracts to Sepolia testnet.

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Alchemy or Infura account** (for RPC access)
3. **Sepolia ETH** (from a faucet)
4. **Etherscan API key** (optional, for verification)

## Setup

### 1. Install Dependencies

```bash
cd /home/lemmy/.openclaw/workspace/megabrain-mvp/contracts
npm install
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```bash
# Your wallet private key (with Sepolia ETH)
PRIVATE_KEY=0x...

# Alchemy or Infura RPC URL
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY

# Optional: For contract verification
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY
```

**Important:** Never commit the `.env` file with real credentials!

### 3. Get Sepolia ETH

You'll need test ETH to deploy. Get it from:
- [Alchemy Faucet](https://sepoliafaucet.com/)
- [Infura Faucet](https://www.infura.io/faucet/sepolia)
- [Google Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia)

## Deployment

### Compile Contracts

```bash
npm run compile
```

### Run Tests (Local)

```bash
npm test
```

### Deploy to Sepolia

```bash
npm run deploy:sepolia
```

This will:
1. Deploy MockUSDC token
2. Deploy MegaBrainRegistry
3. Deploy MegaBrainTaskManager
4. Transfer ownership appropriately
5. Save deployment addresses to `deployment.json`

### Example Output

```
Deploying contracts with account: 0x...
Account balance: 500000000000000000

Deploying MockUSDC...
MockUSDC deployed to: 0x...

Deploying MegaBrainRegistry...
MegaBrainRegistry deployed to: 0x...

Deploying MegaBrainTaskManager...
MegaBrainTaskManager deployed to: 0x...

Transferring Registry ownership to TaskManager...
Ownership transferred

=== Deployment Summary ===
{
  MockUSDC: "0x...",
  MegaBrainRegistry: "0x...",
  MegaBrainTaskManager: "0x..."
}

Deployment info saved to deployment.json
```

## Verify Contracts on Etherscan (Optional)

If you have an Etherscan API key:

```bash
npx hardhat verify --network sepolia MOCK_USDC_ADDRESS
npx hardhat verify --network sepolia REGISTRY_ADDRESS STAKING_TOKEN MIN_WORKER MIN_EVALUATOR MIN_ARBITRATOR OWNER
npx hardhat verify --network sepolia TASK_MANAGER_ADDRESS REGISTRY PAYMENT_TOKEN OWNER
```

## Interacting with Contracts

### Using Hardhat Console

```bash
npx hardhat console --network sepolia
```

```javascript
// Load deployment
const deployment = require('./deployment.json');

// Get contract instances
const taskManager = await ethers.getContractAt('MegaBrainTaskManager', deployment.contracts.MegaBrainTaskManager);
const registry = await ethers.getContractAt('MegaBrainRegistry', deployment.contracts.MegaBrainRegistry);
const mockUSDC = await ethers.getContractAt('MockUSDC', deployment.contracts.MockUSDC);

// Get USDC from faucet
await mockUSDC.faucet(1000000000); // 1000 USDC

// Check balance
await mockUSDC.balanceOf(await (await ethers.provider.getSigner()).getAddress());
```

### Creating a Task

```javascript
// Approve USDC spending
await mockUSDC.approve(deployment.contracts.MegaBrainTaskManager, 1000000000);

// Create task
const taskId = ethers.keccak256(ethers.toUtf8Bytes('task-1'));
const deadline = Math.floor(Date.now() / 1000) + 86400;

await taskManager.createTask(
  taskId,
  "Analyze this dataset",
  ethers.keccak256(ethers.toUtf8Bytes("data-analysis")),
  1000000000, // 1000 USDC
  5000000,    // 5 USDC worker stake
  3000000,    // 3 USDC evaluator stake
  deadline,
  ethers.keccak256(ethers.toUtf8Bytes("ipfs://metadata")),
  3, // 3 workers
  2  // 2 evaluators
);
```

## Contract Addresses (Example)

After deployment, update this section with your actual addresses:

| Contract | Address |
|----------|---------|
| MockUSDC | `0x...` |
| MegaBrainRegistry | `0x...` |
| MegaBrainTaskManager | `0x...` |

## Troubleshooting

### "Insufficient funds"
- Get more Sepolia ETH from a faucet
- Check your wallet balance on Sepolia Etherscan

### "Nonce too high"
- Reset your wallet's nonce in MetaMask (Settings > Advanced > Reset Account)

### "Contract verification failed"
- Make sure the constructor arguments match exactly
- Wait a few minutes after deployment before verifying
- Check Etherscan API key is valid

## Security Notes

- **Testnet Only**: These contracts are for testing. Do not use with real funds.
- **MockUSDC**: The token is mintable by anyone on testnet for testing purposes.
- **Ownership**: TaskManager owns Registry after deployment for settlement operations.
- **Slashing**: Stakes can be slashed for non-consensus behavior.