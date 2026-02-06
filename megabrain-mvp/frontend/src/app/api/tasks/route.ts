import { NextResponse } from 'next/server';
import { publicClient, taskManagerContract } from '@/lib/contracts';
import { TASK_MANAGER_ABI } from '@/abis';
import { parseAbiItem, parseUnits, isHex, toHex } from 'viem';
import { walletClient, taskManager, account } from '@/lib/server-contracts';

const taskCreatedEvent = parseAbiItem(
  'event TaskCreated(bytes32 indexed taskId, address indexed requester, uint256 totalBudget, uint8 workerCount, uint8 evaluatorCount, uint64 submissionDeadline)'
);

function mapStatus(status: number): string {
  const map = ['Created', 'Open', 'Evaluating', 'Settled', 'Disputed', 'Cancelled'];
  return map[status] || 'Created';
}

export async function GET() {
  try {
    const fromBlock =
      process.env.NEXT_PUBLIC_TASK_EVENT_FROM_BLOCK !== undefined
        ? BigInt(process.env.NEXT_PUBLIC_TASK_EVENT_FROM_BLOCK)
        : BigInt(0);
    const toBlock = 'latest';

    const logs = await publicClient.getLogs({
      address: taskManagerContract.address,
      event: taskCreatedEvent,
      fromBlock,
      toBlock,
    });

    const taskIds = logs
      .map((log) => log.args.taskId)
      .filter((id): id is `0x${string}` => id !== undefined);

    const tasks = await Promise.all(
      taskIds.map(async (id) => {
        const task = await publicClient.readContract({
          ...taskManagerContract,
          functionName: 'getTask',
          args: [id],
        });

        return {
          id,
          description: task.description,
          taskClass: task.taskClass,
          requester: task.requester,
          totalBudget: task.totalBudget.toString(),
          workerCount: Number(task.workerCount),
          evaluatorCount: Number(task.evaluatorCount),
          workerStake: task.workerStake.toString(),
        evaluatorStake: task.evaluatorStake.toString(),
        submissionDeadline: Number(task.submissionDeadline),
        evaluationDeadline: Number(task.evaluationDeadline),
        status: mapStatus(Number(task.status)),
        workers: task.workers,
        evaluators: task.evaluators,
        createdAt: Number(task.createdAt),
        metadata: task.metadataURI,
      };
    })
  );

    return NextResponse.json({ tasks });
  } catch (err) {
    console.error('tasks api error', err);
    return NextResponse.json({ error: 'failed to load tasks' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!walletClient || !account) {
      return NextResponse.json({ error: 'SERVER_PRIVATE_KEY not configured' }, { status: 500 });
    }

    const body = await req.json();
    const {
      description,
      taskClass,
      totalBudget,
      workerStake = 0,
      evaluatorStake = 0,
      submissionDeadline,
      metadataURI = '0x',
      workerCount = 3,
      evaluatorCount = 2,
      taskId,
    } = body;

    if (!description || !taskClass || totalBudget === undefined || !submissionDeadline) {
      return NextResponse.json(
        { error: 'description, taskClass, totalBudget, submissionDeadline required' },
        { status: 400 }
      );
    }

    const id =
      taskId && isHex(taskId)
        ? (taskId as `0x${string}`)
        : (toHex(crypto.getRandomValues(new Uint8Array(32))) as `0x${string}`);

    const txHash = await walletClient.writeContract({
      ...taskManager,
      functionName: 'createTask',
      args: [
        id,
        description,
        taskClass as `0x${string}`,
        parseUnits(String(totalBudget), 6),
        parseUnits(String(workerStake), 6),
        parseUnits(String(evaluatorStake), 6),
        BigInt(submissionDeadline),
        metadataURI as `0x${string}`,
        workerCount,
        evaluatorCount,
      ],
    });

    return NextResponse.json({ taskId: id, txHash });
  } catch (err: any) {
    console.error('task create error', err);
    return NextResponse.json({ error: err?.message || 'failed to create task' }, { status: 500 });
  }
}
