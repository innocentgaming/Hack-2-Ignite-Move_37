import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import {
  MessageSquare,
  Star,
  Sparkles,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';

interface MentorFeedbackRecord {
  id: string;
  submissionId?: string;
  studentName?: string;
  taskTitle?: string;
  submissionTitle?: string;
  feedback: string;
  rating?: number;
  strengths?: string;
  improvements?: string;
  nextAction?: string;
  status?: string;
  date?: string;
  createdAt?: string;
}

export const MentorFeedbackPage: React.FC = () => {
  const [feedbackList, setFeedbackList] = useState<MentorFeedbackRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get<MentorFeedbackRecord[]>('/api/v1/mentor/feedback');
      if (res.success && res.data) {
        setFeedbackList(res.data);
      } else {
        setError(res.error?.message || 'Failed to load feedback records');
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
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mentorship Feedback Ledger</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Chronological record of technical evaluations, guidance, and ratings delivered to interns.
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
          <p className="text-base font-semibold text-slate-700">No Feedback Recorded Yet</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            When you evaluate intern submissions in the Review Queue, your notes and growth recommendations will be archived here.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {feedbackList.map((item) => (
            <Card key={item.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {item.submissionTitle || item.taskTitle || 'Deliverable Review'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {item.studentName && <span className="font-semibold text-slate-800 mr-2">Intern: {item.studentName}</span>}
                    {item.taskTitle && <span>Task: {item.taskTitle}</span>}
                  </p>
                </div>

                {item.rating && (
                  <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl flex-shrink-0">
                    <span className="text-xs font-semibold text-amber-900 mr-1">Rating:</span>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
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

              {/* Feedback text */}
              <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Evaluation Review Note
                </span>
                <p className="text-xs text-slate-800 leading-relaxed">{item.feedback}</p>
              </div>

              {/* Strengths & Improvements */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                {item.strengths && (
                  <div className="p-3 bg-emerald-50/60 border border-emerald-200/70 rounded-xl text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-bold mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      Strengths Identified
                    </div>
                    <p className="text-emerald-950">{item.strengths}</p>
                  </div>
                )}

                {item.improvements && (
                  <div className="p-3 bg-amber-50/60 border border-amber-200/70 rounded-xl text-xs">
                    <div className="flex items-center gap-1.5 text-amber-800 font-bold mb-1">
                      <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                      Areas for Growth
                    </div>
                    <p className="text-amber-950">{item.improvements}</p>
                  </div>
                )}
              </div>

              {item.nextAction && (
                <div className="mt-3 p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-xs flex items-center gap-2">
                  <ArrowRight className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-indigo-900">Recommended Action: </span>
                    <span className="text-indigo-800">{item.nextAction}</span>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
