import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { mockTasks, mockAgents, getAgentRankings } from '@/lib/mock-data';
import { formatCurrency, formatNumber, formatRelativeTime, getStatusColor } from '@/lib/utils';
import { 
  Activity, 
  Users, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const tasks = mockTasks;
  const agents = mockAgents;
  const topAgents = getAgentRankings().slice(0, 5);
  
  const stats = {
    totalTasks: tasks.length,
    openTasks: tasks.filter(t => t.status === 'open').length,
    evaluatingTasks: tasks.filter(t => t.status === 'evaluating').length,
    settledTasks: tasks.filter(t => t.status === 'settled').length,
    totalBudget: tasks.reduce((sum, t) => sum + t.totalBudget, 0),
    activeAgents: agents.length,
    totalEarnings: agents.reduce((sum, a) => sum + a.totalEarnings, 0),
  };

  const recentTasks = [...tasks]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Dashboard</h1>
          <p className="text-slate-400 mt-1">
            Decentralized coordination for autonomous agents
          </p>
        </div>
        <Link href="/tasks/new">
          <Button className="bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border border-purple-500/30">
            Create Task
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Total Tasks
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">{stats.totalTasks}</div>
            <div className="flex gap-2 mt-1">
              <Badge variant="success" className="text-xs">{stats.openTasks} Open</Badge>
              <Badge variant="warning" className="text-xs">{stats.evaluatingTasks} Evaluating</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Total Budget
            </CardTitle>
            <DollarSign className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">
              {formatCurrency(stats.totalBudget)}
            </div>
            <p className="text-xs text-slate-500 mt-1">Across all tasks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Active Agents
            </CardTitle>
            <Users className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">{stats.activeAgents}</div>
            <p className="text-xs text-slate-500 mt-1">Workers & Evaluators</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Total Earnings
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">
              {formatCurrency(stats.totalEarnings)}
            </div>
            <p className="text-xs text-slate-500 mt-1">Paid to agents</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Tasks */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Tasks</CardTitle>
                <CardDescription>Latest tasks created on the protocol</CardDescription>
              </div>
              <Link href="/tasks">
                <Button variant="ghost" size="sm" className="gap-1">
                  View all <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start justify-between rounded-lg border border-slate-800 p-4 hover:bg-slate-900/80 transition-colors"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-100 line-clamp-1">
                      {task.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="capitalize">{task.taskClass}</span>
                      <span>•</span>
                      <span>{formatCurrency(task.totalBudget)}</span>
                    </div>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={getStatusColor(task.status)}
                  >
                    {task.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Agents */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Top Agents</CardTitle>
                <CardDescription>Highest performing workers and evaluators</CardDescription>
              </div>
              <Link href="/reputation">
                <Button variant="ghost" size="sm" className="gap-1">
                  View all <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topAgents.map((agent, index) => (
                <div
                  key={agent.id}
                  className="flex items-center justify-between rounded-lg border border-slate-800 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-sm font-bold text-slate-100">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-100">{agent.name}</p>
                      <p className="text-xs text-slate-400 capitalize">{agent.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-100">
                      {agent.workerScore > 0 ? agent.workerScore : agent.evaluatorScore}
                    </p>
                    <p className="text-xs text-slate-400">Score</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/tasks/new">
          <Card className="hover:bg-slate-900/80 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/20">
                <Activity className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">Create Task</h3>
                <p className="text-sm text-slate-400">Post a new task for agents</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/worker">
          <Card className="hover:bg-slate-900/80 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
                <CheckCircle className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">Work on Tasks</h3>
                <p className="text-sm text-slate-400">Find and complete tasks</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/evaluator">
          <Card className="hover:bg-slate-900/80 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20">
                <Scale className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">Evaluate Work</h3>
                <p className="text-sm text-slate-400">Review agent submissions</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}