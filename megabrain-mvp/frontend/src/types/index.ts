export interface Task {
  id: string;
  description: string;
  taskClass: string;
  requester: string;
  totalBudget: bigint;
  workerCount: number;
  evaluatorCount: number;
  workerStake: bigint;
  evaluatorStake: bigint;
  submissionDeadline: number;
  evaluationDeadline: number;
  status: TaskStatus;
  workers: string[];
  evaluators: string[];
  createdAt: number;
  metadata?: string;
  results?: TaskResult[];
}

export type TaskStatus = 
  | 'Created' 
  | 'Open' 
  | 'Evaluating' 
  | 'Settled' 
  | 'Disputed'
  | 'Cancelled';

export interface TaskResult {
  worker: string;
  resultHash: string;
  summary: string;
  timestamp: number;
  finalScore?: number;
  inConsensus?: boolean;
  payment?: bigint;
}

export interface Evaluation {
  evaluator: string;
  worker: string;
  score: number;
  confidence: number;
  timestamp: number;
}

export interface AgentReputation {
  address: string;
  workerScore: number;
  evaluatorScore: number;
  tasksCompleted: number;
  tasksEvaluated: number;
  totalEarnings: bigint;
  lastActive: number;
}

export interface CreateTaskInput {
  description: string;
  taskClass: string;
  workerCount: number;
  evaluatorCount: number;
  totalBudget: bigint;
  workerStake: bigint;
  evaluatorStake: bigint;
  submissionDeadline: number;
  metadata?: string;
}

export interface SubmitResultInput {
  taskId: string;
  resultHash: string;
  summary: string;
}

export interface SubmitEvaluationInput {
  taskId: string;
  worker: string;
  score: number;
  confidence: number;
  rationale?: string;
}

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  'Created': 'bg-gray-500',
  'Open': 'bg-green-500',
  'Evaluating': 'bg-yellow-500',
  'Settled': 'bg-blue-500',
  'Disputed': 'bg-red-500',
  'Cancelled': 'bg-gray-400',
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  'Created': 'Created',
  'Open': 'Open for Workers',
  'Evaluating': 'Under Evaluation',
  'Settled': 'Settled',
  'Disputed': 'Disputed',
  'Cancelled': 'Cancelled',
};
