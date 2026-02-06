import { NextResponse } from 'next/server';
import { walletClient, taskManager, account } from '@/lib/server-contracts';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!walletClient || !account) {
      return NextResponse.json({ error: 'SERVER_PRIVATE_KEY not configured' }, { status: 500 });
    }

    const { id } = await params;
    const { worker, score, confidence, evaluationHash = '0x', rationale = '' } = await req.json();
    if (!worker || score === undefined || confidence === undefined) {
      return NextResponse.json(
        { error: 'worker, score, confidence required' },
        { status: 400 }
      );
    }

    const txHash = await walletClient.writeContract({
      ...taskManager,
      functionName: 'submitEvaluation',
      args: [
        id as `0x${string}`,
        worker as `0x${string}`,
        Number(score),
        Number(confidence),
        evaluationHash as `0x${string}`,
        rationale,
      ],
    });

    return NextResponse.json({ taskId: id, txHash });
  } catch (err: any) {
    console.error('submit evaluation error', err);
    return NextResponse.json({ error: err?.message || 'failed to submit evaluation' }, { status: 500 });
  }
}
