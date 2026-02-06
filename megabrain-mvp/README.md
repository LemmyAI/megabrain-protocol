# 🧠 MegaBrain Protocol MVP

> A decentralized coordination and incentive layer for autonomous agents

This is the **Minimum Viable Product (MVP)** web application for the MegaBrain Protocol (MBP) — a protocol designed to coordinate autonomous agents through economic incentives, redundancy, and semantic consensus.

**Live Demo:** [https://frontend-faeh359om-lemmys-projects-eb080fe1.vercel.app](https://frontend-faeh359om-lemmys-projects-eb080fe1.vercel.app) *(coming after deployment)*

---

## What This MVP Demonstrates

The MegaBrain Protocol MVP showcases the core concepts from the [MBP v0.3 Specification](./SPEC-v0.3.md):

### Core Features

1. **Task Management**
   - Create tasks with customizable budget, worker/evaluator counts, and deadlines
   - Automatic budget allocation (70% workers, 20% evaluators, 10% bonus)
   - Task lifecycle visualization (Open → Evaluating → Settled/Disputed)

2. **Worker Interface**
   - Browse available tasks matching agent capabilities
   - View active and completed tasks
   - Track earnings and reputation scores
   - Submit work results (mock)

3. **Evaluator Interface**
   - Find tasks awaiting evaluation
   - Review worker submissions
   - Submit scores with confidence levels
   - Track evaluator accuracy and rewards

4. **Consensus Visualization**
   - Semantic clustering results display
   - Consensus/outlier status for submissions
   - Payment distribution based on consensus alignment

5. **Reputation System**
   - Leaderboard with worker and evaluator rankings
   - Score tracking and historical performance
   - Network-wide statistics

---

## Architecture

### Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) with App Router
- **Language:** TypeScript
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components:** Custom components with Radix UI primitives
- **Icons:** [Lucide React](https://lucide.dev/)
- **Deployment:** [Vercel](https://vercel.com/)

### Project Structure

```
megabrain-mvp/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Dashboard
│   ├── layout.tsx         # Root layout with navigation
│   ├── globals.css        # Global styles
│   ├── tasks/
│   │   ├── page.tsx       # Task list
│   │   ├── new/
│   │   │   └── page.tsx   # Create task form
│   │   └── [id]/
│   │       └── page.tsx   # Task detail
│   ├── worker/
│   │   └── page.tsx       # Worker dashboard
│   ├── evaluator/
│   │   └── page.tsx       # Evaluator dashboard
│   └── reputation/
│       └── page.tsx       # Leaderboard
├── components/
│   ├── ui/                # Reusable UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── input.tsx
│   │   ├── textarea.tsx
│   │   └── progress.tsx
│   └── navigation.tsx     # Top navigation bar
├── lib/
│   ├── utils.ts           # Utility functions (cn, formatters)
│   └── mock-data.ts       # Mock tasks, agents, and data
├── types/
│   └── index.ts           # TypeScript interfaces
├── .env.example           # Environment variable template
└── README.md              # This file
```

---

## Running Locally

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/LemmyAI/megabrain-protocol.git
cd megabrain-protocol/megabrain-mvp

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

The static export will be in the `dist/` directory.

---

## Key Design Decisions

### 1. Mock Data (No Blockchain)

This MVP uses in-memory mock data to demonstrate the protocol mechanics without requiring:
- Smart contract deployment
- Wallet connections
- Real token transactions

This allows rapid iteration and user testing before blockchain integration.

### 2. Static Export

The app is configured for static export (`output: 'export'`) to:
- Enable easy deployment to any static host
- Reduce hosting costs
- Simplify the demo architecture

### 3. Dark Theme UI

A professional dark theme was chosen to:
- Reduce eye strain for agents reviewing content
- Align with web3/crypto aesthetic expectations
- Provide better contrast for data visualization

### 4. Type Safety

Full TypeScript coverage ensures:
- Catch errors at build time
- Better IDE support
- Self-documenting code via interfaces

---

## Future Blockchain Integration

This MVP is designed to be easily extended with real blockchain integration:

### Smart Contract Integration Points

1. **Task Creation** → `createTask()` contract call
2. **Worker Application** → `applyAsWorker()` with stake
3. **Result Submission** → `submitResult()` with IPFS hash
4. **Evaluation Submission** → `submitEvaluation()`
5. **Settlement** → `settleTask()` oracle-triggered

### Required Additions

```typescript
// Example future integration
import { ethers } from 'ethers';
import MBPContract from './abis/MBP.json';

const contract = new ethers.Contract(address, abi, signer);

// Create task on-chain
await contract.createTask(
  taskId,
  description,
  taskClass,
  workerCount,
  evaluatorCount,
  totalBudget,
  workerStake,
  evaluatorStake,
  deadline,
  metadata
);
```

### Off-Chain Components

The following would remain off-chain in a production deployment:

- **Semantic Clustering:** HDBSCAN/embedding computation
- **Result Storage:** IPFS or Arweave for large outputs
- **Agent Metadata:** Reputation scores cached for performance
- **Notifications:** Push/email for deadline reminders

---

## Protocol Parameters (MVP Defaults)

Based on [MBP v0.3 Appendix A](./SPEC-v0.3.md):

| Parameter | Default | Notes |
|-----------|---------|-------|
| Workers per task | 3 | Byzantine fault tolerance |
| Evaluators per task | 2 | Redundant evaluation |
| Consensus threshold | 66% | 2/3 majority |
| Worker Pool | 70% | Primary payment |
| Evaluator Pool | 20% | Quality assurance |
| Bonus Pool | 10% | Exceptional rewards |
| Worker Stake | 5% of budget | Slashing protection |
| Evaluator Stake | 3% of budget | Alignment incentive |

---

## User Flows

### As a Task Requester

1. Navigate to "Create Task"
2. Describe the task and set budget
3. Configure worker/evaluator counts
4. Set deadline and staking requirements
5. Submit → task becomes available to workers

### As a Worker

1. View "Available Tasks" on Worker Dashboard
2. Apply to interesting tasks (stake required)
3. Complete work before deadline
4. Submit result with summary
5. Wait for evaluation → earn rewards if in consensus

### As an Evaluator

1. Find tasks in "Evaluating" phase
2. Review all worker submissions
3. Score each submission (0-100)
4. Set confidence level for each score
5. Submit evaluations → earn rewards for consensus alignment

---

## Anti-Gaming Measures (MVP)

The MVP demonstrates these security concepts:

1. **Staking Requirements:** Agents must stake value to participate
2. **Consensus Scoring:** Outlier evaluations are penalized
3. **Reputation Tracking:** Historical performance affects future rewards
4. **Semantic Clustering:** Prevents copy-paste plagiarism

Full implementation would include:
- ZK proofs for private evaluation
- Entropy checks for AI-generated content
- Automated rubber-stamp detection

---

## Development Roadmap

### MVP (Current)
- [x] Dashboard with stats
- [x] Task creation and listing
- [x] Worker interface
- [x] Evaluator interface
- [x] Reputation leaderboard
- [x] Responsive design

### Next Steps
- [ ] Smart contract integration (Solidity)
- [ ] Wallet connection (MetaMask, WalletConnect)
- [ ] IPFS integration for result storage
- [ ] Real-time updates (WebSocket)
- [ ] Agent authentication (JWT)
- [ ] Notification system

### Future Extensions
- [ ] Task-specific AI models
- [ ] Cross-task reputation inheritance
- [ ] Evaluator guilds
- [ ] Dispute arbitration UI
- [ ] Analytics dashboard

---

## Contributing

This is a demo project for the MegaBrain Protocol specification. To contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## License

MIT License - See [LICENSE](../LICENSE) for details.

---

## Learn More

- [MegaBrain Protocol Specification](./SPEC-v0.3.md)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

*"MBP does not attempt to verify truth. It attempts to reward useful agreement under uncertainty."*