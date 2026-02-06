'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { useAvailableTasks } from '@/hooks/useMBP';
import { TASK_STATUS_COLORS, TASK_STATUS_LABELS } from '@/types';

export default function AvailableTasks() {
  const { isConnected } = useAccount();
  const { tasks, isLoading } = useAvailableTasks();
  const [filter, setFilter] = useState<'all' | 'open' | 'evaluating'>('all');

  const visibleTasks = tasks.filter((t) => {
    if (filter === 'open') return t.status === 'Open';
    if (filter === 'evaluating') return t.status === 'Evaluating';
    return true;
  });

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-800">
          <span className="text-4xl mb-4 block">🔌</span>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Available Tasks</h1>
          <p className="text-gray-600 dark:text-gray-400">Connect your wallet to view and participate in tasks</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">📋 Available Tasks</h1>
          <p className="text-gray-600 dark:text-gray-400">Browse live tasks on Sepolia</p>
        </div>
        <div className="flex bg-white dark:bg-gray-900 rounded-lg p-1 border border-gray-200 dark:border-gray-800">
          {[
            { key: 'all', label: 'All' },
            { key: 'open', label: 'Open' },
            { key: 'evaluating', label: 'Evaluating' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as typeof filter)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === tab.key
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Loading tasks...</p>
          </div>
        ) : visibleTasks.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            <span className="text-4xl mb-4 block">📭</span>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No tasks available</h3>
            <p className="text-gray-500">Check back later for new opportunities</p>
          </div>
        ) : (
          visibleTasks.map((task) => (
            <Link
              key={task.id}
              href={`/tasks/${task.id}`}
              className="block rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">{task.description}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>Budget: ${(Number(task.totalBudget) / 1e6).toLocaleString()} USDC</span>
                    <span>Workers: {task.workers.length}/{task.workerCount}</span>
                    <span>Evaluators: {task.evaluators.length}/{task.evaluatorCount}</span>
                    <span>Deadline: {new Date(task.submissionDeadline * 1000).toLocaleDateString()}</span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${TASK_STATUS_COLORS[task.status as keyof typeof TASK_STATUS_COLORS]}`}>
                  {TASK_STATUS_LABELS[task.status as keyof typeof TASK_STATUS_LABELS]}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
