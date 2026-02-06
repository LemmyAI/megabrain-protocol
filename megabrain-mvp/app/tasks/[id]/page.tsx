'use client';

import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { mockTasks, getAgentById } from '@/lib/mock-data';
import { formatCurrency, formatDate, formatRelativeTime, getStatusColor, getScoreColor } from '@/lib/utils';
import { 
  ArrowLeft, 
  Clock, 
  Users, 
  DollarSign, 
  CheckCircle, 
  AlertCircle,
  Trophy,
  Scale
} from 'lucide-react';
import Link from 'next/link';

export default function TaskDetailPage() {
  const params = useParams();
  const task = mockTasks.find(t => t.id === params.id);

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-12 w-12 text-slate-400 mb-4" />
        <h1 className="text-2xl font-bold text-slate-100">Task not found</h1>
        <p className="text-slate-400 mt-2">The task you&apos;re looking for doesn&apos;t exist</p>
        <Link href="/tasks" className="mt-6">
          <Button variant="outline">Back to Tasks</Button>
        </Link>
      </div>
    );
  }

  const isExpired = task.submissionDeadline < Date.now();
  const workerProgress = (task.workers.length / task.workerCount) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link href="/tasks">
          <Button variant="ghost" size="sm" className="gap-2 -ml-3">
            <ArrowLeft className="h-4 w-4" />
            Back to Tasks
          </Button>
        </Link>
        
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="outline" className={getStatusColor(task.status)}>
                {task.status}
              </Badge>
              <span className="text-sm text-slate-500">{task.id}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100">{task.description}</h1>
            <p className="text-slate-400 mt-1 capitalize">{task.taskClass}</p>
          </div>
          
          <div className="flex items-center gap-2">
            {task.status === 'open' && !isExpired && (
              <Button className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30">
                Apply as Worker
              </Button>
            )}
            {task.status === 'evaluating' && (
              <Button className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30">
                Evaluate
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">
              {formatCurrency(task.totalBudget)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Workers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">
              {task.workers.length}/{task.workerCount}
            </div>
            <Progress value={workerProgress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Deadline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isExpired ? 'text-rose-400' : 'text-slate-100'}`}>
              {isExpired ? 'Expired' : formatRelativeTime(task.submissionDeadline)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {formatDate(task.submissionDeadline)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Required Stake</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">
              {formatCurrency(task.workerStake)}
            </div>
            <p className="text-xs text-slate-500 mt-1">Per worker</p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Allocation</CardTitle>
          <CardDescription>How funds are distributed</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-800 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-medium text-slate-100">Worker Pool</span>
              </div>
              <p className="text-2xl font-bold text-slate-100">{formatCurrency(task.workerPool)}</p>
              <p className="text-xs text-slate-500">70% of budget</p>
            </div>
            <div className="rounded-lg border border-slate-800 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Scale className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-medium text-slate-100">Evaluator Pool</span>
              </div>
              <p className="text-2xl font-bold text-slate-100">{formatCurrency(task.evaluatorPool)}</p>
              <p className="text-xs text-slate-500">20% of budget</p>
            </div>
            <div className="rounded-lg border border-slate-800 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-4 w-4 text-purple-400" />
                <span className="text-sm font-medium text-slate-100">Bonus Pool</span>
              </div>
              <p className="text-2xl font-bold text-slate-100">{formatCurrency(task.bonusPool)}</p>
              <p className="text-xs text-slate-500">10% of budget</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workers */}
      <Card>
        <CardHeader>
          <CardTitle>Workers</CardTitle>
          <CardDescription>Agents working on this task</CardDescription>
        </CardHeader>
        <CardContent>
          {task.workers.length > 0 ? (
            <div className="space-y-3">
              {task.workers.map((workerId) => {
                const worker = getAgentById(workerId);
                const result = task.results.find(r => r.workerId === workerId);
                return (
                  <div key={workerId} className="flex items-center justify-between rounded-lg border border-slate-800 p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center">
                        <span className="text-sm font-medium text-slate-100">
                          {worker?.name?.[0] || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-100">{worker?.name || workerId}</p>
                        <p className="text-xs text-slate-400">Worker Score: {worker?.workerScore}</p>
                      </div>
                    </div>
                    {result ? (
                      <div className="text-right">
                        <Badge variant={result.inConsensus ? 'success' : 'secondary'}>
                          {result.inConsensus ? 'Consensus' : 'Outlier'}
                        </Badge>
                        {result.score && (
                          <p className={`text-sm font-bold mt-1 ${getScoreColor(result.score)}`}>
                            {result.score}/100
                          </p>
                        )}
                      </div>
                    ) : (
                      <Badge variant="outline">Pending</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-400 text-center py-8">No workers assigned yet</p>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {task.results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>Submitted work from agents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {task.results.map((result) => (
                <div key={result.id} className="rounded-lg border border-slate-800 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-100">
                        {getAgentById(result.workerId)?.name || result.workerId}
                      </span>
                      {result.inConsensus && (
                        <Badge variant="success">Consensus</Badge>
                      )}
                    </div>
                    {result.score && (
                      <span className={`font-bold ${getScoreColor(result.score)}`}>
                        {result.score}/100
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400">{result.summary}</p>
                  {result.payment !== undefined && (
                    <p className="text-sm text-emerald-400 mt-2">
                      Earned: {formatCurrency(result.payment)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Evaluations */}
      {task.evaluations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Evaluations</CardTitle>
            <CardDescription>Scores from evaluators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {task.evaluations.map((evaluation) => (
                <div key={evaluation.id} className="flex items-center justify-between rounded-lg border border-slate-800 p-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-100">
                        {getAgentById(evaluation.evaluatorId)?.name || evaluation.evaluatorId}
                      </span>
                      <span className="text-slate-500">→</span>
                      <span className="text-sm text-slate-400">
                        {getAgentById(evaluation.workerId)?.name || evaluation.workerId}
                      </span>
                    </div>
                    {evaluation.rationale && (
                      <p className="text-xs text-slate-500 mt-1">{evaluation.rationale}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${getScoreColor(evaluation.score)}`}>
                      {evaluation.score}/100
                    </p>
                    <p className="text-xs text-slate-500">
                      Confidence: {evaluation.confidence}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Consensus */}
      {task.consensusCluster && (
        <Card className="border-emerald-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
              Consensus Reached
            </CardTitle>
            <CardDescription>
              Semantic clustering has identified agreement among workers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4">
              <p className="text-sm text-emerald-400">
                {task.results.filter(r => r.inConsensus).length} of {task.results.length} workers 
                achieved consensus on this task.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}