// Mock data store for MegaBrain Protocol MVP
// In-memory storage that persists during the session

import { Task, Agent, TaskResult, Evaluation, TaskStatus } from '@/types';

// Mock agents
export const mockAgents: Agent[] = [
  {
    id: 'agent-1',
    name: 'AlphaWorker',
    role: 'worker',
    workerScore: 95,
    evaluatorScore: 0,
    totalEarnings: 12500,
    tasksCompleted: 47,
    tasksEvaluated: 0,
    stakeSlashed: 0,
    lastActive: Date.now() - 3600000,
  },
  {
    id: 'agent-2',
    name: 'BetaWorker',
    role: 'worker',
    workerScore: 87,
    evaluatorScore: 0,
    totalEarnings: 8200,
    tasksCompleted: 31,
    tasksEvaluated: 0,
    stakeSlashed: 150,
    lastActive: Date.now() - 7200000,
  },
  {
    id: 'agent-3',
    name: 'GammaWorker',
    role: 'worker',
    workerScore: 92,
    evaluatorScore: 0,
    totalEarnings: 10100,
    tasksCompleted: 38,
    tasksEvaluated: 0,
    stakeSlashed: 0,
    lastActive: Date.now() - 1800000,
  },
  {
    id: 'agent-4',
    name: 'DeltaEval',
    role: 'evaluator',
    workerScore: 0,
    evaluatorScore: 96,
    totalEarnings: 6800,
    tasksCompleted: 0,
    tasksEvaluated: 89,
    stakeSlashed: 0,
    lastActive: Date.now() - 900000,
  },
  {
    id: 'agent-5',
    name: 'EpsilonEval',
    role: 'evaluator',
    workerScore: 0,
    evaluatorScore: 88,
    totalEarnings: 5200,
    tasksCompleted: 0,
    tasksEvaluated: 67,
    stakeSlashed: 75,
    lastActive: Date.now() - 5400000,
  },
  {
    id: 'agent-6',
    name: 'ZetaWorker',
    role: 'worker',
    workerScore: 78,
    evaluatorScore: 0,
    totalEarnings: 3400,
    tasksCompleted: 15,
    tasksEvaluated: 0,
    stakeSlashed: 300,
    lastActive: Date.now() - 10800000,
  },
];

// Mock tasks
export const mockTasks: Task[] = [
  {
    id: 'task-1',
    description: 'Analyze Ethereum smart contract for reentrancy vulnerabilities and provide a detailed security report.',
    taskClass: 'security-audit',
    status: 'settled',
    requester: 'agent-req-1',
    totalBudget: 5000,
    workerPool: 3500,
    evaluatorPool: 1000,
    bonusPool: 500,
    workerCount: 3,
    evaluatorCount: 2,
    workerStake: 250,
    evaluatorStake: 150,
    submissionDeadline: Date.now() - 86400000,
    evaluationDeadline: Date.now() - 43200000,
    createdAt: Date.now() - 172800000,
    workers: ['agent-1', 'agent-2', 'agent-3'],
    evaluators: ['agent-4', 'agent-5'],
    results: [
      {
        id: 'result-1',
        taskId: 'task-1',
        workerId: 'agent-1',
        summary: 'Found 2 critical vulnerabilities in the withdraw function and reentrancy guard implementation.',
        result: 'Detailed security analysis report...',
        submittedAt: Date.now() - 90000000,
        score: 94,
        inConsensus: true,
        payment: 1200,
      },
      {
        id: 'result-2',
        taskId: 'task-1',
        workerId: 'agent-2',
        summary: 'Identified reentrancy vulnerability in line 127. Recommended adding Checks-Effects-Interactions pattern.',
        result: 'Security audit findings...',
        submittedAt: Date.now() - 88000000,
        score: 88,
        inConsensus: true,
        payment: 1100,
      },
      {
        id: 'result-3',
        taskId: 'task-1',
        workerId: 'agent-3',
        summary: 'No vulnerabilities found. Contract appears secure.',
        result: 'Security analysis...',
        submittedAt: Date.now() - 85000000,
        score: 45,
        inConsensus: false,
        payment: 0,
      },
    ],
    evaluations: [
      {
        id: 'eval-1',
        taskId: 'task-1',
        workerId: 'agent-1',
        evaluatorId: 'agent-4',
        score: 95,
        confidence: 90,
        rationale: 'Thorough analysis with clear vulnerability identification.',
        submittedAt: Date.now() - 50000000,
      },
      {
        id: 'eval-2',
        taskId: 'task-1',
        workerId: 'agent-2',
        evaluatorId: 'agent-4',
        score: 90,
        confidence: 85,
        rationale: 'Good finding but missed one additional vulnerability.',
        submittedAt: Date.now() - 49000000,
      },
      {
        id: 'eval-3',
        taskId: 'task-1',
        workerId: 'agent-1',
        evaluatorId: 'agent-5',
        score: 93,
        confidence: 88,
        rationale: 'Comprehensive analysis with actionable recommendations.',
        submittedAt: Date.now() - 48000000,
      },
      {
        id: 'eval-4',
        taskId: 'task-1',
        workerId: 'agent-2',
        evaluatorId: 'agent-5',
        score: 86,
        confidence: 82,
        rationale: 'Solid work but incomplete coverage.',
        submittedAt: Date.now() - 47000000,
      },
    ],
    consensusCluster: 'cluster-security-issues',
  },
  {
    id: 'task-2',
    description: 'Research and summarize the latest developments in zero-knowledge proof implementations for blockchain scaling.',
    taskClass: 'research',
    status: 'evaluating',
    requester: 'agent-req-2',
    totalBudget: 3000,
    workerPool: 2100,
    evaluatorPool: 600,
    bonusPool: 300,
    workerCount: 3,
    evaluatorCount: 2,
    workerStake: 150,
    evaluatorStake: 90,
    submissionDeadline: Date.now() - 3600000,
    evaluationDeadline: Date.now() + 39600000,
    createdAt: Date.now() - 90000000,
    workers: ['agent-1', 'agent-3', 'agent-6'],
    evaluators: ['agent-4', 'agent-5'],
    results: [
      {
        id: 'result-4',
        taskId: 'task-2',
        workerId: 'agent-1',
        summary: 'Comprehensive overview of zk-SNARKs, zk-STARKs, and recent advances in recursive proofs.',
        result: 'Research report on ZK proofs...',
        submittedAt: Date.now() - 7200000,
      },
      {
        id: 'result-5',
        taskId: 'task-2',
        workerId: 'agent-3',
        summary: 'Analysis of zkEVM implementations from Polygon, Scroll, and zkSync.',
        result: 'zkEVM comparison report...',
        submittedAt: Date.now() - 5400000,
      },
      {
        id: 'result-6',
        taskId: 'task-2',
        workerId: 'agent-6',
        summary: 'Basic overview of ZK proofs without recent developments.',
        result: 'Basic ZK summary...',
        submittedAt: Date.now() - 3600000,
      },
    ],
    evaluations: [],
  },
  {
    id: 'task-3',
    description: 'Write a Python script to fetch and analyze on-chain data for Uniswap V3 liquidity pools.',
    taskClass: 'data-analysis',
    status: 'open',
    requester: 'agent-req-3',
    totalBudget: 2500,
    workerPool: 1750,
    evaluatorPool: 500,
    bonusPool: 250,
    workerCount: 3,
    evaluatorCount: 2,
    workerStake: 125,
    evaluatorStake: 75,
    submissionDeadline: Date.now() + 86400000,
    createdAt: Date.now() - 3600000,
    workers: [],
    evaluators: [],
    results: [],
    evaluations: [],
  },
  {
    id: 'task-4',
    description: 'Design a tokenomics model for a new DeFi protocol with sustainable yield mechanisms.',
    taskClass: 'tokenomics',
    status: 'open',
    requester: 'agent-req-4',
    totalBudget: 8000,
    workerPool: 5600,
    evaluatorPool: 1600,
    bonusPool: 800,
    workerCount: 3,
    evaluatorCount: 2,
    workerStake: 400,
    evaluatorStake: 240,
    submissionDeadline: Date.now() + 172800000,
    createdAt: Date.now() - 7200000,
    workers: ['agent-2'],
    evaluators: [],
    results: [],
    evaluations: [],
  },
  {
    id: 'task-5',
    description: 'Create documentation for a new NFT minting smart contract with ERC-721A implementation.',
    taskClass: 'documentation',
    status: 'disputed',
    requester: 'agent-req-5',
    totalBudget: 1500,
    workerPool: 1050,
    evaluatorPool: 300,
    bonusPool: 150,
    workerCount: 3,
    evaluatorCount: 2,
    workerStake: 75,
    evaluatorStake: 45,
    submissionDeadline: Date.now() - 172800000,
    evaluationDeadline: Date.now() - 129600000,
    createdAt: Date.now() - 259200000,
    workers: ['agent-1', 'agent-2', 'agent-3'],
    evaluators: ['agent-4', 'agent-5'],
    results: [
      {
        id: 'result-7',
        taskId: 'task-5',
        workerId: 'agent-1',
        summary: 'Complete documentation with code examples and deployment guide.',
        result: 'Full documentation...',
        submittedAt: Date.now() - 180000000,
        score: 91,
        inConsensus: true,
        payment: 400,
      },
      {
        id: 'result-8',
        taskId: 'task-5',
        workerId: 'agent-2',
        summary: 'Comprehensive docs covering all functions and events.',
        result: 'Documentation...',
        submittedAt: Date.now() - 175000000,
        score: 89,
        inConsensus: true,
        payment: 380,
      },
      {
        id: 'result-9',
        taskId: 'task-5',
        workerId: 'agent-3',
        summary: 'Basic documentation incomplete.',
        result: 'Partial docs...',
        submittedAt: Date.now() - 170000000,
        score: 52,
        inConsensus: false,
        payment: 0,
      },
    ],
    evaluations: [
      {
        id: 'eval-5',
        taskId: 'task-5',
        workerId: 'agent-1',
        evaluatorId: 'agent-4',
        score: 92,
        confidence: 90,
        submittedAt: Date.now() - 140000000,
      },
      {
        id: 'eval-6',
        taskId: 'task-5',
        workerId: 'agent-2',
        evaluatorId: 'agent-4',
        score: 90,
        confidence: 88,
        submittedAt: Date.now() - 138000000,
      },
      {
        id: 'eval-7',
        taskId: 'task-5',
        workerId: 'agent-3',
        evaluatorId: 'agent-4',
        score: 50,
        confidence: 95,
        submittedAt: Date.now() - 136000000,
      },
      {
        id: 'eval-8',
        taskId: 'task-5',
        workerId: 'agent-1',
        evaluatorId: 'agent-5',
        score: 90,
        confidence: 85,
        submittedAt: Date.now() - 134000000,
      },
      {
        id: 'eval-9',
        taskId: 'task-5',
        workerId: 'agent-2',
        evaluatorId: 'agent-5',
        score: 88,
        confidence: 82,
        submittedAt: Date.now() - 132000000,
      },
    ],
    consensusCluster: 'cluster-complete-docs',
  },
];

// Helper functions
export function getTaskById(id: string): Task | undefined {
  return mockTasks.find(t => t.id === id);
}

export function getAgentById(id: string): Agent | undefined {
  return mockAgents.find(a => a.id === id);
}

export function getAvailableTasksForWorker(workerId: string): Task[] {
  return mockTasks.filter(t => 
    t.status === 'open' && 
    !t.workers.includes(workerId) &&
    t.submissionDeadline > Date.now()
  );
}

export function getTasksForWorker(workerId: string): Task[] {
  return mockTasks.filter(t => t.workers.includes(workerId));
}

export function getTasksForEvaluator(evaluatorId: string): Task[] {
  return mockTasks.filter(t => 
    t.evaluators.includes(evaluatorId) || 
    (t.status === 'evaluating' && !t.evaluators.includes(evaluatorId))
  );
}

export function getTasksNeedingEvaluation(evaluatorId: string): Task[] {
  return mockTasks.filter(t => 
    t.status === 'evaluating' && 
    !t.evaluators.includes(evaluatorId)
  );
}

export function getAgentRankings(): Agent[] {
  return [...mockAgents].sort((a, b) => {
    const scoreA = a.workerScore + a.evaluatorScore;
    const scoreB = b.workerScore + b.evaluatorScore;
    return scoreB - scoreA;
  });
}