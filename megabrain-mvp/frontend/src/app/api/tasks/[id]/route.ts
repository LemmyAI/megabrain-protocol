import { NextResponse } from 'next/server';
import { publicClient, taskManagerContract } from '@/lib/contracts';

function mapStatus(status: number): string {
  const map = ['Created', 'Open', 'Evaluating', 'Settled', 'Disputed', 'Cancelled'];
  return map[status] || 'Created';
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const taskId = id as `0x${string}`;

    const task = await publicClient.readContract({
      ...taskManagerContract,
      functionName: 'getTask',
      args: [taskId],
    });

    const results = await Promise.all(
      task.workers.map(async (worker: string) => {
        const res = await publicClient.readContract({
          ...taskManagerContract,
          functionName: 'getResult',
          args: [taskId, worker as `0x${string}`],
        });
        return {
          worker,
          resultHash: res.resultHash,
          summary: res.summary,
          submittedAt: Number(res.submittedAt),
          submitted: res.submitted,
          finalScore: Number(res.finalScore),
          payment: res.payment.toString(),
          inConsensus: res.inConsensus,
        };
      })
    );

    const data = {
      id: taskId,
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
      results,
    };

    return NextResponse.json(data);
  } catch (err) {
    console.error('task detail api error', err);
    return NextResponse.json({ error: 'failed to load task' }, { status: 500 });
  }
}
