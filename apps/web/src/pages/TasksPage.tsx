import React, { useState, useEffect } from 'react';
import { Card, CardBody } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { FormInput } from '../components/FormInput';
import { apiClient } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import {
  WorkflowTaskDto,
  UserRole,
  AIAnalysisRecordDto,
} from '@internos/types';
import { normalizeRole } from '@internos/shared';
import { AIInsightsPanel } from '../components/AIInsightsPanel';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Award,
  Send,
  History,
  AlertCircle,
  PlusCircle,
  Sparkles,
  Info,
  X,
  Brain,
} from 'lucide-react';

export const TasksPage: React.FC = () => {
  const { user } = useAuth();
  const rawRole = user?.role || UserRole.STUDENT;
  const role = normalizeRole(rawRole);
  const canGrantExtension = [UserRole.ADMIN, UserRole.MENTOR].includes(role);

  const [tasks, setTasks] = useState<WorkflowTaskDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'SUBMITTED' | 'APPROVED'>('ALL');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'STUDENT' | 'MENTOR'>('ALL');

  // Submission Modal
  const [submittingTask, setSubmittingTask] = useState<WorkflowTaskDto | null>(null);
  const [submissionComments, setSubmissionComments] = useState('');
  const [submissionSubmitting, setSubmissionSubmitting] = useState(false);

  // Extension Modal
  const [extendingTask, setExtendingTask] = useState<WorkflowTaskDto | null>(null);
  const [newDeadline, setNewDeadline] = useState('');
  const [extensionReason, setExtensionReason] = useState('');
  const [extensionSubmitting, setExtensionSubmitting] = useState(false);

  // Extension History Modal
  const [historyTask, setHistoryTask] = useState<WorkflowTaskDto | null>(null);

  // Phase 9: AI Insights Modal
  const [selectedTaskAI, setSelectedTaskAI] = useState<WorkflowTaskDto | null>(null);
  const [taskAIAnalysis, setTaskAIAnalysis] = useState<AIAnalysisRecordDto | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleOpenTaskAI = async (task: WorkflowTaskDto) => {
    setSelectedTaskAI(task);
    setAiLoading(true);
    try {
      const subRes = await apiClient.get<any>(`/api/v1/submissions?taskId=${task.id}`);
      let subId = '';
      if (subRes.success && Array.isArray(subRes.data) && subRes.data.length > 0) {
        subId = subRes.data[0].id;
      }
      if (subId) {
        const aiRes = await apiClient.get<AIAnalysisRecordDto>(`/api/v1/ai/submissions/${subId}/analysis`);
        if (aiRes.success && aiRes.data) {
          setTaskAIAnalysis(aiRes.data);
        } else {
          setTaskAIAnalysis(null);
        }
      } else {
        setTaskAIAnalysis(null);
      }
    } catch {
      setTaskAIAnalysis(null);
    } finally {
      setAiLoading(false);
    }
  };

  const handleRetryAI = async () => {
    if (!taskAIAnalysis) return;
    setIsRetrying(true);
    try {
      const res = await apiClient.post<AIAnalysisRecordDto>(
        `/api/v1/ai/submissions/${taskAIAnalysis.submissionId}/analyze`,
        {}
      );
      if (res.success && res.data) {
        setTaskAIAnalysis(res.data);
      }
    } catch (err: any) {
      alert(err?.message || 'AI retry failed');
    } finally {
      setIsRetrying(false);
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<WorkflowTaskDto[]>('/api/v1/workflows/tasks');
      if (res.success && res.data) {
        setTasks(res.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workflow tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleOpenSubmit = (task: WorkflowTaskDto) => {
    setSubmittingTask(task);
    setSubmissionComments('');
  };

  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingTask) return;

    setSubmissionSubmitting(true);
    try {
      const res = await apiClient.post<WorkflowTaskDto>(
        `/api/v1/workflows/tasks/${submittingTask.id}/submit`,
        { comments: submissionComments }
      );
      if (res.success && res.data) {
        setTasks((prev) =>
          prev.map((t) => (t.id === submittingTask.id ? (res.data as WorkflowTaskDto) : t))
        );
        setSubmittingTask(null);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to submit task');
    } finally {
      setSubmissionSubmitting(false);
    }
  };

  const handleOpenExtend = (task: WorkflowTaskDto) => {
    setExtendingTask(task);
    // Set default new deadline to 7 days from currentDueDate
    const current = new Date(task.currentDueDate);
    const inAWeek = new Date(current.getTime() + 7 * 24 * 60 * 60 * 1000);
    setNewDeadline(inAWeek.toISOString().slice(0, 16));
    setExtensionReason('');
  };

  const handleGrantExtension = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extendingTask || !newDeadline || !extensionReason.trim()) return;

    setExtensionSubmitting(true);
    try {
      const res = await apiClient.post<WorkflowTaskDto>(
        `/api/v1/workflows/tasks/${extendingTask.id}/extend`,
        {
          newDeadline: new Date(newDeadline).toISOString(),
          reason: extensionReason.trim(),
        }
      );
      if (res.success && res.data) {
        setTasks((prev) =>
          prev.map((t) => (t.id === extendingTask.id ? (res.data as WorkflowTaskDto) : t))
        );
        setExtendingTask(null);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to grant deadline extension');
    } finally {
      setExtensionSubmitting(false);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (roleFilter !== 'ALL' && t.assigneeRole !== roleFilter) return false;
    return true;
  });

  const pendingCount = tasks.filter((t) => t.status === 'PENDING').length;
  const submittedCount = tasks.filter((t) => t.status === 'SUBMITTED' || t.status === 'APPROVED').length;
  const lateCount = tasks.filter((t) => t.isLate).length;

  const isPastDue = (task: WorkflowTaskDto) => {
    return new Date(task.currentDueDate).getTime() < Date.now();
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs tracking-wider uppercase mb-1">
            <Sparkles className="w-4 h-4" />
            Configurable Workflow Engine • Phase 3
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Workflow Tasks & Timeline
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track step deadlines, submit deliverables, and manage authorized deadline extensions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchTasks} disabled={loading}>
            Refresh Tasks
          </Button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-indigo-600 shadow-sm">
          <CardBody className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Milestones</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{tasks.length}</p>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm">
          <CardBody className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pending Tasks</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{pendingCount}</p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm">
          <CardBody className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Completed / Reviewed</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{submittedCount}</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-rose-500 shadow-sm">
          <CardBody className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Late Submissions</p>
              <p className="text-2xl font-bold text-rose-600 mt-1">{lateCount}</p>
            </div>
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filter Controls */}
      <Card className="shadow-sm">
        <CardBody className="p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mr-1">Status:</span>
            {(['ALL', 'PENDING', 'SUBMITTED', 'APPROVED'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === status
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mr-1">Assignee Role:</span>
            {(['ALL', 'STUDENT', 'MENTOR'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  roleFilter === r
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Task List / Timeline */}
      {loading ? (
        <Card>
          <CardBody className="py-12 text-center text-slate-400">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium">Loading assigned workflow tasks...</p>
          </CardBody>
        </Card>
      ) : error ? (
        <Card>
          <CardBody className="py-8 text-center text-rose-600">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p className="font-semibold text-sm">{error}</p>
          </CardBody>
        </Card>
      ) : filteredTasks.length === 0 ? (
        <Card>
          <CardBody className="py-16 text-center text-slate-400">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <h3 className="text-base font-semibold text-slate-700">No Workflow Tasks Found</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto mt-1">
              There are no tasks matching your selected filters. Tasks are automatically generated
              when internships are assigned to workflow blueprints.
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => {
            const overdue = task.status === 'PENDING' && isPastDue(task);
            const hasExtensions = task.extensions && task.extensions.length > 0;

            const badgeVariant =
              task.status === 'APPROVED'
                ? 'emerald'
                : task.status === 'SUBMITTED'
                ? 'indigo'
                : overdue
                ? 'amber'
                : 'slate';

            return (
              <Card
                key={task.id}
                className={`transition-all hover:shadow-md border ${
                  task.isLate
                    ? 'border-rose-300 bg-rose-50/20'
                    : overdue
                    ? 'border-amber-300 bg-amber-50/20'
                    : task.status === 'SUBMITTED' || task.status === 'APPROVED'
                    ? 'border-emerald-200 bg-emerald-50/10'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <CardBody className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Left Column: Info & Badges */}
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Status Badge */}
                        <Badge variant={badgeVariant}>
                          {task.status}
                        </Badge>

                        {/* Step Type Badge */}
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                          {task.type}
                        </span>

                        {/* Stage Badge */}
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                          {task.stage}
                        </span>

                        {/* Assignee Role Badge */}
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                          Actor: {task.assigneeRole}
                        </span>

                        {/* Required Indicator */}
                        {task.required ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
                            Required
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-50 text-slate-500 border border-slate-200">
                            Optional
                          </span>
                        )}

                        {/* Late Badge */}
                        {task.isLate && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-600 text-white flex items-center gap-1 shadow-sm">
                            <AlertTriangle className="w-3.5 h-3.5" /> LATE SUBMISSION
                          </span>
                        )}

                        {overdue && !task.isLate && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white flex items-center gap-1 shadow-sm">
                            <Clock className="w-3.5 h-3.5" /> OVERDUE
                          </span>
                        )}

                        {/* Extensions Indicator */}
                        {hasExtensions && (
                          <button
                            onClick={() => setHistoryTask(task)}
                            className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors flex items-center gap-1"
                          >
                            <History className="w-3 h-3" /> {task.extensions.length} Extension{task.extensions.length > 1 ? 's' : ''}
                          </button>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-base font-bold text-slate-900">{task.title}</h3>

                      {/* Criteria & Scoring Rubric */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                        {task.evaluationCriteria && (
                          <div className="flex items-center gap-1">
                            <FileCheck className="w-3.5 h-3.5 text-slate-400" />
                            <span>Rubric: <strong className="text-slate-700">{task.evaluationCriteria}</strong></span>
                          </div>
                        )}
                        {task.maxMarks !== undefined && (
                          <div className="flex items-center gap-1">
                            <Award className="w-3.5 h-3.5 text-amber-500" />
                            <span>Max Marks: <strong className="text-slate-700">{task.maxMarks}</strong></span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Info className="w-3.5 h-3.5 text-slate-400" />
                          <span>Policy: <strong className="text-slate-700">{task.latePolicy.replace(/_/g, ' ')}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Deadlines & Actions */}
                    <div className="lg:text-right space-y-3 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                      <div>
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Current Due Date
                        </div>
                        <div className="text-sm font-bold text-slate-900 flex items-center lg:justify-end gap-1.5 mt-0.5">
                          <Clock className="w-4 h-4 text-indigo-600" />
                          {new Date(task.currentDueDate).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </div>
                        {task.currentDueDate !== task.originalDueDate && (
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Original: {new Date(task.originalDueDate).toLocaleDateString()}
                          </div>
                        )}
                        {task.completedAt && (
                          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
                            Submitted: {new Date(task.completedAt).toLocaleString(undefined, {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center lg:justify-end gap-2">
                        {/* Extension History Button */}
                        {hasExtensions && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setHistoryTask(task)}
                            className="text-xs"
                          >
                            <History className="w-3.5 h-3.5 mr-1" /> History
                          </Button>
                        )}

                        {/* Grant Extension Button (Faculty / HOD / Admin) */}
                        {canGrantExtension && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenExtend(task)}
                            className="text-xs text-purple-700 border-purple-200 hover:bg-purple-50"
                          >
                            <PlusCircle className="w-3.5 h-3.5 mr-1" /> Extend
                          </Button>
                        )}

                        {/* Student / Actor Submit Button */}
                        {task.status === 'PENDING' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleOpenSubmit(task)}
                            className="text-xs shadow-sm bg-indigo-600 hover:bg-indigo-700"
                          >
                            <Send className="w-3.5 h-3.5 mr-1" /> Submit Work
                          </Button>
                        )}

                        {/* AI Evidence Insights Button */}
                        {(task.status === 'SUBMITTED' || task.status === 'APPROVED') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenTaskAI(task)}
                            className="text-xs text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                          >
                            <Brain className="w-3.5 h-3.5 mr-1 text-indigo-600" /> AI Insights
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* SUBMISSION MODAL */}
      {submittingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-base">Submit Milestone Deliverable</h3>
              </div>
              <button
                onClick={() => setSubmittingTask(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitTask} className="p-6 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Milestone</p>
                <h4 className="text-sm font-bold text-slate-900 mt-0.5">{submittingTask.title}</h4>
                <p className="text-xs text-slate-500 mt-1">Stage: {submittingTask.stage}</p>
              </div>

              {/* Lateness Warning */}
              {isPastDue(submittingTask) && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Late Submission Advisory:</strong> Current deadline (
                    {new Date(submittingTask.currentDueDate).toLocaleString()}) has passed.
                    Your submission will be recorded with a <code>LATE</code> flag according to the
                    template's late policy: <em>{submittingTask.latePolicy}</em>.
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Submission Notes / Artifact Links <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={submissionComments}
                  onChange={(e) => setSubmissionComments(e.target.value)}
                  placeholder="Provide milestone details, GitHub repo link, Google Drive link, or written report summary..."
                  className="w-full text-sm rounded-xl border border-slate-200 p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setSubmittingTask(null)}
                  disabled={submissionSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={submissionSubmitting}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {submissionSubmitting ? 'Recording Submission...' : 'Confirm Submission'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXTENSION GRANT MODAL */}
      {extendingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-slate-800 text-base">Grant Deadline Extension</h3>
              </div>
              <button
                onClick={() => setExtendingTask(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGrantExtension} className="p-6 space-y-4">
              <div className="p-3 bg-purple-50/50 border border-purple-100 rounded-xl text-xs text-purple-900 space-y-1">
                <div><strong>Task:</strong> {extendingTask.title}</div>
                <div>
                  <strong>Current Deadline:</strong>{' '}
                  {new Date(extendingTask.currentDueDate).toLocaleString()}
                </div>
                <div>
                  <strong>Original Baseline:</strong>{' '}
                  {new Date(extendingTask.originalDueDate).toLocaleString()}
                </div>
              </div>

              <FormInput
                label="New Extended Deadline"
                type="datetime-local"
                required
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Official Justification / Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={extensionReason}
                  onChange={(e) => setExtensionReason(e.target.value)}
                  placeholder="e.g. Medical leave approved by department HOD, university exam conflict, or project block..."
                  className="w-full text-sm rounded-xl border border-slate-200 p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setExtendingTask(null)}
                  disabled={extensionSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={extensionSubmitting}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {extensionSubmitting ? 'Recording Extension...' : 'Authorize Extension'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXTENSION HISTORY MODAL */}
      {historyTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-slate-700" />
                <h3 className="font-bold text-slate-800 text-base">Deadline Extension Audit Trail</h3>
              </div>
              <button
                onClick={() => setHistoryTask(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="border-b border-slate-100 pb-3">
                <h4 className="text-sm font-bold text-slate-900">{historyTask.title}</h4>
                <p className="text-xs text-slate-500">Original Baseline: {new Date(historyTask.originalDueDate).toLocaleString()}</p>
              </div>

              {historyTask.extensions && historyTask.extensions.length > 0 ? (
                <div className="space-y-3">
                  {historyTask.extensions.map((ext, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-purple-100 bg-purple-50/30 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-purple-900">
                          Extension #{idx + 1}
                        </span>
                        <span className="text-slate-400">
                          {new Date(ext.authorizedAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-slate-600">
                        <strong>Original:</strong> {new Date(ext.originalDeadline).toLocaleString()} →{' '}
                        <strong>Extended To:</strong> <span className="font-semibold text-slate-900">{new Date(ext.newDeadline).toLocaleString()}</span>
                      </div>
                      <div className="text-slate-700">
                        <strong>Reason:</strong> {ext.reason}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Authorized by: <code>{ext.authorizedUserName || ext.authorizedUserEmail || ext.authorizedUserId}</code>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">No extensions recorded for this task.</p>
              )}

              <div className="flex justify-end pt-3">
                <Button variant="outline" onClick={() => setHistoryTask(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PHASE 9: AI EVIDENCE INSIGHTS MODAL */}
      {selectedTaskAI && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-base">
                  AI Evidence Insights: {selectedTaskAI.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedTaskAI(null);
                  setTaskAIAnalysis(null);
                }}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <AIInsightsPanel
              analysis={taskAIAnalysis}
              loading={aiLoading}
              onRetry={handleRetryAI}
              isRetrying={isRetrying}
            />

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedTaskAI(null);
                  setTaskAIAnalysis(null);
                }}
              >
                Close Insights
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
