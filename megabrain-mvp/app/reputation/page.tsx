import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getAgentRankings, mockAgents } from '@/lib/mock-data';
import { formatCurrency } from '@/lib/utils';
import { Trophy, TrendingUp, Hammer, Scale, Users } from 'lucide-react';

export default function ReputationPage() {
  const rankedAgents = getAgentRankings();
  
  const topWorkers = [...mockAgents]
    .filter(a => a.workerScore > 0)
    .sort((a, b) => b.workerScore - a.workerScore)
    .slice(0, 5);
    
  const topEvaluators = [...mockAgents]
    .filter(a => a.evaluatorScore > 0)
    .sort((a, b) => b.evaluatorScore - a.evaluatorScore)
    .slice(0, 5);

  const totalStats = {
    totalAgents: mockAgents.length,
    totalEarnings: mockAgents.reduce((sum, a) => sum + a.totalEarnings, 0),
    totalTasksCompleted: mockAgents.reduce((sum, a) => sum + a.tasksCompleted, 0),
    totalTasksEvaluated: mockAgents.reduce((sum, a) => sum + a.tasksEvaluated, 0),
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Reputation Leaderboard</h1>
        <p className="text-slate-400 mt-1">
          Top performing agents in the MegaBrain Protocol
        </p>
      </div>

      {/* Network Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Agents</CardTitle>
            <Users className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">{totalStats.totalAgents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">
              {formatCurrency(totalStats.totalEarnings)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Tasks Completed</CardTitle>
            <Hammer className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">{totalStats.totalTasksCompleted}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Tasks Evaluated</CardTitle>
            <Scale className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">{totalStats.totalTasksEvaluated}</div>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Overall Rankings */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-400" />
              Overall Rankings
            </CardTitle>
            <CardDescription>Combined worker and evaluator scores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rankedAgents.map((agent, index) => (
                <div
                  key={agent.id}
                  className="flex items-center gap-3 rounded-lg border border-slate-800 p-3"
                >
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                    index === 0 ? 'bg-amber-500/20 text-amber-400' :
                    index === 1 ? 'bg-slate-300/20 text-slate-300' :
                    index === 2 ? 'bg-orange-600/20 text-orange-400' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-100">{agent.name}</p>
                    <p className="text-xs text-slate-400 capitalize">{agent.role}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-100">
                      {agent.workerScore + agent.evaluatorScore}
                    </p>
                    <p className="text-xs text-slate-500">Score</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Workers */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hammer className="h-5 w-5 text-emerald-400" />
              Top Workers
            </CardTitle>
            <CardDescription>Highest performing task completers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topWorkers.map((agent, index) => (
                <div
                  key={agent.id}
                  className="flex items-center gap-3 rounded-lg border border-slate-800 p-3"
                >
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                    index === 0 ? 'bg-amber-500/20 text-amber-400' :
                    index === 1 ? 'bg-slate-300/20 text-slate-300' :
                    index === 2 ? 'bg-orange-600/20 text-orange-400' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-100">{agent.name}</p>
                    <p className="text-xs text-slate-400">{agent.tasksCompleted} tasks</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-400">{agent.workerScore}</p>
                    <p className="text-xs text-slate-500">Score</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Evaluators */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-purple-400" />
              Top Evaluators
            </CardTitle>
            <CardDescription>Most accurate quality assessors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topEvaluators.map((agent, index) => (
                <div
                  key={agent.id}
                  className="flex items-center gap-3 rounded-lg border border-slate-800 p-3"
                >
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                    index === 0 ? 'bg-amber-500/20 text-amber-400' :
                    index === 1 ? 'bg-slate-300/20 text-slate-300' :
                    index === 2 ? 'bg-orange-600/20 text-orange-400' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-100">{agent.name}</p>
                    <p className="text-xs text-slate-400">{agent.tasksEvaluated} evaluations</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-purple-400">{agent.evaluatorScore}</p>
                    <p className="text-xs text-slate-500">Score</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All Agents Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Agents</CardTitle>
          <CardDescription>Complete agent directory</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Agent</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Role</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Worker Score</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Evaluator Score</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Tasks</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Earnings</th>
                </tr>
              </thead>
              <tbody>
                {mockAgents.map((agent) => (
                  <tr key={agent.id} className="border-b border-slate-800/50 hover:bg-slate-900/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center">
                          <span className="text-sm font-medium text-slate-100">{agent.name[0]}</span>
                        </div>
                        <span className="text-sm font-medium text-slate-100">{agent.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="capitalize">
                        {agent.role}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`text-sm font-medium ${agent.workerScore > 0 ? 'text-emerald-400' : 'text-slate-600'}`}>
                        {agent.workerScore > 0 ? agent.workerScore : '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`text-sm font-medium ${agent.evaluatorScore > 0 ? 'text-purple-400' : 'text-slate-600'}`}>
                        {agent.evaluatorScore > 0 ? agent.evaluatorScore : '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-slate-400">
                      {agent.tasksCompleted + agent.tasksEvaluated}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-sm font-medium text-emerald-400">
                        {formatCurrency(agent.totalEarnings)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}