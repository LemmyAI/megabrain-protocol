'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTask } from '@/hooks/useMBP';
import { TASK_STATUS_COLORS, TASK_STATUS_LABELS } from '@/types';

export default function TaskDetail() {
  const params = useParams();
  const id = params?.id as string;
  const { task, isLoading, error } = useTask(id);

  if (isLoading) {
    return <div className="p-6 text-center text-gray-500">Loading task...</div>;
  }

  if (error || !task) {
    return <div className="p-6 text-center text-red-500">Failed to load task.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">{task.id}</p>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{task.description}</h1>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span>Budget: ${(Number(task.totalBudget) / 1e6).toLocaleString()} USDC</span>
            <span>Workers: {task.workers.length}/{task.workerCount}</span>
            <span>Evaluators: {task.evaluators.length}/{task.evaluatorCount}</span>
            <span>Deadline: {new Date(task.submissionDeadline * 1000).toLocaleString()}</span>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${TASK_STATUS_COLORS[task.status as keyof typeof TASK_STATUS_COLORS]}`}>
          {TASK_STATUS_LABELS[task.status as keyof typeof TASK_STATUS_LABELS]}
        </span>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <InfoCard label="Requester" value={task.requester} />
        <InfoCard label="Task Class" value={task.taskClass} />
        <InfoCard label="Worker Stake" value={`${(Number(task.workerStake) / 1e6).toLocaleString()} USDC`} />
        <InfoCard label="Evaluator Stake" value={`${(Number(task.evaluatorStake) / 1e6).toLocaleString()} USDC`} />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Workers</h3>
        {task.workers.length === 0 ? (
          <p className="text-sm text-gray-500">No workers selected yet.</p>
        ) : (
          <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-200">
            {task.workers.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Results</h3>
        {task.results && task.results.length > 0 ? (
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-200">
            {task.results.map((r: any) => (
              <li key={r.worker} className="p-3 rounded border border-gray-200 dark:border-gray-800">
                <div className="flex justify-between">
                  <span className="font-mono">{r.worker}</span>
                  {r.submitted && <span className="text-xs text-green-600">Submitted</span>}
                </div>
                <p className="text-xs text-gray-500 break-all mt-1">Result: {r.resultHash}</p>
                <p className="text-sm mt-1">{r.summary || 'No summary'}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No submissions yet.</p>
        )}
      </div>

      <Link href="/tasks/available" className="text-indigo-600 hover:underline text-sm">
        ← Back to tasks
      </Link>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-mono text-gray-900 dark:text-white break-all">{value}</p>
    </div>
  );
}
