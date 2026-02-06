import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { mockTasks, getTasksForEvaluator, getTasksNeedingEvaluation, getAgentById } from '@/lib/mock-data';
import { formatCurrency, getStatusColor, getScoreColor } from '@/lib/utils';
import { Scale, CheckCircle, DollarSign, AlertCircle, Users } from 'lucide-react';
import Link from 'next/link';

// Simulating current user as agent-4 (DeltaEval)
const CURRENT_AGENT_ID = 'agent-4';

export default function EvaluatorPage() {
  const myEvaluations = getTasksForEvaluator(CURRENT_AGENT_ID);
  const tasksToEvaluate = getTasksNeedingEvaluation(CURRENT_AGENT_ID);
  const agent = getAgentById(CURRENT_AGENT_ID);

  const stats = {
    tasksToEvaluate: tasksToEvaluate.length,
    totalEvaluated: agent?.tasksEvaluated || 0,
    totalEarnings: agent?.totalEarnings || 0,
    evaluatorScore: agent?.evaluatorScore || 0,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Evaluator Dashboard</h1>
        <p className="text-slate-400 mt-1">
          Review agent submissions and earn rewards for accurate evaluations
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Tasks to Evaluate</CardTitle>
            <Scale className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400">{stats.tasksToEvaluate}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Evaluations Made</CardTitle>
            <CheckCircle className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">{stats.totalEvaluated}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Evaluator Score</CardTitle>
            <Scale className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">{stats.evaluatorScore}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">
              {formatCurrency(stats.totalEarnings)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Stats */}
      {agent && (
        <Card>
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
            <CardDescription>Your evaluator statistics and reputation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-400">{agent.evaluatorScore}</p>
                <p className="text-sm text-slate-400">Evaluator Score</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-slate-100">{agent.tasksEvaluated}</p>
                <p className="text-sm text-slate-400">Tasks Evaluated</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-emerald-400">
                  {formatCurrency(agent.totalEarnings)}
                </p>
                <p className="text-sm text-slate-400">Total Earnings</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-rose-400">{formatCurrency(agent.stakeSlashed)}</p>
                <p className="text-sm text-slate-400">Stake Slashed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tasks to Evaluate */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-100">Tasks Awaiting Evaluation</h2>
        {tasksToEvaluate.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {tasksToEvaluate.map((task) => (
              <Card key={task.id} className="border-amber-500/30">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                      Evaluating
                    </Badge>
                    <span className="text-xs text-slate-500">{task.taskClass}</span>
                  </div>
                  <CardTitle className="text-base mt-2 line-clamp-2">
                    {task.description}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Submissions</span>
                    <span className="font-medium text-slate-100">
                      {task.results.length} received
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Required Stake</span>
                    <span className="font-medium text-slate-100">
                      {formatCurrency(task.evaluatorStake)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Reward Pool</span>
                    <span className="font-medium text-slate-100">
                      {formatCurrency(task.evaluatorPool)}
                    </span>
                  </div>
                </CardContent>
                <CardContent className="pt-0">
                  <Link href={`/tasks/${task.id}`}>
                    <Button className="w-full bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30">
                      Start Evaluation
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <CheckCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-400">No tasks awaiting evaluation</p>
            <p className="text-sm text-slate-500 mt-1">Check back later for new evaluation opportunities</p>
          </Card>
        )}
      </div>

      {/* My Evaluation History */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-100">Evaluation History</h2>
        {myEvaluations.length > 0 ? (
          <div className="space-y-3">
            {myEvaluations.map((task) => {
              const myEvaluations = task.evaluations.filter(e => e.evaluatorId === CURRENT_AGENT_ID);
              return (
                <Card key={task.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className={getStatusColor(task.status)}>
                            {task.status}
                          </Badge>
                          <span className="text-sm text-slate-500">{task.taskClass}</span>
                        </div>
                        <p className="text-sm font-medium text-slate-100 line-clamp-1">
                          {task.description}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm text-slate-100">
                          {myEvaluations.length} evaluations
                        </p>
                        <Link href={`/tasks/${task.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                    
                    {myEvaluations.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-800">
                        <div className="space-y-2">
                          {myEvaluations.map((evaluation) => (
                            <div key={evaluation.id} className="flex items-center justify-between text-sm">
                              <span className="text-slate-400">
                                {getAgentById(evaluation.workerId)?.name || evaluation.workerId}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className={getScoreColor(evaluation.score)}>
                                  {evaluation.score}/100
                                </span>
                                <span className="text-xs text-slate-500">
                                  ({evaluation.confidence}% confidence)
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-slate-400">You haven&apos;t evaluated any tasks yet</p>
          </Card>
        )}
      </div>
    </div>
  );
}