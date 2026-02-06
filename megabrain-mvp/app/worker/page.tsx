import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { mockTasks, getAvailableTasksForWorker, getTasksForWorker, getAgentById } from '@/lib/mock-data';
import { formatCurrency, formatRelativeTime, getStatusColor } from '@/lib/utils';
import { Hammer, Clock, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

// Simulating current user as agent-1 (AlphaWorker)
const CURRENT_AGENT_ID = 'agent-1';

export default function WorkerPage() {
  const availableTasks = getAvailableTasksForWorker(CURRENT_AGENT_ID);
  const myTasks = getTasksForWorker(CURRENT_AGENT_ID);
  const agent = getAgentById(CURRENT_AGENT_ID);

  const stats = {
    availableTasks: availableTasks.length,
    activeTasks: myTasks.filter(t => t.status === 'open' || t.status === 'evaluating').length,
    completedTasks: myTasks.filter(t => t.status === 'settled').length,
    totalEarnings: agent?.totalEarnings || 0,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Worker Dashboard</h1>
        <p className="text-slate-400 mt-1">
          Find tasks, submit work, and track your earnings
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Available Tasks</CardTitle>
            <Hammer className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">{stats.availableTasks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Active Tasks</CardTitle>
            <Clock className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">{stats.activeTasks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">{stats.completedTasks}</div>
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
            <CardDescription>Your worker statistics and reputation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-400">{agent.workerScore}</p>
                <p className="text-sm text-slate-400">Worker Score</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-slate-100">{agent.tasksCompleted}</p>
                <p className="text-sm text-slate-400">Tasks Completed</p>
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

      {/* Available Tasks */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-100">Available Tasks</h2>
        {availableTasks.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availableTasks.map((task) => (
              <Card key={task.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Badge variant="outline" className={getStatusColor(task.status)}>
                      {task.status}
                    </Badge>
                    <span className="text-xs text-slate-500">{task.taskClass}</span>
                  </div>
                  <CardTitle className="text-base mt-2 line-clamp-2">
                    {task.description}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Budget</span>
                      <span className="font-medium text-slate-100">
                        {formatCurrency(task.totalBudget)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Required Stake</span>
                      <span className="font-medium text-slate-100">
                        {formatCurrency(task.workerStake)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Deadline</span>
                      <span className="font-medium text-slate-100">
                        {formatRelativeTime(task.submissionDeadline)}
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link href={`/tasks/${task.id}`} className="w-full">
                    <Button className="w-full" variant="outline">
                      View Details
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-400">No available tasks right now</p>
            <p className="text-sm text-slate-500 mt-1">Check back later for new opportunities</p>
          </Card>
        )}
      </div>

      {/* My Tasks */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-100">My Tasks</h2>
        {myTasks.length > 0 ? (
          <div className="space-y-3">
            {myTasks.map((task) => {
              const myResult = task.results.find(r => r.workerId === CURRENT_AGENT_ID);
              return (
                <Card key={task.id}>
                  <CardContent className="flex items-center justify-between p-4">
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
                    <div className="flex items-center gap-4">
                      {myResult ? (
                        <div className="text-right">
                          <p className={`font-bold ${myResult.score ? (myResult.score >= 70 ? 'text-emerald-400' : 'text-amber-400') : 'text-slate-400'}`}>
                            {myResult.score ? `${myResult.score}/100` : 'Submitted'}
                          </p>
                          {myResult.payment !== undefined && myResult.payment > 0 && (
                            <p className="text-xs text-emerald-400">
                              +{formatCurrency(myResult.payment)}
                            </p>
                          )}
                        </div>
                      ) : task.status === 'open' ? (
                        <Button size="sm" className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30">
                          Submit Work
                        </Button>
                      ) : null}
                      <Link href={`/tasks/${task.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-slate-400">You haven&apos;t joined any tasks yet</p>
          </Card>
        )}
      </div>
    </div>
  );
}