import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';
import { SubmissionStatus } from '@internos/types';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import {
  FileCheck,
  Star,
  ExternalLink,
  CheckCircle2,
  RotateCcw,
  Calendar,
  Search,
} from 'lucide-react';

interface MentorSubmissionItem {
  id: string;
  taskId: string;
  taskTitle: string;
  milestoneTitle: string;
  studentId: string;
  studentName: string;
  studentEmail?: string;
  title: string;
  description: string;
  evidenceType: string;
  evidenceUrl?: string;
  evidenceUrls?: string[];
  attachmentName?: string;
  status: SubmissionStatus;
  submittedAt: string;
  mentorFeedback?: string;
  mentorRating?: number;
  mentorStrengths?: string;
  mentorImprovements?: string;
  mentorNextAction?: string;
  reviewedAt?: string;
}

export const MentorSubmissionsPage: React.FC = () => {
  const [submissions, setSubmissions] = useState<MentorSubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Review modal state
  const [selectedSub, setSelectedSub] = useState<MentorSubmissionItem | null>(null);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get<MentorSubmissionItem[]>('/api/v1/mentor/submissions');
      if (res.success && res.data) {
        setSubmissions(res.data);
      } else {
        setError(res.error?.message || 'Failed to load submissions queue');
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

  const openReviewModal = (sub: MentorSubmissionItem) => {
    setSelectedSub(sub);
    setRating(sub.mentorRating || 5);
    setFeedback(sub.mentorFeedback || '');
    setStrengths(sub.mentorStrengths || '');
    setImprovements(sub.mentorImprovements || '');
    setNextAction(sub.mentorNextAction || '');
  };

  const handleReviewSubmit = async (decision: 'ACCEPTED' | 'NEEDS_REVISION') => {
    if (!selectedSub) return;
    if (!feedback.trim()) {
      alert('Please provide evaluation feedback for the intern.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await apiClient.post(`/api/v1/mentor/submissions/${selectedSub.id}/review`, {
        status: decision,
        feedback: feedback.trim(),
        score: rating,
        rating: rating,
        strengths: strengths.trim(),
        improvements: improvements.trim(),
        nextAction: nextAction.trim(),
      });

      if (res.success) {
        setSelectedSub(null);
        await fetchSubmissions();
      } else {
        alert(res.error?.message || 'Failed to submit review');
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton count={3} />
      </div>
    );
  }

  const filteredSubmissions = submissions.filter((s) => {
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'SUBMITTED' && s.status === SubmissionStatus.SUBMITTED) ||
      (statusFilter === 'ACCEPTED' && s.status === SubmissionStatus.ACCEPTED) ||
      (statusFilter === 'REVISION_NEEDED' && s.status === SubmissionStatus.REVISION_NEEDED);

    const matchesSearch =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.taskTitle.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Submission Review Queue</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Inspect actual evidence artifacts submitted by interns, assess quality, and approve deliverables.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'SUBMITTED', 'ACCEPTED', 'REVISION_NEEDED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {st === 'SUBMITTED'
                ? 'Pending Review'
                : st === 'REVISION_NEEDED'
                ? 'Revisions Requested'
                : st === 'ACCEPTED'
                ? 'Accepted'
                : 'All Submissions'}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student or task..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
      </div>

      {error ? (
        <Card className="p-6 text-center border-rose-200 bg-rose-50/50">
          <p className="text-sm text-rose-700 font-medium">{error}</p>
          <Button variant="secondary" className="mt-4" onClick={fetchSubmissions}>
            Retry
          </Button>
        </Card>
      ) : filteredSubmissions.length === 0 ? (
        <Card className="p-12 text-center text-slate-500">
          <FileCheck className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-base font-semibold text-slate-700">No Submissions Found</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            When interns submit deliverables with verification links, they will be queued here for your assessment.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSubmissions.map((sub) => (
            <Card key={sub.id} className="p-5 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-900">{sub.title}</h3>
                    <Badge
                      variant={
                        sub.status === SubmissionStatus.ACCEPTED
                          ? 'success'
                          : sub.status === SubmissionStatus.SUBMITTED
                          ? 'warning'
                          : sub.status === SubmissionStatus.REVISION_NEEDED
                          ? 'destructive'
                          : 'default'
                      }
                    >
                      {sub.status === SubmissionStatus.SUBMITTED ? 'PENDING REVIEW' : sub.status}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] py-0">
                      {sub.evidenceType}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-500">
                    Intern: <span className="font-semibold text-slate-800">{sub.studentName}</span> • Task: <span className="font-semibold text-slate-700">{sub.taskTitle}</span>
                  </p>

                  <p className="text-xs text-slate-600 mt-2 line-clamp-2">{sub.description}</p>

                  {/* Evidence Artifact Links */}
                  <div className="flex items-center gap-3 pt-2 flex-wrap text-xs">
                    {sub.evidenceUrl && (
                      <a
                        href={sub.evidenceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 font-semibold flex items-center gap-1 hover:underline bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Open Submitted Evidence
                      </a>
                    )}
                    {sub.attachmentName && (
                      <span className="text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                        📎 {sub.attachmentName}
                      </span>
                    )}
                  </div>

                  {/* Previous Mentor Feedback Note */}
                  {sub.mentorFeedback && (
                    <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-700 font-bold">
                        <span>Mentor Assessment</span>
                        {sub.mentorRating && <span>{sub.mentorRating}/5 Stars</span>}
                      </div>
                      <p className="text-slate-800">{sub.mentorFeedback}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-1 text-[11px] text-slate-400 pt-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Submitted on {sub.submittedAt}</span>
                  </div>
                </div>

                <div className="flex-shrink-0 flex items-center md:flex-col gap-2">
                  <Button
                    variant={sub.status === SubmissionStatus.SUBMITTED ? 'primary' : 'outline'}
                    size="sm"
                    className="text-xs gap-1.5 shadow-sm"
                    onClick={() => openReviewModal(sub)}
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    {sub.status === SubmissionStatus.SUBMITTED ? 'Evaluate & Grade' : 'Update Review'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* REVIEW MODAL */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Evaluate Deliverable Evidence</h3>
                <p className="text-xs text-slate-500">
                  {selectedSub.studentName} — {selectedSub.title}
                </p>
              </div>
              <button
                onClick={() => setSelectedSub(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {selectedSub.evidenceUrl && (
              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-600">Verification Artifact:</span>
                <a
                  href={selectedSub.evidenceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 font-semibold flex items-center gap-1 hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open Evidence Link
                </a>
              </div>
            )}

            {/* Quality Rating */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Quality Rating (1 to 5 Stars): {rating}/5
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 text-amber-400 focus:outline-none"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating ? 'fill-amber-400 text-amber-500' : 'text-slate-200 fill-slate-100'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Feedback textarea */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Evaluation Notes & Feedback *
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Assess correctness, implementation cleanliness, and conformance with criteria..."
                rows={3}
                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Strengths Identified</label>
                <input
                  type="text"
                  value={strengths}
                  onChange={(e) => setStrengths(e.target.value)}
                  placeholder="e.g. Robust error handling"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Areas for Improvement</label>
                <input
                  type="text"
                  value={improvements}
                  onChange={(e) => setImprovements(e.target.value)}
                  placeholder="e.g. Increase test coverage"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Recommended Next Action</label>
              <input
                type="text"
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
                placeholder="e.g. Proceed with deploying to staging environment"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedSub(null)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                className="gap-1 bg-amber-600 hover:bg-amber-700 text-white"
                onClick={() => handleReviewSubmit('NEEDS_REVISION')}
                disabled={submitting}
              >
                <RotateCcw className="w-3.5 h-3.5" /> Request Revision
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => handleReviewSubmit('ACCEPTED')}
                disabled={submitting}
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Accept Evidence
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
