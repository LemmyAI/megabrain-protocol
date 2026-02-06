// Minimal ABIs for the deployed MegaBrain contracts

export const TASK_MANAGER_ABI = [
  {
    inputs: [
      { internalType: 'bytes32', name: '_taskId', type: 'bytes32' },
      { internalType: 'string', name: '_description', type: 'string' },
      { internalType: 'bytes32', name: '_taskClass', type: 'bytes32' },
      { internalType: 'uint256', name: '_totalBudget', type: 'uint256' },
      { internalType: 'uint256', name: '_workerStake', type: 'uint256' },
      { internalType: 'uint256', name: '_evaluatorStake', type: 'uint256' },
      { internalType: 'uint64', name: '_submissionDeadline', type: 'uint64' },
      { internalType: 'bytes32', name: '_metadataURI', type: 'bytes32' },
      { internalType: 'uint8', name: '_workerCount', type: 'uint8' },
      { internalType: 'uint8', name: '_evaluatorCount', type: 'uint8' },
    ],
    name: 'createTask',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: '_taskId', type: 'bytes32' },
      { internalType: 'bytes32', name: '_resultHash', type: 'bytes32' },
      { internalType: 'string', name: '_summary', type: 'string' },
      { internalType: 'bytes32', name: '_proof', type: 'bytes32' },
    ],
    name: 'submitResult',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: '_taskId', type: 'bytes32' },
      { internalType: 'address', name: '_worker', type: 'address' },
      { internalType: 'uint8', name: '_score', type: 'uint8' },
      { internalType: 'uint8', name: '_confidence', type: 'uint8' },
      { internalType: 'bytes32', name: '_evaluationHash', type: 'bytes32' },
      { internalType: 'string', name: '_rationale', type: 'string' },
    ],
    name: 'submitEvaluation',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: '_taskId', type: 'bytes32' }],
    name: 'getTask',
    outputs: [
      {
        components: [
          { internalType: 'bytes32', name: 'taskId', type: 'bytes32' },
          { internalType: 'address', name: 'requester', type: 'address' },
          { internalType: 'string', name: 'description', type: 'string' },
          { internalType: 'bytes32', name: 'taskClass', type: 'bytes32' },
          { internalType: 'uint256', name: 'totalBudget', type: 'uint256' },
          { internalType: 'uint256', name: 'workerPoolAmount', type: 'uint256' },
          { internalType: 'uint256', name: 'evaluatorPoolAmount', type: 'uint256' },
          { internalType: 'uint256', name: 'bonusPoolAmount', type: 'uint256' },
          { internalType: 'uint256', name: 'workerStake', type: 'uint256' },
          { internalType: 'uint256', name: 'evaluatorStake', type: 'uint256' },
          { internalType: 'uint64', name: 'submissionDeadline', type: 'uint64' },
          { internalType: 'uint64', name: 'evaluationDeadline', type: 'uint64' },
          { internalType: 'uint64', name: 'createdAt', type: 'uint64' },
          { internalType: 'uint8', name: 'status', type: 'uint8' },
          { internalType: 'uint8', name: 'workerCount', type: 'uint8' },
          { internalType: 'uint8', name: 'evaluatorCount', type: 'uint8' },
          { internalType: 'address[]', name: 'workers', type: 'address[]' },
          { internalType: 'address[]', name: 'evaluators', type: 'address[]' },
          { internalType: 'bytes32', name: 'metadataURI', type: 'bytes32' },
        ],
        internalType: 'struct MegaBrainTaskManager.Task',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: '_taskId', type: 'bytes32' },
      { internalType: 'address', name: '_worker', type: 'address' },
    ],
    name: 'getResult',
    outputs: [
      {
        components: [
          { internalType: 'bytes32', name: 'resultHash', type: 'bytes32' },
          { internalType: 'string', name: 'summary', type: 'string' },
          { internalType: 'bytes32', name: 'proof', type: 'bytes32' },
          { internalType: 'uint64', name: 'submittedAt', type: 'uint64' },
          { internalType: 'bool', name: 'submitted', type: 'bool' },
          { internalType: 'uint8', name: 'finalScore', type: 'uint8' },
          { internalType: 'uint256', name: 'payment', type: 'uint256' },
          { internalType: 'bool', name: 'inConsensus', type: 'bool' },
        ],
        internalType: 'struct MegaBrainTaskManager.Result',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getTaskCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'taskId', type: 'bytes32' },
      { indexed: true, internalType: 'address', name: 'requester', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'totalBudget', type: 'uint256' },
      { indexed: false, internalType: 'uint8', name: 'workerCount', type: 'uint8' },
      { indexed: false, internalType: 'uint8', name: 'evaluatorCount', type: 'uint8' },
      { indexed: false, internalType: 'uint64', name: 'submissionDeadline', type: 'uint64' },
    ],
    name: 'TaskCreated',
    type: 'event',
  },
] as const;

export const REGISTRY_ABI = [
  {
    inputs: [
      { internalType: 'uint8', name: '_role', type: 'uint8' },
      { internalType: 'bytes32', name: '_capabilitiesHash', type: 'bytes32' },
      { internalType: 'string', name: '_metadataURI', type: 'string' },
      { internalType: 'uint256', name: '_stakeAmount', type: 'uint256' },
    ],
    name: 'register',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_agent', type: 'address' }],
    name: 'getAgent',
    outputs: [
      {
        components: [
          { internalType: 'uint8', name: 'role', type: 'uint8' },
          { internalType: 'uint256', name: 'stakeAmount', type: 'uint256' },
          { internalType: 'uint256', name: 'workerReputation', type: 'uint256' },
          { internalType: 'uint256', name: 'evaluatorReputation', type: 'uint256' },
          { internalType: 'uint64', name: 'lastActive', type: 'uint64' },
          { internalType: 'bytes32', name: 'capabilitiesHash', type: 'bytes32' },
          { internalType: 'string', name: 'metadataURI', type: 'string' },
        ],
        internalType: 'struct MegaBrainRegistry.Agent',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export const USDC_ABI = [
  {
    inputs: [{ internalType: 'uint256', name: 'amount', type: 'uint256' }],
    name: 'faucet',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'spender', type: 'address' },
      { internalType: 'uint256', name: 'value', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Backwards compat exports for existing imports in hooks
export const MBP_CORE_ABI = TASK_MANAGER_ABI;
export const ERC20_ABI = USDC_ABI;
