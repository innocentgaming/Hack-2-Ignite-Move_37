import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
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
  UploadCloud,
  FileText,
  Plus,
  Trash2,
  Save,
  MessageSquare,
} from 'lucide-react';

interface EvidenceEntry {
  type: EvidenceType;
  url: string;
  filename?: string;
  notes?: string;
}

export const StudentSubmitEvidencePage: React.FC = () => {
  const { taskId, id } = useParams<{ taskId?: string; id?: string }>();
  const effectiveTaskId = taskId || id;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isResubmitMode = searchParams.get('resubmit') === 'true';

  const [task, setTask] = useState<TaskItemDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [evidenceType, setEvidenceType] = useState<EvidenceType>(EvidenceType.GITHUB_PR);
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentBase64, setAttachmentBase64] = useState<string | null>(null);
  const [attachmentSize, setAttachmentSize] = useState<number | null>(null);
  const [notes, setNotes] = useState('');

  // Multiple Evidence Entries
  const [extraEvidence, setExtraEvidence] = useState<EvidenceEntry[]>([]);

  // Submitting States
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchTask = async () => {
      if (!effectiveTaskId) return;
      try {
        setLoading(true);
        setError(null);
        const res = await apiClient.get<TaskItemDto>(`/api/v1/student/tasks/${effectiveTaskId}`);
        if (res.success && res.data) {
          setTask(res.data);

          // If task has latestSubmission in DRAFT or REVISION_NEEDED, prefill details
          if (res.data.latestSubmission) {
            setTitle(
              isResubmitMode
                ? `Revised: ${res.data.title}`
                : res.data.latestSubmission.title || `Submission: ${res.data.title}`
            );
            // Fetch detailed submission if available
            try {
              const subRes = await apiClient.get<any>(
                `/api/v1/student/submissions/${res.data.latestSubmission.id}`
              );
              if (subRes.success && subRes.data) {
                setDescription(subRes.data.description || '');
                if (subRes.data.evidenceType) setEvidenceType(subRes.data.evidenceType);
                if (subRes.data.evidenceUrl) setEvidenceUrl(subRes.data.evidenceUrl);
                if (subRes.data.attachmentName) setAttachmentName(subRes.data.attachmentName);
                if (subRes.data.notes) setNotes(subRes.data.notes);
              }
            } catch {
              // Ignore fallback to defaults
            }
          } else {
            setTitle(`Submission: ${res.data.title}`);
          }
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
  }, [effectiveTaskId, isResubmitMode]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 10MB
    if (file.size > 10 * 1024 * 1024) {
      setSubmitError('File size exceeds the 10 MB limit.');
      return;
    }

    setAttachmentName(file.name);
    setAttachmentSize(file.size);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] || result;
      setAttachmentBase64(base64);
      setSubmitError(null);
    };
    reader.onerror = () => {
      setSubmitError('Failed to read selected file.');
    };
    reader.readAsDataURL(file);
  };

  const handleAddExtraEvidence = () => {
    setExtraEvidence([
      ...extraEvidence,
      { type: EvidenceType.OTHER, url: '', filename: '', notes: '' },
    ]);
  };

  const handleRemoveExtraEvidence = (index: number) => {
    setExtraEvidence(extraEvidence.filter((_, i) => i !== index));
  };

  const handleUpdateExtraEvidence = (index: number, field: keyof EvidenceEntry, val: string) => {
    const updated = [...extraEvidence];
    updated[index] = { ...updated[index], [field]: val };
    setExtraEvidence(updated);
  };

  const handleFormSubmit = async (isDraft: boolean) => {
    if (!effectiveTaskId) return;

    if (!title.trim()) {
      setSubmitError('Please enter a submission title.');
      return;
    }
    if (!description.trim() && !isDraft) {
      setSubmitError('Please provide a description or work notes for your submission.');
      return;
    }

    // Collect all evidence URLs
    const allUrls: string[] = [];
    if (evidenceUrl.trim()) allUrls.push(evidenceUrl.trim());
    extraEvidence.forEach((e) => {
      if (e.url.trim()) allUrls.push(e.url.trim());
    });

    if (!isDraft && allUrls.length === 0 && !attachmentName) {
      setSubmitError('Please provide at least one proof of evidence (URL or file attachment).');
      return;
    }

    try {
      if (isDraft) {
        setSavingDraft(true);
      } else {
        setSubmitting(true);
      }
      setSubmitError(null);

      // If attachment was uploaded, we can also optionally register it in document vault
      if (attachmentBase64 && attachmentName.toLowerCase().endsWith('.pdf')) {
        try {
          await apiClient.post('/api/v1/student/documents', {
            filename: attachmentName,
            mimeType: 'application/pdf',
            contentBase64: attachmentBase64,
            documentType: 'DELIVERABLE_EVIDENCE',
          });
        } catch {
          // Non-blocking if doc registration fails
        }
      }

      const payload = {
        title: title.trim(),
        description: description.trim(),
        evidenceType,
        evidenceUrl: evidenceUrl.trim() || undefined,
        evidenceUrls: allUrls.length > 0 ? allUrls : undefined,
        attachmentName: attachmentName || undefined,
        notes: notes.trim() || undefined,
        isDraft,
      };

      const res = await apiClient.post(
        `/api/v1/student/tasks/${effectiveTaskId}/submissions`,
        payload
      );

      if (res.success) {
        setSubmitSuccess(
          isDraft
            ? 'Draft submission saved successfully!'
            : 'Evidence submitted successfully! Redirecting to submissions ledger...'
        );
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
      setSavingDraft(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl pb-12">
        <LoadingSkeleton count={3} />
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-3 max-w-md mx-auto my-12">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h3 className="font-bold text-slate-900 text-lg">Task Not Found</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          {error || 'Unable to locate the specified task record in the database.'}
        </p>
        <div className="pt-2">
          <Link to="/app/student/tasks">
            <Button variant="primary" size="sm">
              Back to Assigned Tasks
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isRevisionNeeded = task.status === TaskStatus.CHANGES_REQUESTED;

  return (
    <div className="space-y-6 pb-16 max-w-4xl">
      {/* Navigation Breadcrumb */}
      <div>
        <Link
          to={`/app/student/tasks/${effectiveTaskId}`}
          className="text-xs font-semibold text-slate-500 hover:text-indigo-600 inline-flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Task Details</span>
        </Link>
      </div>

      {/* Header Banner */}
      <Card className="rounded-2xl border border-slate-200 p-6 bg-white space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="indigo" size="sm">
                EVIDENCE SUBMISSION
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
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              Submit Evidence: {task.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
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
            </div>
          </div>
        </div>

        {/* Requirements & Expected Evidence */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <span className="font-bold text-slate-900 block flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-600" />
              Task Description & Mentor Instructions
            </span>
            <p className="text-slate-600 leading-relaxed">{task.description}</p>
            {task.instructions && (
              <p className="text-slate-500 italic pt-1 border-t border-slate-200/60">
                "{task.instructions}"
              </p>
            )}
          </div>

          <div className="space-y-2 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
            <span className="font-bold text-indigo-950 block flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-indigo-600" />
              Expected Evidence (Accreditation & Mentor Defined)
            </span>
            <div className="p-2.5 bg-white rounded-lg border border-indigo-200 text-indigo-900 font-medium">
              {task.expectedEvidence}
            </div>
            {task.learningOutcomeCode && (
              <div className="flex items-center gap-1.5 text-[11px] text-indigo-700 font-semibold pt-1">
                <Target className="w-3.5 h-3.5" />
                <span>Mapped Outcome: {task.learningOutcomeCode} - {task.learningOutcomeName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Previous Mentor Feedback if in Revision State */}
        {isRevisionNeeded && task.latestSubmission?.mentorFeedback && (
          <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 text-xs space-y-2 text-rose-900">
            <div className="flex items-center gap-2 font-bold text-rose-800">
              <MessageSquare className="w-4 h-4 text-rose-600" />
              <span>Mentor Requested Revisions on Previous Submission:</span>
            </div>
            <p className="p-3 bg-white rounded-lg border border-rose-200 font-mono text-slate-800 leading-relaxed">
              "{task.latestSubmission.mentorFeedback}"
            </p>
            <p className="text-[11px] text-rose-700">
              Please address the items outlined above in your updated actual evidence and resubmit for review.
            </p>
          </div>
        )}
      </Card>

      {/* Submission Form Card */}
      <Card className="rounded-2xl border border-slate-200 p-6 bg-white space-y-6 shadow-xs">
        {submitError && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{submitError}</span>
          </div>
        )}

        {submitSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>{submitSuccess}</span>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleFormSubmit(false);
          }}
          className="space-y-6"
        >
          {/* SECTION 1: YOUR SUBMISSION */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-500">
              1. Your Submission Details
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Submission Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. JWT Auth Endpoints Implementation & Postman Suite"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Description / Notes on Work Completed <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain the technical implementation, architectural decisions, and how this addresses the expected evidence requirements..."
                className="w-full text-xs p-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white leading-relaxed"
                required
              />
            </div>
          </div>

          {/* SECTION 2: ACTUAL EVIDENCE */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-500">
                  2. Actual Evidence & Deliverables
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Provide verifiable repositories, pull requests, deployments, or documents demonstrating completion.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Primary Evidence Type
                </label>
                <select
                  value={evidenceType}
                  onChange={(e) => setEvidenceType(e.target.value as EvidenceType)}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium"
                >
                  <option value={EvidenceType.GITHUB_PR}>GitHub Pull Request</option>
                  <option value={EvidenceType.GITHUB_REPO}>GitHub Repository</option>
                  <option value={EvidenceType.DEPLOYMENT_URL}>Deployment URL</option>
                  <option value={EvidenceType.DOCUMENT}>Document (PDF)</option>
                  <option value={EvidenceType.SCREENSHOT}>Screenshot</option>
                  <option value={EvidenceType.VIDEO}>Video Demo</option>
                  <option value={EvidenceType.OTHER}>Other Verifiable Deliverable</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Verifiable Evidence URL
                </label>
                <div className="relative">
                  <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="url"
                    value={evidenceUrl}
                    onChange={(e) => setEvidenceUrl(e.target.value)}
                    placeholder="https://github.com/org/repo/pull/12 or https://staging.app.com"
                    className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono bg-white"
                  />
                </div>
              </div>
            </div>

            {/* File Upload Section */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Upload File Evidence (Report, Test Execution PDF, or Architecture Diagram)
              </label>
              <div className="border-2 border-dashed border-slate-200 hover:border-indigo-300 rounded-2xl p-5 text-center bg-slate-50/50 transition-colors">
                <input
                  type="file"
                  id="evidence-file-input"
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg,.zip"
                />
                <label
                  htmlFor="evidence-file-input"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                >
                  <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-indigo-600 hover:underline">
                      Click to upload file
                    </span>
                    <span className="text-xs text-slate-400"> or drag and drop</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    PDF documents, PNG/JPG screenshots, or ZIP archive (Max 10 MB)
                  </p>
                </label>

                {attachmentName && (
                  <div className="mt-3 inline-flex items-center gap-2 p-2 bg-white rounded-xl border border-indigo-200 text-xs font-medium text-indigo-950">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    <span>Attached: {attachmentName}</span>
                    {attachmentSize && (
                      <span className="text-slate-400 text-[10px]">
                        ({(attachmentSize / 1024).toFixed(1)} KB)
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setAttachmentName('');
                        setAttachmentBase64(null);
                        setAttachmentSize(null);
                      }}
                      className="text-slate-400 hover:text-rose-500 ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Evidence Links */}
            {extraEvidence.length > 0 && (
              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold text-slate-700 block">
                  Additional Evidence Items:
                </span>
                {extraEvidence.map((entry, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center gap-3"
                  >
                    <select
                      value={entry.type}
                      onChange={(e) =>
                        handleUpdateExtraEvidence(idx, 'type', e.target.value as EvidenceType)
                      }
                      className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                    >
                      <option value={EvidenceType.GITHUB_PR}>GitHub PR</option>
                      <option value={EvidenceType.GITHUB_REPO}>GitHub Repo</option>
                      <option value={EvidenceType.DEPLOYMENT_URL}>Deployment</option>
                      <option value={EvidenceType.DOCUMENT}>Document</option>
                      <option value={EvidenceType.OTHER}>Other</option>
                    </select>
                    <input
                      type="url"
                      placeholder="Evidence URL..."
                      value={entry.url}
                      onChange={(e) => handleUpdateExtraEvidence(idx, 'url', e.target.value)}
                      className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveExtraEvidence(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={handleAddExtraEvidence}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 pt-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add another evidence item (URL / PR / Deployment)</span>
            </button>

            {/* Extra student notes */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Additional Notes / Credentials for Reviewer (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Staging credentials: testuser / Pass123, or test command to run: npm test"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
            <Link to={`/app/student/tasks/${effectiveTaskId}`}>
              <Button type="button" variant="secondary" size="sm">
                Cancel
              </Button>
            </Link>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleFormSubmit(true)}
                disabled={savingDraft || submitting}
                className="gap-1.5 text-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingDraft ? 'Saving...' : 'Save Draft'}</span>
              </Button>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={submitting || savingDraft}
                className="gap-1.5 text-xs shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'Submitting...' : 'Submit for Review'}</span>
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default StudentSubmitEvidencePage;
