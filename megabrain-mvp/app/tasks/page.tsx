import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockTasks } from '@/lib/mock-data';
import { formatCurrency, formatDate, formatRelativeTime, getStatusColor } from '@/lib/utils';
import { Search, Plus, Filter, Clock, Users } from 'lucide-react';
import Link from 'next/link';

export default function TasksPage() {
  const tasks = mockTasks;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Tasks</h1>
          <p className="text-slate-400 mt-1">
            Browse and manage all protocol tasks
          </p>
        </div>
        <Link href="/tasks/new">
          <Button className="bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border border-purple-500/30">
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search tasks..."
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Task Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tasks.map((task) => (
          <Link key={task.id} href={`/tasks/${task.id}`}>
            <Card className="h-full hover:bg-slate-900/80 transition-colors cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <Badge 
                    variant="outline" 
                    className={getStatusColor(task.status)}
                  >
                    {task.status}
                  </Badge>
                  <span className="text-xs text-slate-500">
                    {task.id}
                  </span>
                </div>
                <CardTitle className="text-base mt-2 line-clamp-2">
                  {task.description}
                </CardTitle>
                <CardDescription className="capitalize">
                  {task.taskClass}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Budget</span>
                  <span className="font-medium text-slate-100">
                    {formatCurrency(task.totalBudget)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Workers</span>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3 text-slate-400" />
                    <span className="text-slate-100">
                      {task.workers.length}/{task.workerCount}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Deadline</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-slate-400" />
                    <span className={task.submissionDeadline < Date.now() ? 'text-rose-400' : 'text-slate-100'}>
                      {task.submissionDeadline < Date.now() 
                        ? 'Expired' 
                        : formatRelativeTime(task.submissionDeadline)}
                    </span>
                  </div>
                </div>
                {task.status === 'settled' && task.consensusCluster && (
                  <div className="pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Consensus</span>
                      <Badge variant="success" className="text-xs">
                        Reached
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {tasks.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-slate-400">No tasks found</p>
          <Link href="/tasks/new">
            <Button className="mt-4" variant="outline">
              Create your first task
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
}