import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';
import { MilestoneDto, TaskStatus } from '@internos/types';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { ArrowLeft, Clock, AlertCircle, ArrowRight, Target, FileCheck } from 'lucide-react';

export const StudentMilestoneDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [milestone, setMilestone] = useState<MilestoneDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const res = await apiClient.get<MilestoneDto>(`/api/v1/student/milestones/${id}`);
        if (res.success && res.data) {
          setMilestone(res.data);
        } else {
          setError(res.error?.message || 'Milestone not found');
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to load milestone');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton count={3} />
      </div>
    );
  }

  if (error || !milestone) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <h3 className="font-bold text-slate-800">Milestone Not Found</h3>
        <p className="text-xs text-slate-500">{error || 'This milestone could not be located.'}</p>
        <Link to="/app/student/milestones">
          <Button variant="secondary" size="sm">Back to Milestones</Button>
        </Link>
      </div>
    );
  }

  const tasks = milestone.tasks || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Back Button */}
      <div>
        <Link
          to="/app/student/milestones"
          className="text-xs font-semibold text-slate-500 hover:text-indigo-600 inline-flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Milestones</span>
        </Link>
      </div>

      {/* Milestone Overview Banner */}
      <Card className="rounded-2xl border border-slate-200 p-6 bg-white space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                STAGE {milestone.order}
              </span>
              <Badge variant={milestone.status === 'COMPLETED' ? 'emerald' : 'indigo'} size="sm">
                {milestone.status}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {milestone.title}
            </h1>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              {milestone.description}
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs min-w-[180px] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Progress</span>
              <span className="font-bold text-slate-900 font-mono">{milestone.progress}%</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all"
                style={{ width: `${milestone.progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>Due Date:</span>
              <span className="font-mono text-slate-700 font-semibold">{milestone.dueDate}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Tasks in this Milestone */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Tasks in this Milestone ({tasks.length})
            </h2>
            <p className="text-xs text-slate-500">Actionable items you must complete and submit evidence for</p>
          </div>
        </div>

        {tasks.length === 0 ? (
          <Card className="p-8 text-center bg-white rounded-2xl border border-slate-200">
            <p className="text-xs text-slate-400">No tasks currently assigned to this milestone.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {tasks.map((task: any) => {
              const isApproved = task.status === TaskStatus.APPROVED;
              const isSubmitted = task.status === TaskStatus.SUBMITTED;
              const isChanges = task.status === TaskStatus.CHANGES_REQUESTED;

              return (
                <Card
                  key={task.id}
                  className="rounded-2xl border border-slate-200 hover:border-indigo-300 p-5 bg-white transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2.5">
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
                          task.priority === 'HIGH' || task.priority === 'URGENT'
                            ? 'rose'
                            : 'amber'
                        }
                        size="sm"
                      >
                        {task.priority}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                      {task.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Due: {task.dueDate}
                      </span>
                      {task.learningOutcomeCode && (
                        <span className="flex items-center gap-1 text-indigo-600 font-medium">
                          <Target className="w-3.5 h-3.5" />
                          {task.learningOutcomeCode}: {task.learningOutcomeName}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isSubmitted ? (
                      <Link to={`/app/student/tasks/${task.id}`}>
                        <Button variant="primary" size="sm" className="whitespace-nowrap gap-1 text-xs">
                          <span>View Submission</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    ) : (
                      <>
                        <Link to={`/app/student/tasks/${task.id}/submit`}>
                          <Button variant="primary" size="sm" className="whitespace-nowrap gap-1 text-xs">
                            <FileCheck className="w-3.5 h-3.5" />
                            <span>Submit Evidence</span>
                          </Button>
                        </Link>
                        <Link to={`/app/student/tasks/${task.id}`}>
                          <Button variant="secondary" size="sm" className="whitespace-nowrap text-xs">
                            <span>Details</span>
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentMilestoneDetailPage;
