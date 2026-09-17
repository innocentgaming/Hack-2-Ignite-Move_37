import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';
import { TaskItemDto, EvidenceType, TaskStatus } from '@internos/types';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import {
  ArrowLeft,
  Clock,
  Target,
  GitBranch,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Send,
  Link2,
  Paperclip,
  BookOpen,
} from 'lucide-react';

export const StudentTaskDetailPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();

  const [task, setTask] = useState<TaskItemDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Submission Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [evidenceType, setEvidenceType] = useState<EvidenceType>(EvidenceType.GITHUB_PR);
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    const fetchTask = async () => {
      if (!taskId) return;
      try {
        setLoading(true);
        setError(null);
        const res = await apiClient.get<TaskItemDto>(`/api/v1/student/tasks/${taskId}`);
        if (res.success && res.data) {
          setTask(res.data);
          setTitle(`Submission: ${res.data.title}`);
        } else {
          setError(res.error?.message || 'Task not found');
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to connect to task details');
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [taskId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskId) return;

    if (!title.trim()) {
      setSubmitError('Please enter a submission title.');
      return;
    }
    if (!description.trim()) {
      setSubmitError('Please provide a summary description of the work completed.');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);
      const res = await apiClient.post(`/api/v1/student/tasks/${taskId}/submissions`, {
        title,
        description,
        evidenceType,
        evidenceUrl: evidenceUrl.trim() || undefined,
        attachmentName: attachmentName.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      if (res.success) {
        setSubmitSuccess(true);
        setTimeout(() => {
          navigate('/app/student/submissions');
        }, 1200);
      } else {
        setSubmitError(res.error?.message || 'Failed to submit evidence');
      }
    } catch (err: any) {
      setSubmitError(err?.message || 'Network error while submitting evidence');
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

  if (error || !task) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <h3 className="font-bold text-slate-800">Task Not Found</h3>
        <p className="text-xs text-slate-500">{error || 'Unable to retrieve this task.'}</p>
        <Link to="/app/student/tasks">
          <Button variant="secondary" size="sm">Back to Tasks</Button>
        </Link>
      </div>
    );
  }

  const isApproved = task.status === TaskStatus.APPROVED;
  const isSubmitted = task.status === TaskStatus.SUBMITTED;
  const isChanges = task.status === TaskStatus.CHANGES_REQUESTED;

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      {/* Back Button */}
      <div>
        <Link
          to="/app/student/tasks"
          className="text-xs font-semibold text-slate-500 hover:text-indigo-600 inline-flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Tasks</span>
        </Link>
      </div>

      {/* Task Header & Requirements Card */}
      <Card className="rounded-2xl border border-slate-200 p-6 bg-white space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
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
                {task.priority} PRIORITY
              </Badge>
              {task.milestoneTitle && (
                <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                  <GitBranch className="w-3.5 h-3.5 text-slate-400" />
                  {task.milestoneTitle}
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {task.title}
            </h1>
          </div>

          <div className="bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-right whitespace-nowrap">
            <span className="text-slate-400 block text-[11px] uppercase">Due Date</span>
            <span className="font-mono text-slate-800 font-bold flex items-center justify-end gap-1 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              {task.dueDate}
            </span>
          </div>
        </div>

        {/* Task Description & Instructions */}
        <div className="space-y-4 pt-4 border-t border-slate-100 text-xs">
          <div>
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-400 mb-1">
              Description
            </h4>
            <p className="text-slate-700 leading-relaxed text-sm">
              {task.description}
            </p>
          </div>

          {task.instructions && (
            <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-1">
              <h4 className="font-bold text-indigo-900 text-xs flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                Mentor Instructions
              </h4>
              <p className="text-indigo-900 leading-relaxed text-xs">
                {task.instructions}
              </p>
            </div>
          )}

          {/* Expected Evidence Requirement */}
          <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1">
            <h4 className="font-bold text-emerald-900 text-xs flex items-center gap-1.5">
              <Target className="w-4 h-4 text-emerald-700" />
              Required Expected Evidence (Requirement defined by Mentor)
            </h4>
            <p className="text-emerald-900 text-xs font-medium">
              {task.expectedEvidence}
            </p>
          </div>
        </div>
      </Card>

      {/* Submission Status or Form */}
      {isApproved ? (
        <Card className="rounded-2xl border border-emerald-200 p-6 bg-emerald-50/50 space-y-3">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-base">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            <span>Task Completed & Evidence Accepted</span>
          </div>
          <p className="text-xs text-emerald-700 leading-relaxed">
            Your industry mentor has reviewed and accepted your submitted evidence for this task. You have fulfilled this milestone requirement!
          </p>
          <Link to="/app/student/submissions">
            <Button variant="secondary" size="sm" className="mt-2">
              View In Submissions Vault
            </Button>
          </Link>
        </Card>
      ) : isSubmitted ? (
        <Card className="rounded-2xl border border-indigo-200 p-6 bg-indigo-50/40 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-900 font-bold text-base">
              <FileCheck className="w-5 h-5 text-indigo-600" />
              <span>Evidence Submitted — Under Mentor Review</span>
            </div>
            <Badge variant="indigo" size="sm">
              SUBMITTED
            </Badge>
          </div>
          <p className="text-xs text-slate-600">
            You submitted proof of work for this deliverable. Your mentor has been notified and will review your technical submission shortly.
          </p>
          <div className="pt-2 flex items-center gap-3">
            <Link to="/app/student/submissions">
              <Button variant="secondary" size="sm">
                Open Submissions Ledger
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        /* The Evidence Submission Form */
        <Card className="rounded-2xl border border-slate-200 p-6 bg-white shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-indigo-600" />
              Submit Evidence for Review
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Provide verifiable proof (e.g., GitHub PR, deployment link, report) demonstrating completion of this task.
            </p>
          </div>

          {submitError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {submitSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>Evidence submitted successfully! Redirecting to Submissions...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Submission Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Sprint 2 REST Authentication PR"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Evidence Type *
              </label>
              <select
                value={evidenceType}
                onChange={(e) => setEvidenceType(e.target.value as EvidenceType)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value={EvidenceType.GITHUB_PR}>GitHub Pull Request (Recommended for code)</option>
                <option value={EvidenceType.GITHUB_REPO}>GitHub Repository URL</option>
                <option value={EvidenceType.DEPLOYMENT_URL}>Live Staging / Deployment URL</option>
                <option value={EvidenceType.DOCUMENT}>PDF Technical Report / Document</option>
                <option value={EvidenceType.SCREENSHOT}>System Architecture Screenshot / Diagram</option>
                <option value={EvidenceType.VIDEO}>Loom / Video Walkthrough</option>
                <option value={EvidenceType.OTHER}>Other Verifiable Evidence</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Evidence URL (GitHub PR, staging URL, Google Drive report)
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  placeholder="https://github.com/organization/project/pull/4"
                  className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <Link2 className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Attachment Name or File Reference (optional)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={attachmentName}
                  onChange={(e) => setAttachmentName(e.target.value)}
                  placeholder="e.g., test-coverage-report.pdf"
                  className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <Paperclip className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Work Summary & Implementation Notes *
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain what technical changes you made, what tests were performed, and how the mentor can verify your work..."
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Optional Notes for Mentor
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Blocked on staging Redis connection string; verified locally."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                disabled={submitting}
                className="gap-2 shadow-xs"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Submitting...' : 'Submit for Mentor Review'}</span>
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
};

export default StudentTaskDetailPage;
