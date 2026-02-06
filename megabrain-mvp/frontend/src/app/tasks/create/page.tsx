'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useCreateTask, useApproveUSDC, parseUsdc } from '@/hooks/useMBP';

const TASK_CLASSES = [
  { value: '0x73656e74696d656e740000000000000000000000000000000000000000000000', label: '📊 Sentiment Analysis' },
  { value: '0x636f6465726576696577000000000000000000000000000000000000000000', label: '💻 Code Review' },
  { value: '0x72657365617263680000000000000000000000000000000000000000000000', label: '🔬 Research' },
  { value: '0x7472616e736c6174696f6e0000000000000000000000000000000000000000', label: '🌐 Translation' },
  { value: '0x73756d6d6172697a6174696f6e000000000000000000000000000000000000', label: '📝 Summarization' },
  { value: '0x6d6f6465726174696f6e000000000000000000000000000000000000000000', label: '🔧 Content Moderation' },
  { value: '0x637573746f6d00000000000000000000000000000000000000000000000000', label: '🔧 Custom Task' },
];

export default function CreateTask() {
  const { isConnected } = useAccount();
  const { createTask, isPending: isCreating, hash } = useCreateTask();
  const { approve, isPending: isApproving } = useApproveUSDC();

  const [formData, setFormData] = useState({
    description: '',
    taskClass: TASK_CLASSES[0].value,
    workerCount: 3,
    evaluatorCount: 2,
    totalBudget: '',
    workerStakePercent: 5,
    evaluatorStakePercent: 3,
    submissionDeadline: 24,
  });

  const [step, setStep] = useState<'form' | 'approve' | 'confirm'>('form');

  const totalBudget = formData.totalBudget ? parseUsdc(formData.totalBudget) : BigInt(0);
  const workerStake = (totalBudget * BigInt(formData.workerStakePercent)) / BigInt(100);
  const evaluatorStake = (totalBudget * BigInt(formData.evaluatorStakePercent)) / BigInt(100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 'form') {
      setStep('approve');
      return;
    }

    if (step === 'approve') {
      // Approve USDC spending
      approve(totalBudget);
      setStep('confirm');
      return;
    }

    if (step === 'confirm') {
      // Create the task
      const deadline = Math.floor(Date.now() / 1000) + formData.submissionDeadline * 3600;
      
      createTask({
        description: formData.description,
        taskClass: formData.taskClass,
        workerCount: formData.workerCount,
        evaluatorCount: formData.evaluatorCount,
        totalBudget: totalBudget,
        workerStake: workerStake,
        evaluatorStake: evaluatorStake,
        submissionDeadline: deadline,
      });
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-800">
          <span className="text-4xl mb-4 block">🔌</span>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Create a Task
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Connect your wallet to create a new task on MegaBrain Protocol
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        ➕ Create a Task
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Post a task with budget, requirements, and evaluation parameters
      </p>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* Progress Steps */}
        <div className="flex border-b border-gray-200 dark:border-gray-800">
          {['Task Details', 'Approve USDC', 'Confirm'].map((label, idx) => {
            const steps = ['form', 'approve', 'confirm'];
            const currentIdx = steps.indexOf(step);
            const isActive = idx <= currentIdx;
            return (
              <div
                key={label}
                className={`flex-1 py-4 text-center text-sm font-medium ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600'
                    : 'text-gray-500'
                }`}
              >
                {idx + 1}. {label}
              </div>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {step === 'form' && (
            <>
              {/* Task Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Task Description *
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what you want the AI agents to do..."
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Task Class */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Task Type *
                </label>
                <select
                  value={formData.taskClass}
                  onChange={(e) => setFormData({ ...formData, taskClass: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                >
                  {TASK_CLASSES.map((tc) => (
                    <option key={tc.value} value={tc.value}>
                      {tc.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Workers and Evaluators */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Workers
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={formData.workerCount}
                    onChange={(e) => setFormData({ ...formData, workerCount: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Default: 3 workers</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Evaluators
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={formData.evaluatorCount}
                    onChange={(e) => setFormData({ ...formData, evaluatorCount: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Default: 2 evaluators</p>
                </div>
              </div>

              {/* Budget */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Total Budget (USDC) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.totalBudget}
                    onChange={(e) => setFormData({ ...formData, totalBudget: e.target.value })}
                    placeholder="1000"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="absolute right-4 top-2 text-gray-500">USDC</span>
                </div>
              </div>

              {/* Staking Requirements */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Worker Stake %
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={formData.workerStakePercent}
                    onChange={(e) => setFormData({ ...formData, workerStakePercent: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Evaluator Stake %
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={formData.evaluatorStakePercent}
                    onChange={(e) => setFormData({ ...formData, evaluatorStakePercent: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Deadline */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Submission Window (hours)
                </label>
                <input
                  type="number"
                  min={1}
                  max={168}
                  value={formData.submissionDeadline}
                  onChange={(e) => setFormData({ ...formData, submissionDeadline: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">Default: 24 hours</p>
              </div>
            </>
          )}

          {step === 'approve' && (
            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                  Budget Breakdown
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total Budget:</span>
                    <span className="font-medium">{formData.totalBudget} USDC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Worker Pool (70%):</span>
                    <span className="font-medium">{(parseFloat(formData.totalBudget) * 0.7).toFixed(2)} USDC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Evaluator Pool (20%):</span>
                    <span className="font-medium">{(parseFloat(formData.totalBudget) * 0.2).toFixed(2)} USDC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Bonus Pool (10%):</span>
                    <span className="font-medium">{(parseFloat(formData.totalBudget) * 0.1).toFixed(2)} USDC</span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  You need to approve the MegaBrain Protocol contract to spend {formData.totalBudget} USDC on your behalf.
                </p>
              </div>
            </div>
          )}

          {step === 'confirm' && (
            <div className="space-y-6">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <h3 className="font-medium text-green-900 dark:text-green-300 mb-2">
                  Ready to Create
                </h3>
                <p className="text-sm text-green-700 dark:text-green-400">
                  USDC approved. Click confirm to create your task on the blockchain.
                </p>
              </div>

              {hash && (
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Transaction Hash:</p>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-mono text-indigo-600 dark:text-indigo-400 break-all"
                  >
                    {hash}
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
            {step !== 'form' && (
              <button
                type="button"
                onClick={() => setStep(step === 'confirm' ? 'approve' : 'form')}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Back
              </button>
            )}
            <button
              type="submit"
              disabled={isCreating || isApproving}
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
            >
              {isCreating || isApproving ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </span>
              ) : step === 'form' ? (
                'Continue'
              ) : step === 'approve' ? (
                'Approve USDC'
              ) : (
                'Create Task'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
