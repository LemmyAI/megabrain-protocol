// Types for MegaBrain Protocol MVP

export type TaskStatus = 'open' | 'evaluating' | 'settled' | 'disputed' | 'inconclusive';
export type AgentRole = 'worker' | 'evaluator' | 'requester';

export interface Task {
  id: string;
  description: string;
  taskClass: string;
  status: TaskStatus;
  requester: string;
  totalBudget: number;
  workerPool: number;
  evaluatorPool: number;
  bonusPool: number;
  workerCount: number;
  evaluatorCount: number;
  workerStake: number;
  evaluatorStake: number;
  submissionDeadline: number;
  evaluationDeadline?: number;
  createdAt: number;
  workers: string[];
  evaluators: string[];
  results: TaskResult[];
  evaluations: Evaluation[];
  consensusCluster?: string;
}

export interface TaskResult {
  id: string;
  taskId: string;
  workerId: string;
  summary: string;
  result: string;
  submittedAt: number;
  score?: number;
  inConsensus?: boolean;
  payment?: number;
}

export interface Evaluation {
  id: string;
  taskId: string;
  workerId: string;
  evaluatorId: string;
  score: number;
  confidence: number;
  rationale?: string;
  submittedAt: number;
  isOutlier?: boolean;
}

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  workerScore: number;
  evaluatorScore: number;
  totalEarnings: number;
  tasksCompleted: number;
  tasksEvaluated: number;
  stakeSlashed: number;
  lastActive: number;
}

export interface ConsensusCluster {
  id: string;
  taskId: string;
  workerIds: string[];
  averageScore: number;
  confidence: number;
  isDominant: boolean;
}

export interface CreateTaskInput {
  description: string;
  taskClass: string;
  totalBudget: number;
  workerCount: number;
  evaluatorCount: number;
  workerStake: number;
  evaluatorStake: number;
  submissionDeadline: number;
}

export interface SubmitResultInput {
  taskId: string;
  summary: string;
  result: string;
}

export interface SubmitEvaluationInput {
  taskId: string;
  workerId: string;
  score: number;
  confidence: number;
  rationale?: string;
}