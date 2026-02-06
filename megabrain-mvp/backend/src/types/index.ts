// ============================================
// MegaBrain Protocol - Type Definitions
// ============================================

export type AgentType = 'worker' | 'evaluator' | 'both';
export type TaskStatus = 'created' | 'open' | 'evaluating' | 'settled' | 'disputed' | 'inconclusive';
export type ParticipantRole = 'worker' | 'evaluator';
export type ParticipantStatus = 'pending' | 'active' | 'slashed' | 'rewarded';
export interface Agent {
  id: string;
  public_key: string;
  agent_type: AgentType;
  address?: string;
  worker_reputation: number;
  evaluator_reputation: number;
  tasks_completed: number;
  evaluations_completed: number;
  total_earned: number;
  total_staked: number;
  total_slashed: number;
  capabilities: string[];
  webhooks: WebhookConfig[];
  last_active?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface WebhookConfig {
  url: string;
  events: string[];
  secret?: string;
}

export interface Task {
  id: string;
  task_id: string;
  requester_id: string;
  status: TaskStatus;
  description: string;
  task_class: string;
  worker_count: number;
  evaluator_count: number;
  total_budget: number;
  worker_pool: number;
  evaluator_pool: number;
  bonus_pool: number;
  worker_stake: number;
  evaluator_stake: number;
  submission_deadline: Date;
  evaluation_deadline?: Date;
  dispute_deadline?: Date;
  result_hash?: string;
  metadata: Record<string, any>;
  consensus_score?: number;
  winning_cluster_hash?: string;
  total_paid: number;
  total_slashed: number;
  created_at: Date;
  updated_at: Date;
}

export interface TaskParticipant {
  id: string;
  task_id: string;
  agent_id: string;
  role: ParticipantRole;
  stake_amount: number;
  stake_tx_hash?: string;
  status: ParticipantStatus;
  payment_amount: number;
  payment_tx_hash?: string;
  selected_at?: Date;
  completed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Submission {
  id: string;
  task_id: string;
  worker_id: string;
  participant_id: string;
  summary: string;
  result: any;
  result_hash: string;
  ipfs_hash?: string;
  embedding_vector_length?: number;
  embedding?: number[];
  final_score?: number;
  in_consensus: boolean;
  cluster_id?: number;
  cluster_distance?: number;
  status: 'submitted' | 'evaluated' | 'rewarded' | 'slashed';
  created_at: Date;
  updated_at: Date;
}

export interface Evaluation {
  id: string;
  task_id: string;
  evaluator_id: string;
  submission_id: string;
  worker_id: string;
  score: number;
  confidence: number;
  rationale?: string;
  corrections: any[];
  metadata: Record<string, any>;
  consensus_distance?: number;
  is_outlier: boolean;
  alignment_score?: number;
  reward_amount: number;
  status: 'submitted' | 'processed' | 'rewarded' | 'slashed';
  created_at: Date;
  updated_at: Date;
}

export interface Cluster {
  id: string;
  task_id: string;
  cluster_id: number;
  cluster_hash: string;
  centroid?: number[];
  submission_count: number;
  average_score?: number;
  coherence_score?: number;
  is_dominant: boolean;
  dominance_ratio?: number;
  created_at: Date;
  updated_at: Date;
}

export interface Settlement {
  id: string;
  task_id: string;
  settlement_tx_hash?: string;
  distribution?: PaymentDistribution;
  consensus_data?: ConsensusData;
  total_paid: number;
  total_slashed: number;
  status: 'pending' | 'submitted' | 'confirmed' | 'failed';
  confirmations: number;
  error_message?: string;
  triggered_at?: Date;
  confirmed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface PaymentDistribution {
  workers: WorkerPayment[];
  evaluators: EvaluatorPayment[];
  totalWorkerPayments: number;
  totalEvaluatorPayments: number;
  totalSlashed: number;
}

export interface WorkerPayment {
  workerId: string;
  address: string;
  basePayment: number;
  bonusPayment: number;
  totalPayment: number;
  score: number;
  inConsensus: boolean;
}

export interface EvaluatorPayment {
  evaluatorId: string;
  address: string;
  payment: number;
  alignment: number;
  confidence: number;
  isOutlier: boolean;
}

export interface ConsensusData {
  consensusScore: number;
  confidence: number;
  dominantClusterHash: string;
  clusterSizes: number[];
  noiseRatio: number;
  outliers: string[];
  supportRatio: number;
}

export interface ReputationHistory {
  id: string;
  agent_id: string;
  task_id?: string;
  event_type: string;
  worker_reputation_delta: number;
  evaluator_reputation_delta: number;
  worker_reputation_after?: number;
  evaluator_reputation_after?: number;
  reason?: string;
  created_at: Date;
}

// API Request/Response types

export interface RegisterAgentRequest {
  publicKey: string;
  agentType: AgentType;
  address?: string;
  capabilities?: string[];
  webhookUrl?: string;
  webhookEvents?: string[];
}

export interface RegisterAgentResponse {
  agentId: string;
  publicKey: string;
  token: string;
  refreshToken: string;
}

export interface AvailableTask {
  taskId: string;
  description: string;
  taskClass: string;
  budget: number;
  deadline: number;
  stakeRequired: number;
  workerCount: number;
  evaluatorCount: number;
}

export interface SubmitResultRequest {
  result: any;
  summary: string;
}

export interface SubmitResultResponse {
  submissionId: string;
  resultHash: string;
  ipfsHash?: string;
  confirmations: number;
}

export interface SubmitEvaluationRequest {
  score: number;
  confidence: number;
  rationale?: string;
  corrections?: any[];
}

export interface SubmitEvaluationResponse {
  evaluationId: string;
  txHash?: string;
}

export interface ConsensusResponse {
  taskId: string;
  status: TaskStatus;
  consensusScore: number;
  confidence: number;
  dominantClusterHash: string;
  clusterSizes: number[];
  noiseRatio: number;
  outliers: string[];
  supportRatio: number;
  workerScores: WorkerConsensusScore[];
  settlementStatus?: string;
}

export interface WorkerConsensusScore {
  workerId: string;
  score: number;
  inConsensus: boolean;
  clusterId?: number;
}

export interface TriggerSettlementResponse {
  settlementId: string;
  status: string;
  txHash?: string;
  message: string;
}

// Clustering types

export interface ClusteringInput {
  submissionId: string;
  text: string;
  workerId: string;
}

export interface ClusteringResult {
  clusters: Map<number, ClusterData>;
  noise: string[];
  dominantClusterId?: number;
  noiseRatio: number;
}

export interface ClusterData {
  id: number;
  submissionIds: string[];
  centroid: number[];
  size: number;
  coherence: number;
}

// Embedding types

export interface EmbeddingResult {
  embedding: number[];
  dimensions: number;
  model: string;
}

// Blockchain types

export interface BlockchainConfig {
  rpcUrl: string;
  chainId: number;
  contractAddress: string;
  privateKey: string;
}

export interface TaskContractData {
  taskId: string;
  requester: string;
  status: number;
  totalBudget: bigint;
  workerPool: bigint;
  evaluatorPool: bigint;
  submissionDeadline: bigint;
  evaluationDeadline: bigint;
}
