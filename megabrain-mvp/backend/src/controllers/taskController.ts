import { Request, Response } from 'express';
import { ethers } from 'ethers';
import { Interface, Log, Wallet } from 'ethers';

// Minimal ABI for reads
const TASK_MANAGER_ABI = [
  "event TaskCreated(bytes32 indexed taskId, address indexed requester, uint256 totalBudget, uint8 workerCount, uint8 evaluatorCount, uint64 submissionDeadline)",
  "function getTask(bytes32) view returns (tuple(bytes32 taskId,address requester,string description,bytes32 taskClass,uint256 totalBudget,uint256 workerPoolAmount,uint256 evaluatorPoolAmount,uint256 bonusPoolAmount,uint256 workerStake,uint256 evaluatorStake,uint64 submissionDeadline,uint64 evaluationDeadline,uint64 createdAt,uint8 status,uint8 workerCount,uint8 evaluatorCount,address[] workers,address[] evaluators,bytes32 metadataURI))",
  "function getResult(bytes32,address) view returns (tuple(bytes32 resultHash,string summary,bytes32 proof,uint64 submittedAt,bool submitted,uint8 finalScore,uint256 payment,bool inConsensus))",
  "function createTask(bytes32,string,bytes32,uint256,uint256,uint256,uint64,bytes32,uint8,uint8) returns (bool)",
  "function submitResult(bytes32,bytes32,string,bytes32)",
  "function submitEvaluation(bytes32,address,uint8,uint8,bytes32,string)"
];

const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC || 'https://rpc.sepolia.org');
const taskManagerAddress = process.env.TASK_MANAGER_CONTRACT;
const taskManagerInterface = new Interface(TASK_MANAGER_ABI);
const signer = (() => {
  const key = process.env.SIGNER_PRIVATE_KEY;
  if (!key) return null;
  try {
    return new Wallet(key, provider);
  } catch {
    return null;
  }
})();

function mapStatus(status: number): string {
  const map = ['Created', 'Open', 'Evaluating', 'Settled', 'Disputed', 'Cancelled'];
  return map[status] || 'Created';
}

async function fetchTask(taskId: string) {
  if (!taskManagerAddress) throw new Error('TASK_MANAGER_CONTRACT not set');
  const taskManager = new ethers.Contract(taskManagerAddress, TASK_MANAGER_ABI, provider);
  const t = await taskManager.getTask(taskId);
  return {
    id: t.taskId,
    description: t.description,
    taskClass: t.taskClass,
    requester: t.requester,
    totalBudget: t.totalBudget.toString(),
    workerCount: Number(t.workerCount),
    evaluatorCount: Number(t.evaluatorCount),
    workerStake: t.workerStake.toString(),
    evaluatorStake: t.evaluatorStake.toString(),
    submissionDeadline: Number(t.submissionDeadline),
    evaluationDeadline: Number(t.evaluationDeadline),
    status: mapStatus(Number(t.status)),
    workers: t.workers,
    evaluators: t.evaluators,
    createdAt: Number(t.createdAt),
    metadata: t.metadataURI,
  };
}

export async function listTasks(req: Request, res: Response) {
  try {
    if (!taskManagerAddress) {
      return res.status(500).json({ error: { code: 'MISSING_ADDRESS', message: 'TASK_MANAGER_CONTRACT not configured' } });
    }

    const { limit = 20, offset = 0 } = req.query;
    const logs: Log[] = await provider.getLogs({
      address: taskManagerAddress,
      topics: [taskManagerInterface.getEvent("TaskCreated")?.topicHash],
      fromBlock: process.env.TASK_EVENT_FROM_BLOCK ? BigInt(process.env.TASK_EVENT_FROM_BLOCK) : 0n,
      toBlock: 'latest'
    });

    const ids = logs.map(log => taskManagerInterface.decodeEventLog("TaskCreated", log.data, log.topics)?.taskId as string)
      .reverse(); // newest first

    const slice = ids.slice(Number(offset), Number(offset) + Number(limit));
    const tasks = await Promise.all(slice.map(id => fetchTask(id)));

    res.json({
      tasks,
      total: ids.length,
      limit: Number(limit),
      offset: Number(offset)
    });
  } catch (error) {
    console.error('listTasks error', error);
    res.status(500).json({ error: { code: 'TASK_LIST_FAILED', message: 'Failed to list tasks' } });
  }
}

export async function getTask(req: Request, res: Response) {
  try {
    const { taskId } = req.params;
    const task = await fetchTask(taskId as `0x${string}`);
    res.json(task);
  } catch (error) {
    console.error('getTask error', error);
    res.status(500).json({ error: { code: 'TASK_FETCH_FAILED', message: 'Failed to fetch task' } });
  }
}

function ensureSigner(res: Response) {
  if (!signer || !taskManagerAddress) {
    res.status(500).json({
      error: { code: 'MISSING_SIGNER', message: 'Backend signer or TASK_MANAGER_CONTRACT not configured' }
    });
    return false;
  }
  return true;
}

export async function createTask(req: Request, res: Response) {
  try {
    if (!ensureSigner(res)) return;
    const {
      description,
      taskClass,
      totalBudget,
      workerStake,
      evaluatorStake,
      submissionDeadline,
      metadataURI = '0x',
      workerCount = 3,
      evaluatorCount = 2,
      taskId
    } = req.body;

    if (!description || !taskClass || !totalBudget || !submissionDeadline) {
      return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'description, taskClass, totalBudget, submissionDeadline required' } });
    }

    const id = taskId || ethers.keccak256(ethers.randomBytes(32));
    const tm = new ethers.Contract(taskManagerAddress!, TASK_MANAGER_ABI, signer!);
    const tx = await tm.createTask(
      id,
      description,
      taskClass,
      ethers.toBigInt(totalBudget),
      ethers.toBigInt(workerStake || 0),
      ethers.toBigInt(evaluatorStake || 0),
      BigInt(submissionDeadline),
      metadataURI,
      workerCount,
      evaluatorCount
    );
    const receipt = await tx.wait();
    res.json({ taskId: id, txHash: receipt?.hash });
  } catch (error: any) {
    console.error('createTask error', error);
    res.status(500).json({ error: { code: 'TASK_CREATE_FAILED', message: error?.message || 'Failed to create task' } });
  }
}

export async function submitResult(req: Request, res: Response) {
  try {
    if (!ensureSigner(res)) return;
    const { taskId } = req.params;
    const { resultHash, summary, proof = '0x' } = req.body;
    if (!taskId || !resultHash || !summary) {
      return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'taskId, resultHash, summary required' } });
    }
    const tm = new ethers.Contract(taskManagerAddress!, TASK_MANAGER_ABI, signer!);
    const tx = await tm.submitResult(taskId, resultHash, summary, proof);
    const receipt = await tx.wait();
    res.json({ taskId, txHash: receipt?.hash });
  } catch (error: any) {
    console.error('submitResult error', error);
    res.status(500).json({ error: { code: 'SUBMIT_FAILED', message: error?.message || 'Failed to submit result' } });
  }
}

export async function submitEvaluation(req: Request, res: Response) {
  try {
    if (!ensureSigner(res)) return;
    const { taskId } = req.params;
    const { worker, score, confidence, evaluationHash = '0x', rationale = '' } = req.body;
    if (!taskId || !worker || score === undefined || confidence === undefined) {
      return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'taskId, worker, score, confidence required' } });
    }
    const tm = new ethers.Contract(taskManagerAddress!, TASK_MANAGER_ABI, signer!);
    const tx = await tm.submitEvaluation(taskId, worker, score, confidence, evaluationHash, rationale);
    const receipt = await tx.wait();
    res.json({ taskId, txHash: receipt?.hash });
  } catch (error: any) {
    console.error('submitEvaluation error', error);
    res.status(500).json({ error: { code: 'EVALUATION_FAILED', message: error?.message || 'Failed to submit evaluation' } });
  }
}

export function notImplemented(_req: Request, res: Response) {
  res.status(501).json({
    error: { code: 'NOT_IMPLEMENTED', message: 'This action is not supported via API. Call the contract directly.' }
  });
}
