import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';
import { SubmissionStatus } from '@internos/types';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import {
  ArrowLeft,
  MessageSquare,
  AlertTriangle,
  ExternalLink,
  Paperclip,
  Star,
  ArrowRight,
} from 'lucide-react';

export const StudentSubmissionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [sub, setSub] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const res = await apiClient.get<any>(`/api/v1/student/submissions/${id}`);
        if (res.success && res.data) {
          setSub(res.data);
        } else {
          setError(res.error?.message || 'Submission not found');
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to connect to submission service');
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

  if (error || !sub) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
        <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
        <h3 className="font-bold text-slate-800">Submission Record Not Found</h3>
        <p className="text-xs text-slate-500">{error || 'Unable to locate this submission.'}</p>
        <Link to="/app/student/submissions">
          <Button variant="secondary" size="sm">Back to Submissions</Button>
        </Link>
      </div>
    );
  }

  const isAccepted = sub.status === SubmissionStatus.ACCEPTED;
  const isRevision = sub.status === SubmissionStatus.REVISION_NEEDED;

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      <div>
        <Link
          to="/app/student/submissions"
          className="text-xs font-semibold text-slate-500 hover:text-indigo-600 inline-flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Submissions Ledger</span>
        </Link>
      </div>

      <Card className="rounded-2xl border border-slate-200 p-6 bg-white space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge
                variant={isAccepted ? 'emerald' : isRevision ? 'rose' : 'indigo'}
                size="sm"
              >
                {sub.status}
              </Badge>
              <span className="text-xs text-slate-400 font-mono">ID: {sub.id}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {sub.title}
            </h1>
            <p className="text-xs text-slate-500">
              Task: <span className="font-semibold text-slate-700">{sub.taskTitle}</span> • Milestone: {sub.milestoneTitle}
            </p>
          </div>

          <div className="text-xs text-slate-500 font-mono bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <span className="block text-[10px] uppercase text-slate-400">Timestamp</span>
            <span>{sub.submittedAt}</span>
          </div>
        </div>

        {/* Submitted Proof / Actual Evidence */}
        <div className="space-y-3 pt-4 border-t border-slate-100 text-xs">
          <h4 className="font-bold text-slate-900 uppercase tracking-wider text-slate-400 text-xs">
            Actual Evidence Submitted
          </h4>

          {sub.evidenceUrl && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <span className="font-medium text-slate-700">Verifiable URL:</span>
              <a
                href={sub.evidenceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 hover:underline flex items-center gap-1 font-mono"
              >
                <span>{sub.evidenceUrl}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {sub.attachmentName && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2 text-slate-700 font-medium">
              <Paperclip className="w-4 h-4 text-slate-400" />
              <span>Attachment: {sub.attachmentName}</span>
            </div>
          )}

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1">
            <span className="font-bold text-slate-800 block">Work Summary:</span>
            <p className="text-slate-700 leading-relaxed whitespace-pre-line">{sub.description}</p>
          </div>
        </div>

        {/* Mentor Review Section */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <h4 className="font-bold text-slate-900 uppercase tracking-wider text-slate-400 text-xs">
            Mentor Evaluation & Feedback
          </h4>

          {sub.mentorFeedback ? (
            <div
              className={`p-5 rounded-2xl border text-xs space-y-3 ${
                isRevision
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Mentor Review Decision: {sub.status}
                </span>
                {sub.mentorRating && (
                  <span className="flex items-center gap-1 font-bold text-xs bg-white/80 px-2 py-1 rounded-lg border border-black/5">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    Rating: {sub.mentorRating} / 5
                  </span>
                )}
              </div>

              <p className="text-xs leading-relaxed">{sub.mentorFeedback}</p>

              {sub.mentorStrengths && (
                <div>
                  <span className="font-bold block text-[11px]">Identified Strengths:</span>
                  <p className="text-[11px] opacity-90">{sub.mentorStrengths}</p>
                </div>
              )}

              {sub.mentorImprovements && (
                <div>
                  <span className="font-bold block text-[11px]">Required Improvements:</span>
                  <p className="text-[11px] opacity-90">{sub.mentorImprovements}</p>
                </div>
              )}

              {sub.mentorNextAction && (
                <div className="pt-2 border-t border-black/10">
                  <span className="font-bold block text-[11px]">Recommended Next Action:</span>
                  <p className="text-[11px]">{sub.mentorNextAction}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 italic">
              Awaiting review from your company mentor.
            </div>
          )}
        </div>

        {/* Revision Action */}
        {isRevision && (
          <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-xs text-rose-900">Mentor Requested Revisions</h4>
              <p className="text-xs text-rose-700">Update your code or documentation to resolve the feedback above and resubmit.</p>
            </div>
            <Link to={`/app/student/tasks/${sub.taskId}`}>
              <Button variant="primary" size="sm" className="whitespace-nowrap gap-1.5 text-xs">
                <span>Resubmit Evidence</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
};

export default StudentSubmissionDetailPage;
