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
    const { resultHash, summary, proof = '0x' } = await req.json();
    if (!resultHash || !summary) {
      return NextResponse.json(
        { error: 'resultHash and summary required' },
        { status: 400 }
      );
    }

    const txHash = await walletClient.writeContract({
      ...taskManager,
      functionName: 'submitResult',
      args: [id as `0x${string}`, resultHash as `0x${string}`, summary, proof as `0x${string}`],
    });

    return NextResponse.json({ taskId: id, txHash });
  } catch (err: any) {
    console.error('submit result error', err);
    return NextResponse.json({ error: err?.message || 'failed to submit result' }, { status: 500 });
  }
}
