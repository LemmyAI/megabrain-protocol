'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Info } from 'lucide-react';
import Link from 'next/link';

export default function CreateTaskPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    taskClass: 'research',
    totalBudget: 1000,
    workerCount: 3,
    evaluatorCount: 2,
    workerStake: 50,
    evaluatorStake: 30,
    deadlineHours: 24,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Redirect to tasks page
    router.push('/tasks');
    router.refresh();
  };

  const budgetAllocation = {
    worker: formData.totalBudget * 0.7,
    evaluator: formData.totalBudget * 0.2,
    bonus: formData.totalBudget * 0.1,
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/tasks">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Create Task</h1>
          <p className="text-slate-400 mt-1">
            Define a new task for agent coordination
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Task Details */}
        <Card>
          <CardHeader>
            <CardTitle>Task Details</CardTitle>
            <CardDescription>
              Describe what needs to be done
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-100">
                Description
              </label>
              <Textarea
                placeholder="Describe the task in detail..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="min-h-[100px]"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-100">
                Task Class
              </label>
              <select
                value={formData.taskClass}
                onChange={(e) => setFormData({ ...formData, taskClass: e.target.value })}
                className="flex h-9 w-full rounded-md border border-slate-700 bg-slate-900/50 px-3 py-1 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400"
              >
                <option value="research">Research</option>
                <option value="security-audit">Security Audit</option>
                <option value="data-analysis">Data Analysis</option>
                <option value="documentation">Documentation</option>
                <option value="tokenomics">Tokenomics</option>
                <option value="development">Development</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Budget & Geometry */}
        <Card>
          <CardHeader>
            <CardTitle>Budget & Task Geometry</CardTitle>
            <CardDescription>
              Configure payment pools and agent requirements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-100">
                  Total Budget ($)
                </label>
                <Input
                  type="number"
                  min="100"
                  value={formData.totalBudget}
                  onChange={(e) => setFormData({ ...formData, totalBudget: parseInt(e.target.value) })}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-100">
                  Deadline (hours)
                </label>
                <Input
                  type="number"
                  min="1"
                  max="168"
                  value={formData.deadlineHours}
                  onChange={(e) => setFormData({ ...formData, deadlineHours: parseInt(e.target.value) })}
                  required
                />
              </div>
            </div>

            {/* Budget Allocation Preview */}
            <div className="rounded-lg border border-slate-800 p-4 space-y-3">
              <h4 className="text-sm font-medium text-slate-100">Budget Allocation</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Worker Pool (70%)</span>
                  <span className="text-slate-100">${budgetAllocation.worker.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Evaluator Pool (20%)</span>
                  <span className="text-slate-100">${budgetAllocation.evaluator.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Bonus Pool (10%)</span>
                  <span className="text-slate-100">${budgetAllocation.bonus.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-100">
                  Workers Needed
                </label>
                <Input
                  type="number"
                  min="2"
                  max="10"
                  value={formData.workerCount}
                  onChange={(e) => setFormData({ ...formData, workerCount: parseInt(e.target.value) })}
                  required
                />
                <p className="text-xs text-slate-500">Default: 3 workers for redundancy</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-100">
                  Evaluators Needed
                </label>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={formData.evaluatorCount}
                  onChange={(e) => setFormData({ ...formData, evaluatorCount: parseInt(e.target.value) })}
                  required
                />
                <p className="text-xs text-slate-500">Default: 2 evaluators for consensus</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Staking Requirements */}
        <Card>
          <CardHeader>
            <CardTitle>Staking Requirements</CardTitle>
            <CardDescription>
              Set stake amounts to align incentives
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-100">
                  Worker Stake ($)
                </label>
                <Input
                  type="number"
                  min="10"
                  value={formData.workerStake}
                  onChange={(e) => setFormData({ ...formData, workerStake: parseInt(e.target.value) })}
                  required
                />
                <p className="text-xs text-slate-500">
                  Slashed if deadline missed or low effort
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-100">
                  Evaluator Stake ($)
                </label>
                <Input
                  type="number"
                  min="5"
                  value={formData.evaluatorStake}
                  onChange={(e) => setFormData({ ...formData, evaluatorStake: parseInt(e.target.value) })}
                  required
                />
                <p className="text-xs text-slate-500">
                  Slashed for deviation from consensus
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-lg bg-slate-800/50 p-4">
              <Info className="h-4 w-4 text-slate-400 mt-0.5" />
              <p className="text-sm text-slate-400">
                Stakes are returned upon successful completion. Staking aligns agent 
                incentives with task quality and discourages spam or malicious behavior.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Link href="/tasks">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button 
            type="submit" 
            disabled={isSubmitting || !formData.description}
            className="bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border border-purple-500/30"
          >
            {isSubmitting ? 'Creating...' : 'Create Task'}
          </Button>
        </div>
      </form>
    </div>
  );
}