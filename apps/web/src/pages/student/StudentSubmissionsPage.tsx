import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';
import { SubmissionStatus } from '@internos/types';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import {
  FileCheck,
  Clock,
  ArrowRight,
  MessageSquare,
  ExternalLink,
  CheckSquare,
} from 'lucide-react';

export const StudentSubmissionsPage: React.FC = () => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get<any[]>('/api/v1/student/submissions');
      if (res.success && res.data) {
        setSubmissions(res.data);
      } else {
        setError(res.error?.message || 'Failed to load submissions');
      }
    } catch (err: any) {
      setError(err?.message || 'Error connecting to submission service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton count={3} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Submissions Ledger
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Record of all actual evidence submitted against your assigned tasks, along with mentor review statuses and revisions.
          </p>
        </div>
        <Link to="/app/student/tasks">
          <Button variant="primary" size="sm" className="gap-1.5 shadow-xs">
            <CheckSquare className="w-4 h-4" />
            <span>View Assigned Tasks</span>
          </Button>
        </Link>
      </div>

      {error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs">
          {error}
        </div>
      ) : submissions.length === 0 ? (
        <Card className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
          <FileCheck className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">No Submissions Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You haven't submitted any deliverables yet. Select an actionable task from your tasks list to submit your work.
          </p>
          <Link to="/app/student/tasks">
            <Button variant="secondary" size="sm">Open Assigned Tasks</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {submissions.map((sub) => {
            const isAccepted = sub.status === SubmissionStatus.ACCEPTED;
            const isRevisionNeeded = sub.status === SubmissionStatus.REVISION_NEEDED;

            return (
              <Card
                key={sub.id}
                className="rounded-2xl border border-slate-200 hover:border-indigo-300 p-5 bg-white transition-all space-y-4 shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-base text-slate-900">{sub.title}</h3>
                      <Badge
                        variant={
                          isAccepted
                            ? 'emerald'
                            : isRevisionNeeded
                            ? 'rose'
                            : 'indigo'
                        }
                        size="sm"
                      >
                        {sub.status}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-500">
                      Task:{' '}
                      <span className="font-semibold text-slate-700">{sub.taskTitle}</span>
                      {sub.milestoneTitle && (
                        <span>
                          {' '}
                          • Milestone:{' '}
                          <span className="font-medium text-slate-600">{sub.milestoneTitle}</span>
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Submitted: {sub.submittedAt}</span>
                  </div>
                </div>

                {/* Evidence Links */}
                {sub.evidenceUrl && (
                  <div className="text-xs flex items-center gap-2">
                    <span className="text-slate-400 font-semibold text-[11px] uppercase">
                      Evidence Proof:
                    </span>
                    <a
                      href={sub.evidenceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 hover:underline inline-flex items-center gap-1 font-mono text-[11px]"
                    >
                      <span className="truncate max-w-sm">{sub.evidenceUrl}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {/* Mentor Feedback Box */}
                {sub.mentorFeedback ? (
                  <div
                    className={`p-4 rounded-xl border text-xs space-y-1 ${
                      isRevisionNeeded
                        ? 'bg-rose-50 border-rose-200 text-rose-800'
                        : 'bg-emerald-50/60 border-emerald-200 text-emerald-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" />
                        Mentor Feedback:
                      </span>
                      {sub.reviewedAt && (
                        <span className="text-[10px] font-mono opacity-80">
                          Reviewed on {sub.reviewedAt}
                        </span>
                      )}
                    </div>
                    <p className="text-xs leading-relaxed mt-1">{sub.mentorFeedback}</p>
                    {sub.mentorNextAction && (
                      <p className="text-[11px] font-medium pt-1">
                        Next Action: {sub.mentorNextAction}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl text-xs text-slate-500 italic">
                    Pending review by industry mentor. You will see feedback and evaluation here once reviewed.
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-[11px] text-slate-400 font-mono">
                    ID: {sub.id}
                  </span>
                  <div className="flex items-center gap-2">
                    {isRevisionNeeded && (
                      <Link to={`/app/student/tasks/${sub.taskId}/submit?resubmit=true`}>
                        <Button variant="primary" size="sm" className="text-xs gap-1.5 bg-rose-600 hover:bg-rose-700 border-rose-600">
                          <span>Submit Revision</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    )}
                    <Link to={`/app/student/submissions/${sub.id}`}>
                      <Button variant="secondary" size="sm" className="text-xs">
                        View Submission Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentSubmissionsPage;
