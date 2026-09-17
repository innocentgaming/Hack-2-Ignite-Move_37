import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';
import { TaskItemDto, TaskStatus } from '@internos/types';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { Clock, ArrowRight, Target, GitBranch } from 'lucide-react';

export const StudentTasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<TaskItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'TO_DO' | 'SUBMITTED' | 'NEEDS_REVISION' | 'COMPLETED' | 'OVERDUE'>('ALL');

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get<TaskItemDto[]>(`/api/v1/student/tasks?status=${statusFilter}`);
      if (res.success && res.data) {
        setTasks(res.data);
      } else {
        setError(res.error?.message || 'Failed to load tasks');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to connect to task service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [statusFilter]);

  const filterTabs: Array<{ id: typeof statusFilter; label: string }> = [
    { id: 'ALL', label: 'All Tasks' },
    { id: 'TO_DO', label: 'To Do' },
    { id: 'SUBMITTED', label: 'Submitted' },
    { id: 'NEEDS_REVISION', label: 'Needs Revision' },
    { id: 'COMPLETED', label: 'Completed' },
    { id: 'OVERDUE', label: 'Overdue' },
  ];

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Assigned Tasks
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Actionable engineering tasks defined by your industry mentor. Click any task to review instructions and submit proof of work.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto select-none">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              statusFilter === tab.id
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Task List */}
      {loading ? (
        <LoadingSkeleton count={3} />
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs">
          {error}
        </div>
      ) : tasks.length === 0 ? (
        <Card className="p-8 text-center bg-white rounded-2xl border border-slate-200">
          <p className="text-xs text-slate-400">No tasks found matching the selected filter ({statusFilter}).</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const isApproved = task.status === TaskStatus.APPROVED;
            const isSubmitted = task.status === TaskStatus.SUBMITTED;
            const isChanges = task.status === TaskStatus.CHANGES_REQUESTED;

            return (
              <Card
                key={task.id}
                className="rounded-2xl border border-slate-200 hover:border-indigo-300 p-5 bg-white transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-900">{task.title}</h3>
                    <Badge
                      variant={
                        isApproved
                          ? 'emerald'
                          : isSubmitted
                          ? 'indigo'
                          : isChanges
                          ? 'rose'
                          : 'slate'
                      }
                      size="sm"
                    >
                      {task.status}
                    </Badge>
                    <Badge
                      variant={
                        task.priority === 'URGENT' || task.priority === 'HIGH'
                          ? 'rose'
                          : task.priority === 'MEDIUM'
                          ? 'amber'
                          : 'slate'
                      }
                      size="sm"
                    >
                      {task.priority}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
                    {task.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1">
                    {task.milestoneTitle && (
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <GitBranch className="w-3.5 h-3.5 text-slate-400" />
                        Milestone: {task.milestoneTitle}
                      </span>
                    )}
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Due: {task.dueDate}
                    </span>
                    {task.learningOutcomeCode && (
                      <>
                        <span>•</span>
                        <span className="text-indigo-600 font-medium flex items-center gap-1">
                          <Target className="w-3.5 h-3.5" />
                          {task.learningOutcomeCode}: {task.learningOutcomeName}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Link to={`/app/student/tasks/${task.id}`}>
                    <Button variant="primary" size="sm" className="whitespace-nowrap gap-1.5 text-xs">
                      <span>{isSubmitted ? 'View Submission' : 'Open Task'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentTasksPage;
