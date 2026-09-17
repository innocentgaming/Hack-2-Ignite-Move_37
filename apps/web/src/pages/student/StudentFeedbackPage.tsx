import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import {
  MessageSquare,
  Star,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  TrendingUp,
  RotateCcw,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface StudentFeedbackItem {
  id: string;
  submissionId: string;
  taskTitle: string;
  submissionTitle: string;
  feedback: string;
  rating?: number;
  strengths?: string;
  improvements?: string;
  nextAction?: string;
  status: string;
  date: string;
}

export const StudentFeedbackPage: React.FC = () => {
  const [feedbackList, setFeedbackList] = useState<StudentFeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get<StudentFeedbackItem[]>('/api/v1/student/feedback');
      if (res.success && res.data) {
        setFeedbackList(res.data);
      } else {
        setError(res.error?.message || 'Failed to load feedback');
      }
    } catch (err: any) {
      setError(err?.message || 'Error connecting to feedback service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
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
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mentor Feedback & Reviews</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Actionable evaluations, strengths, and improvement suggestions provided by your industry mentor.
        </p>
      </div>

      {error ? (
        <Card className="p-6 text-center border-rose-200 bg-rose-50/50">
          <p className="text-sm text-rose-700 font-medium">{error}</p>
          <Button variant="secondary" className="mt-4" onClick={fetchFeedback}>
            Retry
          </Button>
        </Card>
      ) : feedbackList.length === 0 ? (
        <Card className="p-12 text-center text-slate-500">
          <MessageSquare className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-base font-semibold text-slate-700">No Feedback Yet</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Once your mentor reviews your submitted task evidence, detailed feedback and action points will appear here.
          </p>
          <Link to="/app/student/tasks">
            <Button variant="primary" className="mt-4">
              View My Tasks
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {feedbackList.map((item) => (
            <Card key={item.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-slate-900">{item.submissionTitle}</h3>
                    <Badge
                      variant={
                        item.status === 'ACCEPTED'
                          ? 'success'
                          : item.status === 'REVISION_NEEDED'
                          ? 'warning'
                          : 'default'
                      }
                    >
                      {item.status === 'ACCEPTED' ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Accepted
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <RotateCcw className="w-3 h-3" /> Revision Requested
                        </span>
                      )}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Task: <span className="font-medium text-slate-700">{item.taskTitle}</span> • Reviewed on {item.date}
                  </p>
                </div>

                {item.rating && (
                  <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                    <span className="text-xs font-semibold text-amber-900 mr-1">Rating:</span>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < item.rating!
                            ? 'text-amber-500 fill-amber-400'
                            : 'text-slate-200 fill-slate-100'
                        }`}
                      />
                    ))}
                    <span className="text-xs font-bold text-amber-800 ml-1.5">{item.rating}/5</span>
                  </div>
                )}
              </div>

              {/* Main Review Note */}
              <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Mentor Evaluation Note
                </span>
                <p className="text-sm text-slate-800 leading-relaxed font-normal">{item.feedback}</p>
              </div>

              {/* Strengths & Improvements Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {item.strengths && (
                  <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/70 rounded-xl">
                    <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      Key Strengths Identified
                    </div>
                    <p className="text-xs text-emerald-950 leading-relaxed">{item.strengths}</p>
                  </div>
                )}

                {item.improvements && (
                  <div className="p-3.5 bg-amber-50/60 border border-amber-200/70 rounded-xl">
                    <div className="flex items-center gap-2 text-amber-800 text-xs font-bold mb-1">
                      <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                      Areas for Growth & Refinement
                    </div>
                    <p className="text-xs text-amber-950 leading-relaxed">{item.improvements}</p>
                  </div>
                )}
              </div>

              {/* Next Action */}
              {item.nextAction && (
                <div className="mt-4 p-3 bg-indigo-50/60 border border-indigo-200/70 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-indigo-900">Recommended Next Step: </span>
                      <span className="text-xs text-indigo-800">{item.nextAction}</span>
                    </div>
                  </div>
                  <Link to={`/app/student/submissions/${item.submissionId}`}>
                    <Button variant="outline" size="sm" className="bg-white hover:bg-indigo-50 border-indigo-200 text-indigo-700">
                      View Submission
                    </Button>
                  </Link>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
