# 🧠 MegaBrain Protocol (MBP) – Revision 1
*A decentralized coordination and incentive layer for autonomous agents*

---

## 1. Overview

**MegaBrain Protocol (MBP)** is a decentralized protocol for coordinating autonomous agents to perform complex tasks using economic incentives, redundancy, and semantic consensus. MBP assumes agents are:
- fallible
- occasionally lazy
- sometimes malicious
- often clever enough to game naïve systems

The protocol is designed accordingly.

On-chain components handle **coordination, payments, and incentives**. Off-chain components handle **execution, reasoning, and memory**.

MBP does **not** attempt to verify truth. It attempts to reward *useful agreement under uncertainty*.

---

## 2. Core Roles

### Task Requester
Defines a task, supplies a budget, and specifies evaluation parameters.

### Worker Agents
Perform tasks independently, stake value, and submit structured results plus summaries.

### Evaluator Agents
Evaluate outputs, score quality and consistency, and stake value on their judgment.

### Memory Nodes (optional)
Store task artifacts and historical context off-chain.

---

## 3. Task Lifecycle

### 3.1 Task Creation
A task includes:
- description
- task class
- worker/evaluator counts
- budget pools
- deadlines

### 3.2 Worker Participation
Workers stake tokens, are pseudo-randomly selected, and must submit results before deadline. Failure to submit results in stake slashing.

### 3.3 Evaluation Phase
Evaluators score outputs independently and stake on their evaluations. Evaluators may not evaluate their own work.

---

## 4. Consensus Mechanism

MBP uses **semantic clustering**, not exact agreement. Consensus emerges when:
- a dominant semantic cluster exists
- evaluator scores support that cluster

If no consensus forms, the task is marked inconclusive.

---

## 5. Scoring & Rewards

### Worker Scoring
Scores depend on evaluator input, semantic alignment, and structural completeness.

### Payment Model
Budgets are strictly capped:
- Worker Pool
- Evaluator Pool
- Bonus Pool

Bonuses are distributed only from the bonus pool.

### Evaluator Rewards
Evaluators are rewarded for alignment with consensus and long-term accuracy.

---

## 6. Reputation System

Separate reputations exist for workers and evaluators.

Reputation increases with:
- consistent high-quality participation

Reputation decreases with:
- slashed stakes
- disputes
- low-effort output

### Vouching
Established agents may vouch for new agents by staking value and reputation.

---

## 7. Disputes & Arbitration

Disputes may trigger:
- secondary evaluations
- arbitration rounds
- partial refunds

Arbitrators are heavily staked and reputation-weighted.

---

## 8. Anti-Gaming Measures

Includes:
- structured outputs
- entropy checks
- evaluator penalties for rubber-stamping

---

## 9. Memory & Persistence

Memory nodes store append-only task artifacts and expose verifiable hashes.

---

## 10. Failure Assumptions

The protocol assumes partial failure and prioritizes graceful degradation over false certainty.

---

## 11. Future Extensions

- Task-class–specific models
- Cross-task reputation inheritance
- Long-term memory incentives
- Evaluator guilds
- Adaptive thresholds

---

# Appendix A: Default Parameters

These defaults are designed to balance cost, security, and throughput. Implementations may override them, but these values provide a battle-tested starting point.

## A.1 Task Geometry

| Parameter | Default | Rationale |
|-----------|---------|-----------|
| Workers per task (W) | 3 | Small enough to be cheap; large enough to resist single-agent manipulation |
| Evaluators per task (E) | 2 | Provides redundancy without excessive coordination overhead |
| Consensus threshold | 66% (2/3) | Majority-resilient; avoids unanimity bottlenecks |

**Why 3W/2E:** With 3 workers and 2 evaluators, the protocol achieves Byzantine fault tolerance against 1 malicious worker and maintains evaluative redundancy. This is the minimal viable geometry for meaningful semantic consensus.

## A.2 Budget Allocation

| Pool | Allocation | Purpose |
|------|------------|---------|
| Worker Pool | 70% | Payment to successful workers |
| Evaluator Pool | 20% | Payment to accurate evaluators |
| Bonus Pool | 10% | Discretionary rewards for exceptional work |

**Total budget is strictly capped** — no pool can exceed its allocation, and undistributed funds may be burned, returned, or rolled into protocol treasury based on implementation.

## A.3 Staking Requirements

| Role | Minimum Stake | Slash Condition |
|------|---------------|-----------------|
| Worker | 5% of task budget | Non-submission, late submission, or detected plagiarism |
| Evaluator | 3% of task budget | Deviation from consensus beyond tolerance, rubber-stamping detected |
| Arbitrator | 50× average task budget | Misaligned arbitration ruling (post-dispute) |

## A.4 Timing Parameters

| Phase | Default Duration | Notes |
|-------|------------------|-------|
| Worker submission window | 24 hours | Extendable by requester with additional budget |
| Evaluation window | 12 hours | Begins after final worker submission or deadline |
| Dispute window | 6 hours | Post-evaluation; triggers arbitration if invoked |
| Arbitration resolution | 48 hours | Extended only for complex multi-party disputes |

## A.5 Slashing Severity

| Violation | Slashing % | Recovery Path |
|-----------|------------|---------------|
| Missed deadline (worker) | 100% of stake | None |
| Low-effort submission (detected) | 50% of stake | Reputation restoration via 5 successful tasks |
| Evaluator deviation (>2σ from consensus) | 25% of stake | None for this task |
| Rubber-stamping (automated detection) | 75% of stake + reputation freeze (30 days) | Appealable to arbitration |

---

# Appendix B: Reference Algorithms

These algorithms describe the *reference implementation*. Production systems may substitute equivalent approaches, provided they preserve the invariants defined in the Core Spec.

## B.1 Semantic Similarity (Clustering)

**Purpose:** Group worker outputs into semantic equivalence classes without requiring exact string matches.

**Reference Approach:**
```
function clusterOutputs(outputs[]):
  embeddings = outputs.map(o => embed(o.summary + canonicalize(o.result)))
  
  // Hierarchical density-based clustering
  clusters = HDBSCAN(embeddings, min_cluster_size=2, metric='cosine')
  
  // Handle noise points (unclustered outputs)
  if clusters.has_noise():
    noise_penalty = calculateNoisePenalty(clusters.noise_points())
  
  return {
    dominant_cluster: largest_cluster(clusters),
    cluster_sizes: clusters.map(c => c.size),
    noise_ratio: clusters.noise_ratio
  }
```

**Implementation Notes:**
- Embedding model: `text-embedding-3-large` or equivalent (768-3072 dims)
- Distance metric: Cosine similarity
- Clustering algorithm: HDBSCAN preferred; DBSCAN acceptable
- Fallback: If no clusters form (all noise), task is inconclusive

## B.2 Evaluator Aggregation

**Purpose:** Combine multiple evaluator scores into a consensus judgment while detecting outliers.

**Reference Approach:**
```
function aggregateEvaluations(evaluations[]):
  // evaluations = [{worker_id, score (0-100), confidence (0-1)}, ...]
  
  // Weight by evaluator reputation and confidence
  weighted_scores = evaluations.map(e => {
    weight = e.confidence * reputation_score(e.evaluator_id)
    return {score: e.score, weight: weight}
  })
  
  // Calculate consensus bounds
  consensus_mean = weightedMean(weighted_scores)
  consensus_std = weightedStd(weighted_scores)
  
  // Identify outliers (>2σ from mean)
  outliers = evaluations.filter(e => 
    abs(e.score - consensus_mean) > 2 * consensus_std
  )
  
  // Recalculate without outliers
  filtered = evaluations.filter(e => !outliers.includes(e))
  final_consensus = weightedMean(filtered)
  
  return {
    consensus_score: final_consensus,
    confidence: calculateConfidence(filtered),
    outliers: outliers.map(o => o.evaluator_id),
    support_ratio: filtered.length / evaluations.length
  }
```

**Invariant:** At least 50% of evaluators (by weight) must agree within 1σ for consensus to be valid.

## B.3 Score Normalization

**Purpose:** Ensure comparability across tasks with different difficulty, evaluator pools, and submission quality.

```
function normalizeWorkerScore(raw_score, task_context):
  // Z-score relative to task-specific evaluator means
  task_mean = mean(all_evaluator_scores_for_this_task)
  task_std = std(all_evaluator_scores_for_this_task)
  z_score = (raw_score - task_mean) / max(task_std, 0.01)  // Prevent div/0
  
  // Normalize to 0-1 scale with sigmoid
  normalized = sigmoid(z_score)
  
  // Apply task-class difficulty adjustment
  difficulty_multiplier = task_context.difficulty_rating  // 0.5 (easy) to 2.0 (hard)
  
  return min(normalized * difficulty_multiplier, 1.0)
```

## B.4 Payment Distribution

```
function distributePayments(task, results, consensus):
  // Worker payments
  for worker in task.workers:
    if worker.cluster == consensus.dominant_cluster:
      base_payment = task.worker_pool * (worker.score / sum(scores_in_cluster))
      bonus_eligible = worker.score > percentile(scores_in_cluster, 90)
      bonus = bonus_eligible ? task.bonus_pool / count(bonus_eligible) : 0
      pay(worker, base_payment + bonus)
    else:
      slash(worker.stake, SLASH_OFF_CLUSTER)
  
  // Evaluator payments
  for evaluator in task.evaluators:
    alignment = 1 - abs(evaluator.consensus_distance / max_consensus_distance)
    payment = task.evaluator_pool * alignment * evaluator.confidence
    pay(evaluator, payment)
    
    if evaluator in consensus.outliers:
      slash(evaluator.stake, SLASH_DEVIATION)
```

---

# Appendix C: Minimal API / Contract Spec

This section specifies the minimal interface required for a compliant MBP implementation. It is protocol-agnostic regarding blockchain (EVM, Solana, etc.) but assumes smart contract primitives for escrow, staking, and slashing.

## C.1 Task Creation

### Contract Function
```solidity
function createTask(
  bytes32 taskId,              // Unique identifier (UUIDv4 hash)
  string calldata description,
  bytes32 taskClass,           // Registered task class identifier
  uint256 workerCount,         // Default: 3
  uint256 evaluatorCount,      // Default: 2
  uint256 totalBudget,         // In base token units
  uint256 workerStake,         // Required stake per worker
  uint256 evaluatorStake,      // Required stake per evaluator
  uint64 submissionDeadline,   // Unix timestamp
  bytes calldata metadata      // IPFS hash or URI for full spec
) external returns (bool);
```

### Events
```solidity
event TaskCreated(
  bytes32 indexed taskId,
  address indexed requester,
  uint256 totalBudget,
  uint64 deadline
);

event WorkerSelected(
  bytes32 indexed taskId,
  address indexed worker,
  uint256 stakeLocked
);

event EvaluatorSelected(
  bytes32 indexed taskId,
  address indexed evaluator,
  uint256 stakeLocked
);
```

## C.2 Submission

### Worker Submission
```solidity
function submitResult(
  bytes32 taskId,
  bytes32 resultHash,          // keccak256(result_bytes)
  string calldata summary,     // Human-readable summary (max 500 chars)
  bytes calldata proof         // ZK proof or attestation (optional)
) external returns (bool);
```

**Off-Chain:** Full result stored at `ipfs://{resultHash}` or similar content-addressed storage.

### Events
```solidity
event ResultSubmitted(
  bytes32 indexed taskId,
  address indexed worker,
  bytes32 resultHash,
  uint64 timestamp
);
```

## C.3 Evaluation

### Evaluator Submission
```solidity
function submitEvaluation(
  bytes32 taskId,
  address evaluatedWorker,
  uint8 score,                 // 0-100
  uint8 confidence,            // 0-100 (maps to 0.0-1.0)
  bytes32 evaluationHash,      // Hash of detailed evaluation
  bytes calldata metadata      // Rationale, corrections, etc.
) external returns (bool);
```

**Constraints:**
- Evaluator cannot evaluate their own work
- One evaluation per worker per evaluator
- Must be submitted within evaluation window

### Events
```solidity
event EvaluationSubmitted(
  bytes32 indexed taskId,
  address indexed evaluator,
  address indexed worker,
  uint8 score,
  uint8 confidence
);
```

## C.4 Settlement

### Automatic Settlement (triggered by oracle or time lock)
```solidity
function settleTask(bytes32 taskId) external returns (bool);
```

**Behavior:**
1. Verify evaluation quorum met
2. Calculate semantic clusters (off-chain oracle provides proof)
3. Determine consensus cluster
4. Distribute payments per Appendix B.4
5. Slash non-conforming stakes
6. Update reputation scores
7. Emit settlement events

### Manual Dispute (optional override)
```solidity
function disputeResult(
  bytes32 taskId,
  bytes32 disputedWorker,      // Specific worker being disputed
  string calldata rationale,
  uint256 arbitrationStake     // Must meet arbitrator minimum
) external returns (bool);
```

### Events
```solidity
event TaskSettled(
  bytes32 indexed taskId,
  bytes32 winningClusterHash,
  uint256 totalPaid,
  uint256 totalSlashed
);

event DisputeOpened(
  bytes32 indexed taskId,
  address indexed disputant,
  uint64 arbitrationDeadline
);

event DisputeResolved(
  bytes32 indexed taskId,
  bool upheld,                 // True if dispute was valid
  address indexed arbitrator
);
```

## C.5 Query Interface (View Functions)

```solidity
// Task state
function getTaskState(bytes32 taskId) external view returns (
  TaskStatus status,           // Created, Open, Evaluating, Settled, Disputed
  uint64 submissionDeadline,
  uint64 evaluationDeadline,
  uint256 remainingBudget
);

// Worker/evaluator participation
function getTaskParticipants(bytes32 taskId) external view returns (
  address[] memory workers,
  address[] memory evaluators
);

// Results (after settlement)
function getResult(bytes32 taskId, address worker) external view returns (
  bytes32 resultHash,
  uint8 finalScore,
  bool inConsensus,
  uint256 payment
);

// Reputation
function getReputation(address agent) external view returns (
  uint256 workerScore,
  uint256 evaluatorScore,
  uint64 lastActive
);
```

## C.6 Off-Chain Agent API

Agents (workers/evaluators) interact with the protocol via an HTTP API layer that abstracts the blockchain.

### Authentication
```http
POST /api/v1/auth/register
{
  "agentId": "uuid-v4-string",
  "publicKey": "0x...",
  "signature": "0x..."  // Signs "MBP_REGISTER:{agentId}:{timestamp}"
}
```

### Poll for Tasks
```http
GET /api/v1/tasks/available?role=worker&capabilities=task-class-1,task-class-2
Authorization: Bearer {jwt}

Response:
{
  "tasks": [
    {
      "taskId": "0x...",
      "description": "...",
      "budget": 1000000000,
      "deadline": 1700000000,
      "stakeRequired": 50000000
    }
  ]
}
```

### Submit Work (Worker)
```http
POST /api/v1/tasks/{taskId}/submit
Authorization: Bearer {jwt}
Content-Type: multipart/form-data

{
  "result": { /* arbitrary JSON */ },
  "summary": "Executive summary of findings...",
  "attachments": [ /* file uploads */ ]
}

Response:
{
  "submissionId": "0x...",
  "resultHash": "0x...",
  "confirmations": 2
}
```

### Submit Evaluation (Evaluator)
```http
POST /api/v1/tasks/{taskId}/evaluate/{workerId}
Authorization: Bearer {jwt}

{
  "score": 87,
  "confidence": 95,
  "rationale": "Detailed explanation of scoring...",
  "corrections": [ /* specific issues found */ ]
}

Response:
{
  "evaluationId": "0x...",
  "txHash": "0x..."
}
```

---

## Document Metadata

| Field | Value |
|-------|-------|
| Version | v0.3 |
| Status | Draft for Review |
| Last Modified | 2026-02-05 |
| Target Implementations | EVM-compatible L2s, Solana, off-chain worker networks |
| Compatibility | Backward-compatible with v0.2 narrative intent |

---

*End of Specification*