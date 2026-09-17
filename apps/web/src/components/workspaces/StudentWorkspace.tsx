import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '../Card';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { FormInput } from '../FormInput';
import { apiClient } from '../../services/apiClient';
import {
  StudentWorkspaceDto,
  WorkflowTaskDto,
  SubmissionDto,
  OutcomeStatus,
  TaskStatus,
  OutcomeVersionDto,
  SubmissionFileDto,
  SubmissionTimelineEventDto,
} from '@internos/types';
import {
  Briefcase,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Upload,
  MessageSquare,
  History,
  Target,
  ExternalLink,
  Download,
  Paperclip,
  Trash2,
} from 'lucide-react';

export const StudentWorkspace: React.FC = () => {
  const [data, setData] = useState<StudentWorkspaceDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active tab
  const [activeTab, setActiveTab] = useState<'tasks' | 'submissions' | 'feedback' | 'outcomes'>('tasks');

  // Submit Modal
  const [selectedTask, setSelectedTask] = useState<WorkflowTaskDto | null>(null);
  const [submitTitle, setSubmitTitle] = useState('');
  const [submitContent, setSubmitContent] = useState('');
  const [submitEvidenceUrl, setSubmitEvidenceUrl] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<SubmissionFileDto[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Timeline modal
  const [timelineSubmission, setTimelineSubmission] = useState<SubmissionDto | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<SubmissionTimelineEventDto[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  // Outcome history modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [outcomeHistory, setOutcomeHistory] = useState<OutcomeVersionDto[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchWorkspace = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get<StudentWorkspaceDto>('/api/v1/workspaces/student/dashboard');
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.error?.message || 'Failed to load student workspace');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading workspace');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspace();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !data?.internship || !selectedTask) return;

    setUploadingFile(true);
    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64String = (reader.result as string).split(',')[1] || '';
        const res = await apiClient.post<SubmissionFileDto>('/api/v1/submissions/upload', {
          filename: file.name,
          mimeType: file.type || 'application/octet-stream',
          contentBase64: base64String,
          internshipId: data.internship!.id,
          taskId: selectedTask.id,
        });

        if (res.success && res.data) {
          setUploadedFiles((prev) => [...prev, res.data!]);
        } else {
          setError(res.error?.message || 'File upload failed');
        }
        setUploadingFile(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setUploadingFile(false);
    }
  };

  const handleRemoveFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleOpenTimeline = async (sub: SubmissionDto) => {
    setTimelineSubmission(sub);
    setLoadingTimeline(true);
    try {
      const res = await apiClient.get<SubmissionTimelineEventDto[]>(
        `/api/v1/submissions/${sub.id}/timeline`
      );
      if (res.success && res.data) {
        setTimelineEvents(res.data);
      } else {
        setTimelineEvents([]);
      }
    } catch {
      setTimelineEvents([]);
    } finally {
      setLoadingTimeline(false);
    }
  };

  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.internship || !selectedTask) return;

    setSubmitting(true);
    setSubmitSuccess(null);
    const isRevision = selectedTask.status === TaskStatus.CHANGES_REQUESTED;

    try {
      const res = await apiClient.post<SubmissionDto>('/api/v1/submissions', {
        internshipId: data.internship.id,
        taskId: selectedTask.id,
        isRevision,
        title: submitTitle.trim() || `Deliverable for ${selectedTask.title}`,
        content: submitContent.trim(),
        fileIds: uploadedFiles.map((f) => f.id),
        evidenceUrls: submitEvidenceUrl.trim() ? [submitEvidenceUrl.trim()] : undefined,
      });

      if (res.success) {
        setSubmitSuccess(
          isRevision
            ? 'Revision (Version 2+) submitted successfully for mentor re-evaluation!'
            : 'Deliverable submitted successfully for mentor review!'
        );
        setSelectedTask(null);
        setSubmitTitle('');
        setSubmitContent('');
        setSubmitEvidenceUrl('');
        setUploadedFiles([]);
        await fetchWorkspace();
      } else {
        setError(res.error?.message || 'Failed to submit deliverable');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenHistory = async () => {
    if (!data?.internship) return;
    setShowHistoryModal(true);
    setLoadingHistory(true);
    try {
      const res = await apiClient.get<OutcomeVersionDto[]>(
        `/api/v1/workspaces/internships/${data.internship.id}/outcomes/history`
      );
      if (res.success && res.data) {
        setOutcomeHistory(res.data);
      }
    } catch {
      // ignore
    } finally {
      setLoadingHistory(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium text-slate-500">Loading student workspace...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800">
        <p className="font-semibold text-base mb-1">Failed to load student workspace</p>
        <p className="text-sm text-rose-600 mb-4">{error || 'Workspace data unavailable'}</p>
        <Button size="sm" variant="outline" onClick={fetchWorkspace}>
          Retry
        </Button>
      </div>
    );
  }

  const { internship, workflowProgress, currentTasks, upcomingDeadlines, overdueTasks, recentFeedback, outcomeProgress } = data;

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      {internship ? (
        <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 rounded-2xl p-6 md:p-8 text-white border border-indigo-800/40 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Briefcase className="w-48 h-48" />
          </div>

          <div className="relative z-10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                    {internship.company?.name || 'Company Host'}
                  </span>
                  <span className="text-slate-500">•</span>
                  <Badge variant={internship.status === 'ACTIVE' ? 'emerald' : 'indigo'} size="sm">
                    {internship.status}
                  </Badge>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{internship.title}</h1>
                <p className="text-xs text-slate-300">
                  {new Date(internship.startDate).toLocaleDateString()} — {new Date(internship.endDate).toLocaleDateString()}
                  {internship.mentor?.name && ` • Industry Mentor: ${internship.mentor.name}`}
                </p>
              </div>

              <div className="flex flex-col items-end gap-1">
                <span className="text-xs font-medium text-slate-300">Workflow Progress</span>
                <span className="text-3xl font-black text-indigo-400">{workflowProgress}%</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-800/80 rounded-full h-2.5 overflow-hidden border border-slate-700/50">
              <div
                className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${workflowProgress}%` }}
              />
            </div>
          </div>
        </div>
      ) : (
        <Card>
          <CardBody className="p-8 text-center space-y-3">
            <Briefcase className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="text-lg font-bold text-slate-800">No Active Internship Registered</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              You do not have an active internship workspace yet. Register your company placement to begin.
            </p>
          </CardBody>
        </Card>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hoverable>
          <CardBody className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase">Pending Tasks</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{currentTasks.length}</div>
              <p className="text-[11px] text-slate-500 mt-0.5">Awaiting submission</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </CardBody>
        </Card>

        <Card hoverable>
          <CardBody className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase">Upcoming Deadlines</span>
              <div className="text-2xl font-black text-amber-600 mt-1">{upcomingDeadlines.length}</div>
              <p className="text-[11px] text-slate-500 mt-0.5">Due in next 14 days</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardBody>
        </Card>

        <Card hoverable className={overdueTasks.length > 0 ? 'border-rose-300 bg-rose-50/20' : ''}>
          <CardBody className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-rose-600 uppercase">Overdue Tasks</span>
              <div className="text-2xl font-black text-rose-600 mt-1">{overdueTasks.length}</div>
              <p className="text-[11px] text-rose-500 mt-0.5">Requires prompt action</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardBody>
        </Card>

        <Card hoverable>
          <CardBody className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase">Outcome Targets</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                {outcomeProgress.met} / {outcomeProgress.total}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Verified completed</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
          </CardBody>
        </Card>
      </div>

      {submitSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {submitSuccess}
          </span>
          <Button size="sm" variant="outline" onClick={() => setSubmitSuccess(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'tasks' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          Active Tasks ({currentTasks.length})
        </button>

        <button
          onClick={() => setActiveTab('submissions')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'submissions' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          My Submissions ({data.submissions.length})
        </button>

        <button
          onClick={() => setActiveTab('feedback')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'feedback' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Mentor Feedback ({recentFeedback.length})
        </button>

        <button
          onClick={() => setActiveTab('outcomes')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'outcomes' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Target className="w-4 h-4" />
          Learning Outcomes ({internship?.expectedOutcomes?.length || 0})
        </button>
      </div>

      {/* Tab: Tasks */}
      {activeTab === 'tasks' && (
        <Card>
          <CardHeader title="Current Tasks & Milestones" subtitle="Complete and submit your deliverables with supporting evidence." />
          <CardBody className="p-0">
            {currentTasks.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">No pending tasks. You are completely up to date!</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {currentTasks.map((t) => {
                  const isOverdue = new Date(t.currentDueDate).getTime() < Date.now();
                  const isRevision = t.status === TaskStatus.CHANGES_REQUESTED;
                  const matchingSub = data.submissions.find((s) => s.taskId === t.id);

                  return (
                    <div key={t.id} className="p-5 space-y-3 hover:bg-slate-50/70 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1 max-w-xl">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 text-sm">{t.title}</span>
                            {isRevision ? (
                              <Badge variant="amber" size="sm">
                                Revision Requested
                              </Badge>
                            ) : isOverdue ? (
                              <Badge variant="rose" size="sm">
                                Overdue
                              </Badge>
                            ) : (
                              <Badge variant="slate" size="sm">
                                Pending
                              </Badge>
                            )}
                          </div>
                          {t.description && <p className="text-xs text-slate-600">{t.description}</p>}
                          <div className="flex items-center gap-4 text-[11px] text-slate-500">
                            <span>Due: {new Date(t.currentDueDate).toLocaleDateString()}</span>
                            {t.latePolicy && <span>Late Policy: {t.latePolicy}</span>}
                          </div>
                        </div>

                        <Button
                          size="sm"
                          variant={isRevision ? 'primary' : 'outline'}
                          className="self-start md:self-auto flex items-center gap-1.5"
                          onClick={() => {
                            setSelectedTask(t);
                            setSubmitTitle(isRevision ? `${t.title} (Revision v${(matchingSub?.currentVersion || 1) + 1})` : `Deliverable for ${t.title}`);
                            setSubmitContent('');
                            setUploadedFiles([]);
                          }}
                        >
                          <Upload className="w-3.5 h-3.5" />
                          {isRevision ? 'Submit Revision' : 'Submit Work'}
                        </Button>
                      </div>

                      {/* Mentor Revision Reason Callout */}
                      {isRevision && matchingSub?.revisionReason && (
                        <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                          <span className="font-bold flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            Mentor Revision Request:
                          </span>
                          <p className="italic pl-5">"{matchingSub.revisionReason}"</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Tab: Submissions */}
      {activeTab === 'submissions' && (
        <Card>
          <CardHeader title="Delivered Submissions & Version History" subtitle="Review past submissions, version snapshots, and mentor audit log." />
          <CardBody className="p-0">
            {data.submissions.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">No deliverables submitted yet.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {data.submissions.map((s) => (
                  <div key={s.id} className="p-5 space-y-3 hover:bg-slate-50/70 transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{s.title}</span>
                        <Badge variant="indigo" size="sm">
                          v{s.currentVersion || 1}
                        </Badge>
                        <Badge
                          variant={
                            s.status === 'ACCEPTED' ? 'emerald' : s.status === 'REVISION_NEEDED' ? 'amber' : 'indigo'
                          }
                          size="sm"
                        >
                          {s.status}
                        </Badge>
                        {s.isLate && (
                          <Badge variant="rose" size="sm">
                            Late Submission
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400">
                          Submitted: {new Date(s.submittedAt).toLocaleDateString()}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-1 text-xs"
                          onClick={() => handleOpenTimeline(s)}
                        >
                          <History className="w-3.5 h-3.5 text-indigo-600" />
                          Timeline ({s.versions?.length || 1})
                        </Button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                      {s.content}
                    </p>

                    {/* Attached Files & Evidence */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {(s.files || []).map((f) => (
                        <a
                          key={f.id}
                          href={`/api/v1/submissions/files/${f.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-200/60 text-indigo-700 text-xs hover:bg-indigo-100 transition-colors"
                        >
                          <Paperclip className="w-3 h-3 text-indigo-500" />
                          <span className="font-medium truncate max-w-[180px]">{f.name}</span>
                          <span className="text-[10px] text-indigo-400">({Math.round(f.size / 1024)} KB)</span>
                          <Download className="w-3 h-3 text-indigo-600 ml-0.5" />
                        </a>
                      ))}

                      {s.documentUrl && (
                        <a
                          href={s.documentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 underline px-2 py-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          External Evidence Link
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Tab: Feedback */}
      {activeTab === 'feedback' && (
        <Card>
          <CardHeader title="Recent Mentor Reviews & Grades" subtitle="Direct feedback and scores from supervisors." />
          <CardBody className="p-0">
            {recentFeedback.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">No feedback received yet.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentFeedback.map((f) => (
                  <div key={f.id} className="p-5 space-y-2 hover:bg-slate-50/70 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-sm">{f.reviewerName}</span>
                        <Badge variant="purple" size="sm">
                          {f.reviewerRole}
                        </Badge>
                        <Badge variant={f.status === 'ACCEPTED' ? 'emerald' : 'amber'} size="sm">
                          {f.status}
                        </Badge>
                      </div>

                      {f.score !== undefined && (
                        <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                          Score: {f.score} / 100
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200/60">
                      "{f.feedback}"
                    </p>

                    <span className="text-[11px] text-slate-400">
                      Reviewed on {new Date(f.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Tab: Outcomes */}
      {activeTab === 'outcomes' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-600" />
              Contracted Expected Outcomes (Version {internship?.outcomeVersion || 1})
            </h3>
            <Button size="sm" variant="outline" onClick={handleOpenHistory} className="flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-indigo-600" />
              Outcome History
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(internship?.expectedOutcomes || []).map((o, idx) => (
              <Card key={o.id || idx}>
                <CardBody className="p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{o.title}</span>
                    <Badge
                      variant={
                        o.status === OutcomeStatus.MET
                          ? 'emerald'
                          : o.status === OutcomeStatus.IN_PROGRESS
                          ? 'indigo'
                          : 'slate'
                      }
                      size="sm"
                    >
                      {o.status || 'PLANNED'}
                    </Badge>
                  </div>
                  {o.description && <p className="text-xs text-slate-600">{o.description}</p>}
                  <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                    <span className="font-medium text-slate-700">Expected Evidence: </span>
                    {o.expectedEvidence}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Submit Deliverable Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">
                  {selectedTask.status === TaskStatus.CHANGES_REQUESTED ? 'Submit Revision' : 'Submit Deliverable'}
                </h3>
                <p className="text-xs text-slate-500">Task: {selectedTask.title}</p>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            {selectedTask.status === TaskStatus.CHANGES_REQUESTED && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Revision Note:
                </span>
                <p>
                  Submitting revised work generates an immutable Version snapshot preserving previous submissions and feedback.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmitWork} className="space-y-4">
              <FormInput
                label="Submission Title"
                placeholder="e.g. Sprint 1 Architecture Design Document"
                value={submitTitle}
                onChange={(e) => setSubmitTitle(e.target.value)}
                required
              />

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Content / Deliverable Body (Diary, Report, PPT notes)
                </label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  placeholder="Summarize your completed tasks, implementation details, or notes for the reviewer..."
                  value={submitContent}
                  onChange={(e) => setSubmitContent(e.target.value)}
                  required
                />
              </div>

              {/* Private File Upload Section */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>Attach Deliverable Files (Report, Diary, PPT, Evidence)</span>
                  <span className="text-[11px] text-slate-400 font-normal">Private & secure</span>
                </label>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-200 transition-colors">
                    <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
                    {uploadingFile ? 'Uploading...' : 'Choose File to Upload'}
                    <input
                      type="file"
                      className="hidden"
                      disabled={uploadingFile}
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {uploadedFiles.map((f) => (
                      <div
                        key={f.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Paperclip className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                          <span className="font-medium text-slate-800 truncate">{f.name}</span>
                          <span className="text-[10px] text-slate-400">({Math.round(f.size / 1024)} KB)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(f.id)}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <FormInput
                label="Supporting URL (Optional GitHub PR or repository)"
                placeholder="https://github.com/... or https://..."
                value={submitEvidenceUrl}
                onChange={(e) => setSubmitEvidenceUrl(e.target.value)}
              />

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <Button variant="outline" size="sm" type="button" onClick={() => setSelectedTask(null)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={submitting || uploadingFile}>
                  {submitting ? 'Submitting...' : selectedTask.status === TaskStatus.CHANGES_REQUESTED ? 'Submit Revision (v2+)' : 'Upload & Submit'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submission Timeline Modal */}
      {timelineSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                  <History className="w-5 h-5 text-indigo-600" />
                  Submission Timeline & History
                </h3>
                <p className="text-xs text-slate-500 truncate max-w-md">{timelineSubmission.title}</p>
              </div>
              <button
                onClick={() => setTimelineSubmission(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 flex-1 pr-1">
              {loadingTimeline ? (
                <div className="p-8 text-center text-sm text-slate-400">Loading timeline events...</div>
              ) : timelineEvents.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-400">No timeline events recorded.</div>
              ) : (
                <div className="relative border-l-2 border-indigo-100 ml-4 space-y-6 pl-6 py-2">
                  {timelineEvents.map((e) => (
                    <div key={e.id} className="relative space-y-1">
                      <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-white border-2 border-indigo-600" />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">{e.title}</span>
                          <Badge
                            variant={
                              e.type === 'APPROVED'
                                ? 'emerald'
                                : e.type === 'REVISION_REQUESTED'
                                ? 'amber'
                                : 'indigo'
                            }
                            size="sm"
                          >
                            v{e.version} • {e.type}
                          </Badge>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(e.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        {e.description}
                      </p>
                      {e.data?.revisionReason && (
                        <p className="text-[11px] text-amber-700 font-medium">
                          Reason: {e.data.revisionReason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button size="sm" variant="outline" onClick={() => setTimelineSubmission(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Outcome Version History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                  <History className="w-5 h-5 text-indigo-600" />
                  Outcome Version History
                </h3>
                <p className="text-xs text-slate-500">Full immutable audit trail of learning contract revisions.</p>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 flex-1 pr-1">
              {loadingHistory ? (
                <div className="p-8 text-center text-sm text-slate-400">Loading version snapshots...</div>
              ) : outcomeHistory.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-400">No previous versions recorded.</div>
              ) : (
                outcomeHistory.map((v) => (
                  <div key={v.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs">Version {v.versionNumber}</span>
                      <span className="text-[11px] text-slate-500">
                        {new Date(v.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      {v.outcomes.map((o, i) => (
                        <div key={i} className="text-xs bg-white p-2 rounded border border-slate-200/80 flex items-center justify-between">
                          <span className="font-medium text-slate-800">{o.title}</span>
                          <span className="text-[10px] text-slate-500 uppercase">{o.status || 'PLANNED'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button size="sm" variant="outline" onClick={() => setShowHistoryModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
