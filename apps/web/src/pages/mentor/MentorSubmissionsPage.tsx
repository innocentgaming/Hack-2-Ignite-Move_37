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
  internshipId?: string;
  internshipTitle?: string;
  companyName?: string;
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
    if (decision === 'NEEDS_REVISION' && !feedback.trim()) {
      alert('Feedback is required when requesting revisions.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await apiClient.post(`/api/v1/mentor/submissions/${selectedSub.id}/review`, {
        status: decision,
        feedback: feedback.trim() || 'Approved by mentor.',
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
      (statusFilter === 'REVISION_NEEDED' && (s.status === SubmissionStatus.REVISION_NEEDED || (s.status as any) === 'NEEDS_REVISION'));

    const matchesSearch =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.taskTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.milestoneTitle && s.milestoneTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.internshipTitle && s.internshipTitle.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Submissions</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            What student work requires my attention?
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'SUBMITTED', 'REVISION_NEEDED', 'ACCEPTED'].map((st) => (
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
                ? 'Needs Revision'
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
            placeholder="Search student, task, milestone..."
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
            When interns submit deliverables, they will be queued here for your assessment.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSubmissions.map((sub) => (
            <Card key={sub.id} className="p-5 hover:shadow-md transition-shadow border border-slate-200/80">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  {/* Context Header */}
                  <div className="pb-2 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-md">
                        {sub.studentName}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-600 font-medium">{sub.internshipTitle || 'Internship'}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-indigo-700 font-medium">{sub.milestoneTitle}</span>
                    </div>

                    <Badge
                      variant={
                        sub.status === SubmissionStatus.ACCEPTED
                          ? 'success'
                          : sub.status === SubmissionStatus.SUBMITTED
                          ? 'warning'
                          : 'destructive'
                      }
                    >
                      {sub.status === SubmissionStatus.SUBMITTED
                        ? 'SUBMITTED'
                        : sub.status === SubmissionStatus.ACCEPTED
                        ? 'ACCEPTED'
                        : 'NEEDS REVISION'}
                    </Badge>
                  </div>

                  <div className="pt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Task: {sub.taskTitle}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-0.5">{sub.title}</h3>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2">{sub.description}</p>

                  <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Submitted: {sub.submittedAt}</span>
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0 flex items-center md:flex-col gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <Button
                    variant="primary"
                    size="sm"
                    className="text-xs gap-1.5 shadow-sm font-semibold"
                    onClick={() => openReviewModal(sub)}
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    Review Evidence
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
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                  {selectedSub.studentName} • {selectedSub.internshipTitle || 'Internship'}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">Task: {selectedSub.taskTitle}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Milestone: <span className="font-semibold text-slate-700">{selectedSub.milestoneTitle}</span> • Submitted: {selectedSub.submittedAt}
                </p>
              </div>
              <button
                onClick={() => setSelectedSub(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* STUDENT EVIDENCE */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Student Evidence
              </span>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs">
                {selectedSub.evidenceUrl && (
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">GitHub Pull Request / Link:</span>
                    <a
                      href={selectedSub.evidenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 font-semibold flex items-center gap-1 hover:underline bg-white px-2.5 py-1 rounded-lg border border-slate-200"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> View Artifact
                    </a>
                  </div>
                )}
                {selectedSub.attachmentName && (
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                    <span className="font-semibold text-slate-700">Additional Evidence:</span>
                    <span className="text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                      📎 {selectedSub.attachmentName}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* STUDENT NOTES */}
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Student Notes
              </span>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                {selectedSub.description || 'No additional notes provided by student.'}
              </p>
            </div>

            {/* MENTOR REVIEW */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 block">
                Mentor Review
              </span>

              {/* Quality Rating */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Quality Rating: {rating}/5 Stars
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
                        className={`w-5 h-5 ${
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
                  Feedback & Review Notes *
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Provide constructive assessment and actionable guidance..."
                  rows={3}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Strengths</label>
                  <input
                    type="text"
                    value={strengths}
                    onChange={(e) => setStrengths(e.target.value)}
                    placeholder="e.g. Clean schema normalization"
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Improvements Needed</label>
                  <input
                    type="text"
                    value={improvements}
                    onChange={(e) => setImprovements(e.target.value)}
                    placeholder="e.g. Add unit test coverage"
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>
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
                variant="outline"
                size="sm"
                className="gap-1 border-amber-300 text-amber-700 hover:bg-amber-50"
                onClick={() => handleReviewSubmit('NEEDS_REVISION')}
                disabled={submitting}
              >
                <RotateCcw className="w-3.5 h-3.5" /> Request Revision
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
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
