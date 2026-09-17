import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';
import { MilestoneDto } from '@internos/types';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { Clock, ArrowRight, AlertCircle } from 'lucide-react';

export const StudentMilestonesPage: React.FC = () => {
  const [milestones, setMilestones] = useState<MilestoneDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMilestones = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get<MilestoneDto[]>('/api/v1/student/milestones');
      if (res.success && res.data) {
        setMilestones(res.data);
      } else {
        setError(res.error?.message || 'Failed to load milestones');
      }
    } catch (err: any) {
      setError(err?.message || 'Error connecting to milestone service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMilestones();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-slate-200 rounded-lg animate-pulse" />
        <LoadingSkeleton count={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 space-y-2">
        <div className="flex items-center gap-2 font-bold text-sm">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>Error loading milestones</span>
        </div>
        <p className="text-xs">{error}</p>
        <Button variant="secondary" size="sm" onClick={fetchMilestones}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Internship Milestones
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Milestones are the structural containers of your internship program. Click into any milestone to view and submit evidence for its actionable tasks.
        </p>
      </div>

      {milestones.length === 0 ? (
        <Card className="p-8 text-center bg-white rounded-2xl border border-slate-200">
          <p className="text-sm text-slate-500">No milestones defined yet. Your company mentor will configure your milestone curriculum.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {milestones.map((m) => {
            const isCompleted = m.status === 'COMPLETED' || m.progress === 100;
            const isInProgress = m.status === 'IN_PROGRESS';

            return (
              <Card
                key={m.id}
                className="rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all bg-white p-6 flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold font-mono tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      STAGE {m.order}
                    </span>
                    <Badge
                      variant={isCompleted ? 'emerald' : isInProgress ? 'indigo' : 'slate'}
                      size="sm"
                    >
                      {m.status}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {m.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {m.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100 text-xs">
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-1.5">
                      <span>Progress</span>
                      <span className="font-mono">{m.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted ? 'bg-emerald-500' : isInProgress ? 'bg-indigo-600' : 'bg-slate-300'
                        }`}
                        style={{ width: `${m.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700">
                      {m.completedTasks} / {m.totalTasks} tasks completed
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {m.dueDate}
                    </span>
                  </div>

                  <Link to={`/app/student/milestones/${m.id}`}>
                    <Button variant="secondary" size="sm" className="w-full justify-center gap-1.5">
                      <span>Open Milestone Tasks</span>
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

export default StudentMilestonesPage;
