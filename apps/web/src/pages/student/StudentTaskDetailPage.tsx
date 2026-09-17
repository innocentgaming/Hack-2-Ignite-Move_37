import React, { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';
import { TaskItemDto, TaskStatus, SubmissionStatus } from '@internos/types';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import {
  ArrowLeft,
  Clock,
  AlertCircle,
  FileCheck,
  ArrowRight,
  Target,
  GitBranch,
  BookOpen,
  AlertTriangle,
  ExternalLink,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';

export const StudentTaskDetailPage: React.FC = () => {
  const { taskId, id } = useParams<{ taskId?: string; id?: string }>();
  const effectiveTaskId = taskId || id;

  if (effectiveTaskId === 'submit') {
    return <Navigate to="/app/student/tasks/submit" replace />;
  }

  const [task, setTask] = useState<TaskItemDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTask = async () => {
      if (!effectiveTaskId) return;
      try {
        setLoading(true);
        setError(null);
        const res = await apiClient.get<TaskItemDto>(`/api/v1/student/tasks/${effectiveTaskId}`);
        if (res.success && res.data) {
          setTask(res.data);
        } else {
          setError(res.error?.message || 'Task not found.');
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to connect to task service.');
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [effectiveTaskId]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl pb-12">
        <LoadingSkeleton count={3} />
      </div>
    );
  }

  // Section 28 & 2: Explicit 404 Task not found
  if (error || !task) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-3 max-w-md mx-auto my-12 shadow-xs">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h3 className="font-bold text-slate-900 text-lg">Task not found</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          {error || 'Unable to locate the specified task record in the database.'}
        </p>
        <div className="pt-3">
          <Link to="/app/student/tasks">
            <Button variant="primary" size="sm">
              Back to Assigned Tasks
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isAccepted =
    task.status === TaskStatus.APPROVED ||
    task.latestSubmission?.status === SubmissionStatus.ACCEPTED;

  const isSubmitted =
    task.status === TaskStatus.SUBMITTED ||
    task.latestSubmission?.status === SubmissionStatus.SUBMITTED ||
    task.latestSubmission?.status === SubmissionStatus.UNDER_REVIEW;

  const isNeedsRevision =
    task.status === TaskStatus.CHANGES_REQUESTED ||
    task.latestSubmission?.status === SubmissionStatus.REVISION_NEEDED;

  const isDraft = task.latestSubmission?.status === SubmissionStatus.DRAFT;
  const hasSubmission = !!task.latestSubmission;

  return (
    <div className="space-y-6 pb-16 max-w-4xl">
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

      {/* Task Header & Metadata Card */}
      <Card className="rounded-2xl border border-slate-200 p-6 bg-white space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={
                  isAccepted
                    ? 'emerald'
                    : isSubmitted
                    ? 'indigo'
                    : isNeedsRevision
                    ? 'rose'
                    : 'slate'
                }
                size="sm"
              >
                {isAccepted
                  ? 'COMPLETED'
                  : isSubmitted
                  ? 'SUBMITTED'
                  : isNeedsRevision
                  ? 'NEEDS REVISION'
                  : 'IN PROGRESS'}
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
                  Milestone: {task.milestoneTitle}
                </span>
              )}
            </div>

            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {task.title}
            </h1>
          </div>

          <div className="bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-right whitespace-nowrap self-start">
            <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">
              Due Date
            </span>
            <span className="font-mono text-slate-800 font-bold flex items-center justify-end gap-1 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              {task.dueDate}
            </span>
          </div>
        </div>

        {/* Section 3: Task Description, Learning Outcome, Expected Evidence, Mentor Instructions */}
        <div className="space-y-4 pt-4 border-t border-slate-100 text-xs">
          <div>
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-400 mb-1">
              Task Description
            </h4>
            <p className="text-slate-700 leading-relaxed text-sm">{task.description}</p>
          </div>

          {task.instructions && (
            <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-1">
              <h4 className="font-bold text-indigo-950 text-xs flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                Mentor Instructions
              </h4>
              <p className="text-indigo-900 leading-relaxed text-xs">{task.instructions}</p>
            </div>
          )}

          {/* Expected Evidence (Accreditation & Mentor Defined) */}
          <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1">
            <h4 className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              Expected Evidence (Accreditation / Mentor Defined)
            </h4>
            <p className="text-emerald-900 text-xs font-semibold">{task.expectedEvidence}</p>
          </div>

          {/* Learning Outcome */}
          {task.learningOutcomeCode && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-indigo-600" />
                Curriculum Learning Outcome (OBE):
              </span>
              <span className="font-bold text-indigo-600">
                {task.learningOutcomeCode} — {task.learningOutcomeName}
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* SECTION 27: BUTTON STATE MATRIX CARD */}

      {/* 1. NO SUBMISSION */}
      {!hasSubmission && (
        <Card className="rounded-2xl border border-indigo-200 p-6 bg-white space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">Ready to Submit Deliverable?</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload your repository links, pull request, or technical documents satisfying the expected evidence above.
              </p>
            </div>
            <Link to={`/app/student/tasks/${effectiveTaskId}/submit`}>
              <Button variant="primary" size="md" className="gap-2 text-xs shadow-xs whitespace-nowrap">
                <span>Submit Evidence</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* 2. DRAFT SUBMISSION */}
      {isDraft && (
        <Card className="rounded-2xl border border-amber-200 p-6 bg-amber-50/40 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="amber" size="sm">
                  DRAFT SAVED
                </Badge>
                <span className="text-xs font-bold text-amber-900">{task.latestSubmission?.title}</span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                You have an unsubmitted draft for this task. Continue editing to submit your evidence for mentor review.
              </p>
            </div>
            <Link to={`/app/student/tasks/${effectiveTaskId}/submit`}>
              <Button variant="primary" size="md" className="gap-2 text-xs shadow-xs whitespace-nowrap">
                <span>Continue Submission</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* 3. SUBMITTED / UNDER REVIEW */}
      {isSubmitted && !isNeedsRevision && !isAccepted && (
        <Card className="rounded-2xl border border-indigo-200 p-6 bg-indigo-50/40 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-indigo-950 text-base">
                  Evidence Submitted — Under Review
                </h3>
              </div>
              <p className="text-xs text-slate-600">
                Submission: <span className="font-semibold text-slate-800">{task.latestSubmission?.title}</span>
                {task.latestSubmission?.submittedAt && ` • Submitted on ${task.latestSubmission.submittedAt}`}
              </p>
            </div>
            <Link to={`/app/student/submissions/${task.latestSubmission?.id}`}>
              <Button variant="primary" size="md" className="gap-2 text-xs shadow-xs whitespace-nowrap">
                <span>View Submission</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* 4. NEEDS REVISION */}
      {isNeedsRevision && (
        <Card className="rounded-2xl border border-rose-300 p-6 bg-rose-50/60 space-y-4 shadow-xs">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-900 font-bold text-base">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span>Revisions Requested by Mentor</span>
              </div>
              <Badge variant="rose" size="sm">
                NEEDS REVISION
              </Badge>
            </div>

            {task.latestSubmission?.mentorFeedback && (
              <div className="p-3.5 bg-white rounded-xl border border-rose-200 text-xs space-y-1 text-slate-800">
                <span className="font-bold text-rose-900 block text-[11px]">Mentor Feedback:</span>
                <p className="leading-relaxed font-mono">"{task.latestSubmission.mentorFeedback}"</p>
              </div>
            )}
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-end gap-3">
            <Link to={`/app/student/submissions/${task.latestSubmission?.id}`}>
              <Button variant="outline" size="sm" className="text-xs">
                Review Feedback
              </Button>
            </Link>

            <Link to={`/app/student/tasks/${effectiveTaskId}/submit?resubmit=true`}>
              <Button variant="primary" size="sm" className="gap-1.5 text-xs shadow-xs">
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Resubmit Evidence</span>
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* 5. ACCEPTED / COMPLETED */}
      {isAccepted && (
        <Card className="rounded-2xl border border-emerald-200 p-6 bg-emerald-50/50 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-base">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                <span>✓ Evidence Accepted — Task Completed</span>
              </div>
              <p className="text-xs text-emerald-700 leading-relaxed">
                Your industry mentor reviewed and approved the technical evidence for this task.
                {task.latestSubmission?.title && ` (Deliverable: ${task.latestSubmission.title})`}
              </p>
            </div>

            {task.latestSubmission && (
              <Link to={`/app/student/submissions/${task.latestSubmission.id}`}>
                <Button variant="secondary" size="sm" className="gap-1.5 text-xs whitespace-nowrap">
                  <span>View Submission</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default StudentTaskDetailPage;
