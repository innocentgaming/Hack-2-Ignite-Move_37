import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardBody } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { apiClient } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import {
  InternshipDetailsDto,
  InternshipStatus,
  UserRole,
  CompletionChecklistDto,
  FinalEvaluationDto,
  CompletedInternshipDossierDto,
  EvaluationCriteriaScore,
} from '@internos/types';
import { normalizeRole } from '@internos/shared';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Award,
  ClipboardCheck,
  UserCheck,
  FileText,
  Building2,
  Calendar,
  Star,
  TrendingUp,
  Edit3,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Clock,
  Shield,
  AlertCircle,
  GraduationCap,
  Briefcase,
  ScrollText,
  BadgeCheck,
  XOctagon,
  Loader2,
} from 'lucide-react';

// ============================
// Types
// ============================

interface TerminationRequest {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reason: string;
  requestedAt: string;
}

// ============================
// Helper Components
// ============================

const GradeRing: React.FC<{ percentage: number; grade: string }> = ({ percentage, grade }) => {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percentage / 100) * circ;
  const color =
    percentage >= 90
      ? '#10b981'
      : percentage >= 70
      ? '#6366f1'
      : percentage >= 60
      ? '#f59e0b'
      : '#ef4444';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="128" height="128" className="-rotate-90">
        <circle cx="64" cy="64" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-black text-slate-800">{grade}</span>
        <span className="text-xs font-semibold text-slate-500">{percentage}%</span>
      </div>
    </div>
  );
};

const ChecklistItem: React.FC<{ label: string; passed: boolean; detail?: string }> = ({
  label,
  passed,
  detail,
}) => (
  <div
    className={`flex items-start gap-3 p-3 rounded-lg border ${
      passed
        ? 'bg-emerald-50 border-emerald-200'
        : 'bg-amber-50 border-amber-200'
    }`}
  >
    {passed ? (
      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
    ) : (
      <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
    )}
    <div>
      <p className={`text-sm font-medium ${passed ? 'text-emerald-800' : 'text-amber-800'}`}>
        {label}
      </p>
      {detail && <p className="text-xs mt-0.5 text-slate-500">{detail}</p>}
    </div>
  </div>
);

// ============================
// Default Rubric Criteria
// ============================
const DEFAULT_CRITERIA: Omit<EvaluationCriteriaScore, 'awardedMarks'>[] = [
  { id: 'crit-1', name: 'Technical Proficiency & Deliverables', maxMarks: 30 },
  { id: 'crit-2', name: 'Professionalism & Collaboration', maxMarks: 20 },
  { id: 'crit-3', name: 'Problem Solving & Innovation', maxMarks: 20 },
  { id: 'crit-4', name: 'Documentation & Reporting Quality', maxMarks: 15 },
  { id: 'crit-5', name: 'Learning Outcomes Achievement', maxMarks: 15 },
];

// ============================
// Main Component
// ============================

export const CompletionPage: React.FC = () => {
  const { user } = useAuth();
  const rawRole = user?.role || UserRole.STUDENT;
  const role = normalizeRole(rawRole);

  const isMentor = role === UserRole.MENTOR;
  const isFaculty = [UserRole.FACULTY, UserRole.HOD, UserRole.ADMIN].includes(role);
  const isStudent = role === UserRole.STUDENT;
  const isHodOrAdmin = [UserRole.HOD, UserRole.ADMIN].includes(role);

  // ── State ──
  const [internships, setInternships] = useState<InternshipDetailsDto[]>([]);
  const [selectedInternship, setSelectedInternship] = useState<InternshipDetailsDto | null>(null);
  const [checklist, setChecklist] = useState<CompletionChecklistDto | null>(null);
  const [finalEval, setFinalEval] = useState<FinalEvaluationDto | null>(null);
  const [dossier, setDossier] = useState<CompletedInternshipDossierDto | null>(null);

  const [loading, setLoading] = useState(true);
  const [checklistLoading, setChecklistLoading] = useState(false);
  const [evalLoading, setEvalLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ── Evaluation Modal ──
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [editingEvalId, setEditingEvalId] = useState<string | null>(null);
  const [criteria, setCriteria] = useState<EvaluationCriteriaScore[]>([]);
  const [evalComments, setEvalComments] = useState('');
  const [evalRemarks, setEvalRemarks] = useState('');

  // ── Faculty Confirmation Modal ──
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [facultyNotes, setFacultyNotes] = useState('');
  const [academicRecommendation, setAcademicRecommendation] = useState<
    'APPROVED_FOR_CREDITS' | 'SATISFACTORY' | 'COMMENDED'
  >('APPROVED_FOR_CREDITS');
  const [creditsAwarded, setCreditsAwarded] = useState(4);

  // ── Termination Modal ──
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [terminationReason, setTerminationReason] = useState('');
  const [terminationApproved, setTerminationApproved] = useState(true);

  // ── Cancellation Modal ──
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // ── Dossier expand toggle ──
  const [showTimeline, setShowTimeline] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  // ── Load internships ──
  useEffect(() => {
    const fetchInternships = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.get<InternshipDetailsDto[]>('/api/v1/internships');
        if (res.success && res.data) {
          const relevant = res.data.filter((i) =>
            [
              InternshipStatus.ACTIVE,
              InternshipStatus.READY_FOR_COMPLETION,
              InternshipStatus.COMPLETED,
              InternshipStatus.TERMINATED,
            ].includes(i.status as InternshipStatus)
          );
          setInternships(res.data);
          if (relevant.length > 0) {
            setSelectedInternship(relevant[0]);
          } else if (res.data.length > 0) {
            setSelectedInternship(res.data[0]);
          }
        }
      } catch {
        setError('Failed to load internships');
      } finally {
        setLoading(false);
      }
    };
    fetchInternships();
  }, []);

  // ── Load checklist + eval when internship changes ──
  const loadChecklistAndEval = useCallback(async (internshipId: string) => {
    setChecklistLoading(true);
    setFinalEval(null);
    setChecklist(null);
    setDossier(null);

    const [checkRes, evalRes] = await Promise.allSettled([
      apiClient.get<CompletionChecklistDto>(`/api/v1/completion/check/${internshipId}`),
      apiClient.get<FinalEvaluationDto>(`/api/v1/completion/evaluation/${internshipId}`),
    ]);

    if (checkRes.status === 'fulfilled' && checkRes.value.success) {
      setChecklist(checkRes.value.data || null);
    }
    if (evalRes.status === 'fulfilled' && evalRes.value.success) {
      setFinalEval(evalRes.value.data || null);
    }

    setChecklistLoading(false);
  }, []);

  const loadDossier = useCallback(async (internshipId: string) => {
    const res = await apiClient.get<CompletedInternshipDossierDto>(
      `/api/v1/completion/dossier/${internshipId}`
    );
    if (res.success && res.data) {
      setDossier(res.data);
    }
  }, []);

  useEffect(() => {
    if (!selectedInternship) return;
    loadChecklistAndEval(selectedInternship.id);
    if (selectedInternship.status === InternshipStatus.COMPLETED) {
      loadDossier(selectedInternship.id);
    }
  }, [selectedInternship, loadChecklistAndEval, loadDossier]);

  // ── Flash helpers ──
  const flash = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // ── Compute total for eval preview ──
  const totalAwarded = criteria.reduce((s, c) => s + (Number(c.awardedMarks) || 0), 0);
  const totalMax = criteria.reduce((s, c) => s + (Number(c.maxMarks) || 0), 0);
  const percentage = totalMax > 0 ? Math.round((totalAwarded / totalMax) * 100) : 0;

  // ── Open Evaluation Modal ──
  const openEvalModal = (existing?: FinalEvaluationDto) => {
    if (existing) {
      setEditingEvalId(existing.id);
      setCriteria(existing.criteria.map((c) => ({ ...c })));
      setEvalComments(existing.comments);
      setEvalRemarks(existing.finalRemarks);
    } else {
      setEditingEvalId(null);
      setCriteria(DEFAULT_CRITERIA.map((c) => ({ ...c, awardedMarks: 0 })));
      setEvalComments('');
      setEvalRemarks('');
    }
    setShowEvalModal(true);
  };

  // ── Submit / Update Evaluation ──
  const handleSubmitEval = async () => {
    if (!selectedInternship) return;
    setEvalLoading(true);
    setError(null);
    try {
      let res;
      if (editingEvalId) {
        res = await apiClient.put<FinalEvaluationDto>(
          `/api/v1/completion/evaluation/${editingEvalId}`,
          { criteria, comments: evalComments, finalRemarks: evalRemarks }
        );
      } else {
        res = await apiClient.post<FinalEvaluationDto>('/api/v1/completion/evaluation', {
          internshipId: selectedInternship.id,
          criteria,
          comments: evalComments,
          finalRemarks: evalRemarks,
        });
      }
      if (res.success && res.data) {
        setFinalEval(res.data);
        setShowEvalModal(false);
        flash(editingEvalId ? 'Evaluation updated successfully' : 'Final evaluation submitted!');
        await loadChecklistAndEval(selectedInternship.id);
      } else {
        setError(res.error?.message || 'Failed to submit evaluation');
      }
    } catch {
      setError('Failed to submit evaluation');
    } finally {
      setEvalLoading(false);
    }
  };

  // ── Faculty Confirm Completion ──
  const handleConfirmCompletion = async () => {
    if (!selectedInternship) return;
    setActionLoading(true);
    setError(null);
    try {
      const res = await apiClient.post<{ status: string }>('/api/v1/completion/confirm', {
        internshipId: selectedInternship.id,
        facultyNotes,
        academicRecommendation,
        creditsAwarded,
      });
      if (res.success) {
        setShowConfirmModal(false);
        flash('🎉 Internship marked as COMPLETED!');
        // Refresh internships list
        const refreshed = await apiClient.get<InternshipDetailsDto[]>('/api/v1/internships');
        if (refreshed.success && refreshed.data) {
          setInternships(refreshed.data);
          const updated = refreshed.data.find((i) => i.id === selectedInternship.id);
          if (updated) setSelectedInternship(updated);
        }
        await loadChecklistAndEval(selectedInternship.id);
        await loadDossier(selectedInternship.id);
      } else {
        setError(res.error?.message || 'Failed to confirm completion');
      }
    } catch {
      setError('Failed to confirm completion');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Mentor Termination Request ──
  const handleTerminationRequest = async () => {
    if (!selectedInternship) return;
    setActionLoading(true);
    setError(null);
    try {
      const res = await apiClient.post<TerminationRequest>('/api/v1/completion/termination-request', {
        internshipId: selectedInternship.id,
        reason: terminationReason,
      });
      if (res.success) {
        setShowTerminateModal(false);
        flash('Termination request submitted for institutional review');
      } else {
        setError(res.error?.message || 'Failed to submit termination request');
      }
    } catch {
      setError('Failed to submit termination request');
    } finally {
      setActionLoading(false);
    }
  };

  // ── HOD/Admin Termination Decision ──
  const handleTerminationDecision = async () => {
    if (!selectedInternship) return;
    setActionLoading(true);
    setError(null);
    try {
      const res = await apiClient.post<{ status: string }>('/api/v1/completion/terminate', {
        internshipId: selectedInternship.id,
        approved: terminationApproved,
        reason: terminationReason,
      });
      if (res.success) {
        setShowTerminateModal(false);
        flash(terminationApproved ? 'Internship terminated' : 'Termination request rejected');
        const refreshed = await apiClient.get<InternshipDetailsDto[]>('/api/v1/internships');
        if (refreshed.success && refreshed.data) {
          setInternships(refreshed.data);
          const updated = refreshed.data.find((i) => i.id === selectedInternship.id);
          if (updated) setSelectedInternship(updated);
        }
      } else {
        setError(res.error?.message || 'Failed');
      }
    } catch {
      setError('Failed to process termination');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Cancellation ──
  const handleCancellation = async () => {
    if (!selectedInternship) return;
    setActionLoading(true);
    setError(null);
    try {
      const res = await apiClient.post<{ status: string }>('/api/v1/completion/cancel', {
        internshipId: selectedInternship.id,
        reason: cancelReason,
      });
      if (res.success) {
        setShowCancelModal(false);
        flash('Internship cancelled successfully');
        const refreshed = await apiClient.get<InternshipDetailsDto[]>('/api/v1/internships');
        if (refreshed.success && refreshed.data) {
          setInternships(refreshed.data);
          const updated = refreshed.data.find((i) => i.id === selectedInternship.id);
          if (updated) setSelectedInternship(updated);
        }
      } else {
        setError(res.error?.message || 'Failed to cancel');
      }
    } catch {
      setError('Failed to cancel internship');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Status badge ──
  const statusBadge = (status: string) => {
    const map: Record<string, { variant: 'emerald' | 'indigo' | 'amber' | 'rose' | 'slate' | 'purple'; label: string }> = {
      COMPLETED: { variant: 'emerald', label: 'Completed' },
      READY_FOR_COMPLETION: { variant: 'indigo', label: 'Ready for Completion' },
      ACTIVE: { variant: 'indigo', label: 'Active' },
      TERMINATED: { variant: 'rose', label: 'Terminated' },
      CANCELLED: { variant: 'slate', label: 'Cancelled' },
      APPROVED: { variant: 'emerald', label: 'Approved' },
      PENDING_APPROVAL: { variant: 'amber', label: 'Pending Approval' },
      DRAFT: { variant: 'slate', label: 'Draft' },
      REJECTED: { variant: 'rose', label: 'Rejected' },
    };
    const cfg = map[status] || { variant: 'slate' as const, label: status };
    return <Badge variant={cfg.variant} dot>{cfg.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="flex gap-6 min-h-0">
      {/* ── Left Panel: Internship List ── */}
      <div className="w-80 flex-shrink-0">
        <div className="sticky top-0">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Internships
          </h2>
          <div className="space-y-2 max-h-[calc(100vh-10rem)] overflow-y-auto pr-1">
            {internships.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                No internships found
              </div>
            ) : (
              internships.map((i) => (
                <button
                  key={i.id}
                  onClick={() => setSelectedInternship(i)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    selectedInternship?.id === i.id
                      ? 'bg-indigo-50 border-indigo-300 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-800 truncate">{i.title}</p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{i.company?.name || i.companyId}</p>
                  <div className="mt-2">{statusBadge(i.status)}</div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Right Panel: Detail View ── */}
      <div className="flex-1 min-w-0 space-y-5">
        {/* Flash messages */}
        {successMsg && (
          <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" />
            {successMsg}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm font-medium">
            <AlertCircle className="w-4 h-4" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto text-rose-500 hover:text-rose-700">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {!selectedInternship ? (
          <Card>
            <CardBody>
              <div className="text-center py-12 text-slate-400">
                <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Select an internship to manage completion</p>
              </div>
            </CardBody>
          </Card>
        ) : (
          <>
            {/* ── Internship Header Card ── */}
            <Card>
              <CardBody>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-xl font-bold text-slate-900 truncate">
                        {selectedInternship.title}
                      </h1>
                      {statusBadge(selectedInternship.status)}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        {selectedInternship.company?.name || selectedInternship.companyId}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(selectedInternship.startDate).toLocaleDateString()} –{' '}
                        {new Date(selectedInternship.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                    {/* Mentor-only: termination request */}
                    {isMentor &&
                      [InternshipStatus.ACTIVE, InternshipStatus.APPROVED].includes(
                        selectedInternship.status as InternshipStatus
                      ) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setTerminationReason('');
                            setShowTerminateModal(true);
                          }}
                        >
                          <XOctagon className="w-4 h-4 mr-1 text-rose-500" />
                          Request Termination
                        </Button>
                      )}
                    {/* HOD/Admin: termination decision */}
                    {isHodOrAdmin &&
                      [InternshipStatus.ACTIVE, InternshipStatus.APPROVED].includes(
                        selectedInternship.status as InternshipStatus
                      ) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setTerminationReason('');
                            setTerminationApproved(true);
                            setShowTerminateModal(true);
                          }}
                        >
                          <Shield className="w-4 h-4 mr-1 text-slate-500" />
                          Terminate
                        </Button>
                      )}
                    {/* Cancellation */}
                    {(isStudent || isHodOrAdmin) &&
                      [
                        InternshipStatus.DRAFT,
                        InternshipStatus.PENDING_APPROVAL,
                        InternshipStatus.APPROVED,
                        InternshipStatus.ACTIVE,
                        InternshipStatus.READY_FOR_COMPLETION,
                      ].includes(selectedInternship.status as InternshipStatus) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setCancelReason('');
                            setShowCancelModal(true);
                          }}
                        >
                          <XCircle className="w-4 h-4 mr-1 text-slate-400" />
                          Cancel
                        </Button>
                      )}
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* ── Completion Checklist ── */}
            {selectedInternship.status !== InternshipStatus.COMPLETED && (
              <Card>
                <CardBody>
                  <div className="flex items-center gap-2 mb-4">
                    <ClipboardCheck className="w-5 h-5 text-indigo-600" />
                    <h2 className="font-semibold text-slate-800">Completion Prerequisites</h2>
                    {checklistLoading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
                  </div>

                  {checklist && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                        <ChecklistItem
                          label="Required Submissions"
                          passed={checklist.checks.requiredSubmissionsCompleted}
                          detail={`${checklist.details.requiredTasksSubmitted} / ${checklist.details.requiredTasksTotal} tasks submitted`}
                        />
                        <ChecklistItem
                          label="Required Reviews Completed"
                          passed={checklist.checks.requiredReviewsCompleted}
                          detail={
                            checklist.details.pendingReviewsTotal > 0
                              ? `${checklist.details.pendingReviewsTotal} pending`
                              : 'All reviewed'
                          }
                        />
                        <ChecklistItem
                          label="Final Mentor Evaluation"
                          passed={checklist.checks.finalEvaluationCompleted}
                          detail={checklist.checks.finalEvaluationCompleted ? 'Evaluation submitted' : 'Awaiting mentor evaluation'}
                        />
                        <ChecklistItem
                          label="Faculty Confirmation"
                          passed={checklist.checks.facultyConfirmationCompleted}
                          detail={checklist.checks.facultyConfirmationCompleted ? 'Confirmed' : 'Awaiting faculty sign-off'}
                        />
                      </div>

                      {checklist.missingConditions.length > 0 && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mt-2">
                          <p className="text-xs font-semibold text-amber-800 mb-1">Missing Conditions:</p>
                          <ul className="space-y-1">
                            {checklist.missingConditions.map((c, idx) => (
                              <li key={idx} className="text-xs text-amber-700 flex items-start gap-1.5">
                                <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                {c}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {checklist.eligible && (
                        <div className="mt-3 flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                          <BadgeCheck className="w-5 h-5 text-emerald-600" />
                          <span className="text-sm font-semibold text-emerald-800">
                            READY FOR COMPLETION — All prerequisites satisfied
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </CardBody>
              </Card>
            )}

            {/* ── Final Evaluation ── */}
            <Card>
              <CardBody>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    <h2 className="font-semibold text-slate-800">Final Evaluation</h2>
                    <Badge variant="slate" size="sm">/100</Badge>
                  </div>
                  {(isMentor || isFaculty) && selectedInternship.status !== InternshipStatus.COMPLETED && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEvalModal(finalEval || undefined)}
                    >
                      {finalEval ? (
                        <>
                          <Edit3 className="w-4 h-4 mr-1" />
                          Edit Evaluation
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-1" />
                          Submit Evaluation
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {finalEval ? (
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <GradeRing percentage={finalEval.percentage} grade={finalEval.finalGrade} />
                    <div className="flex-1 w-full">
                      <div className="space-y-2 mb-4">
                        {finalEval.criteria.map((c) => (
                          <div key={c.id} className="flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-slate-700 font-medium truncate">{c.name}</span>
                                <span className="text-slate-500 flex-shrink-0 ml-2">
                                  {c.awardedMarks}/{c.maxMarks}
                                </span>
                              </div>
                              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-indigo-500 rounded-full transition-all"
                                  style={{ width: `${(c.awardedMarks / c.maxMarks) * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-sm font-semibold text-slate-700 border-t border-slate-100 pt-2">
                        <span>Total Score</span>
                        <span className="text-indigo-700">
                          {finalEval.totalMarks} / {finalEval.maxMarks}
                        </span>
                      </div>
                      {finalEval.comments && (
                        <p className="text-xs text-slate-500 mt-3 italic">"{finalEval.comments}"</p>
                      )}
                      {finalEval.finalRemarks && (
                        <p className="text-xs text-slate-600 mt-1 font-medium">
                          Final Remarks: {finalEval.finalRemarks}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                        <span>Evaluator: <strong className="text-slate-600">{finalEval.evaluatorName}</strong></span>
                        <span>·</span>
                        <span>{new Date(finalEval.submittedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No final evaluation yet</p>
                    {(isMentor || isFaculty) && (
                      <p className="text-xs mt-1 text-indigo-500">Submit an evaluation to proceed toward completion</p>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>

            {/* ── Faculty Confirmation ── */}
            {isFaculty &&
              (selectedInternship.status === InternshipStatus.READY_FOR_COMPLETION ||
                selectedInternship.status === InternshipStatus.ACTIVE) && (
                <Card>
                  <CardBody>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-indigo-600" />
                        <h2 className="font-semibold text-slate-800">Faculty Confirmation</h2>
                      </div>
                      {checklist?.eligible && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setFacultyNotes('');
                            setAcademicRecommendation('APPROVED_FOR_CREDITS');
                            setCreditsAwarded(4);
                            setShowConfirmModal(true);
                          }}
                        >
                          <BadgeCheck className="w-4 h-4 mr-1" />
                          Confirm Completion
                        </Button>
                      )}
                    </div>
                    {!checklist?.eligible && (
                      <p className="text-sm text-slate-500 mt-2">
                        Complete all prerequisites before confirming internship completion.
                      </p>
                    )}
                    {checklist?.eligible && (
                      <p className="text-sm text-emerald-700 mt-2 font-medium">
                        ✓ All conditions met. You may now confirm and finalize this internship.
                      </p>
                    )}
                  </CardBody>
                </Card>
              )}

            {/* ── Completed Dossier ── */}
            {selectedInternship.status === InternshipStatus.COMPLETED && dossier && (
              <Card>
                <CardBody>
                  <div className="flex items-center gap-2 mb-4">
                    <ScrollText className="w-5 h-5 text-emerald-600" />
                    <h2 className="font-semibold text-slate-800">Completion Record</h2>
                    <Badge variant="emerald">Certified</Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
                    {/* Company */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Company</p>
                      <p className="text-sm font-bold text-slate-800">{dossier.company.name}</p>
                      <p className="text-xs text-slate-500">{dossier.company.industry}</p>
                      {dossier.company.website && (
                        <a
                          href={dossier.company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-indigo-600 hover:underline"
                        >
                          {dossier.company.website}
                        </a>
                      )}
                    </div>
                    {/* Role & Dates */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Role & Duration</p>
                      <p className="text-sm font-bold text-slate-800">{dossier.role}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(dossier.dates.startDate).toLocaleDateString()} –{' '}
                        {new Date(dossier.dates.endDate).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-emerald-600 mt-1">
                        Completed: {new Date(dossier.dates.completedAt).toLocaleDateString()}
                      </p>
                    </div>
                    {/* Faculty Confirmation */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Academic Confirmation</p>
                      <p className="text-sm font-bold text-slate-800">
                        {dossier.facultyConfirmation.academicRecommendation.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {dossier.facultyConfirmation.creditsAwarded} credits awarded
                      </p>
                      <p className="text-xs text-slate-600 mt-1 italic">
                        "{dossier.facultyConfirmation.facultyNotes}"
                      </p>
                    </div>
                  </div>

                  {/* Outcomes */}
                  {dossier.outcomes && dossier.outcomes.length > 0 && (
                    <div className="mb-5">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Outcomes</p>
                      <div className="space-y-2">
                        {dossier.outcomes.map((o, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-sm">
                            <Star className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <span className="font-medium text-slate-700">{o.title}</span>
                              {o.description && (
                                <p className="text-xs text-slate-500">{o.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Evidence Files */}
                  {dossier.evidenceFiles && dossier.evidenceFiles.length > 0 && (
                    <div className="mb-5">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Evidence Files</p>
                      <div className="flex flex-wrap gap-2">
                        {dossier.evidenceFiles.map((f) => (
                          <a
                            key={f.id}
                            href={f.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-700 hover:bg-indigo-100 transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            {f.originalName}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Milestone Feedback collapsible */}
                  {dossier.milestoneFeedback && dossier.milestoneFeedback.length > 0 && (
                    <div className="mb-5">
                      <button
                        className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
                        onClick={() => setShowFeedback((v) => !v)}
                      >
                        <UserCheck className="w-4 h-4 text-indigo-500" />
                        Mentor Feedback ({dossier.milestoneFeedback.length} reviews)
                        {showFeedback ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      {showFeedback && (
                        <div className="mt-3 space-y-2">
                          {dossier.milestoneFeedback.map((r) => (
                            <div
                              key={r.id}
                              className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-slate-700">{r.reviewerName}</span>
                                {r.score !== undefined && r.score !== null && (
                                  <Badge variant="indigo" size="sm">{r.score}/100</Badge>
                                )}
                              </div>
                              <p className="text-xs text-slate-500">{r.feedback}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Timeline collapsible */}
                  {dossier.timeline && dossier.timeline.length > 0 && (
                    <div>
                      <button
                        className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
                        onClick={() => setShowTimeline((v) => !v)}
                      >
                        <Clock className="w-4 h-4 text-slate-400" />
                        Timeline ({dossier.timeline.length} events)
                        {showTimeline ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      {showTimeline && (
                        <div className="mt-4 relative pl-5">
                          <div className="absolute left-2 top-0 bottom-0 w-px bg-slate-200" />
                          {dossier.timeline.map((event, idx) => (
                            <div key={idx} className="relative mb-4">
                              <div
                                className={`absolute -left-3.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                                  event.severity === 'success'
                                    ? 'bg-emerald-500'
                                    : event.severity === 'critical'
                                    ? 'bg-rose-500'
                                    : event.severity === 'warning'
                                    ? 'bg-amber-500'
                                    : 'bg-indigo-400'
                                }`}
                              />
                              <div className="ml-2">
                                <p className="text-sm font-medium text-slate-800">{event.title}</p>
                                <p className="text-xs text-slate-500">{event.description}</p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  {event.actorName} · {new Date(event.timestamp).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardBody>
              </Card>
            )}
          </>
        )}
      </div>

      {/* ========================================
          MODALS
         ======================================== */}

      {/* ── Final Evaluation Modal ── */}
      <Modal
        isOpen={showEvalModal}
        onClose={() => setShowEvalModal(false)}
        title={editingEvalId ? 'Edit Final Evaluation' : 'Submit Final Evaluation'}
        description="Score the intern across configurable rubric criteria (total /100)"
        size="xl"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setShowEvalModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmitEval}
              disabled={evalLoading}
            >
              {evalLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-1" />Saving…</>
              ) : editingEvalId ? (
                'Update Evaluation'
              ) : (
                'Submit Evaluation'
              )}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Live score preview */}
          <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
            <div>
              <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wider">Live Score</p>
              <p className="text-2xl font-black text-indigo-800">{totalAwarded} / {totalMax}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-indigo-600 font-semibold">Percentage</p>
              <p className="text-xl font-bold text-indigo-700">{percentage}%</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-indigo-600 font-semibold">Grade</p>
              <p className="text-xl font-bold text-indigo-700">
                {percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B' : percentage >= 60 ? 'C' : 'F'}
              </p>
            </div>
          </div>

          {/* Criteria */}
          <div className="space-y-3">
            {criteria.map((c, idx) => (
              <div key={c.id} className="p-3 border border-slate-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <input
                    className="flex-1 text-sm font-medium text-slate-800 bg-transparent border-none outline-none focus:ring-0 min-w-0"
                    value={c.name}
                    onChange={(e) =>
                      setCriteria((prev) =>
                        prev.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x))
                      )
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setCriteria((prev) => prev.filter((_, i) => i !== idx))}
                    className="ml-2 text-slate-300 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span>Awarded</span>
                      <span>Max</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={c.maxMarks}
                        value={c.awardedMarks}
                        onChange={(e) =>
                          setCriteria((prev) =>
                            prev.map((x, i) =>
                              i === idx ? { ...x, awardedMarks: Number(e.target.value) } : x
                            )
                          )
                        }
                        className="w-20 px-2 py-1 border border-slate-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="text-slate-400">/</span>
                      <input
                        type="number"
                        min={1}
                        value={c.maxMarks}
                        onChange={(e) =>
                          setCriteria((prev) =>
                            prev.map((x, i) =>
                              i === idx ? { ...x, maxMarks: Number(e.target.value) } : x
                            )
                          )
                        }
                        className="w-20 px-2 py-1 border border-slate-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (c.awardedMarks / Math.max(1, c.maxMarks)) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
                {c.comment !== undefined && (
                  <input
                    type="text"
                    placeholder="Criterion comment (optional)"
                    value={c.comment || ''}
                    onChange={(e) =>
                      setCriteria((prev) =>
                        prev.map((x, i) => (i === idx ? { ...x, comment: e.target.value } : x))
                      )
                    }
                    className="mt-2 w-full px-2 py-1 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400 text-slate-600"
                  />
                )}
              </div>
            ))}
          </div>

          {/* Add Criterion */}
          <button
            type="button"
            onClick={() =>
              setCriteria((prev) => [
                ...prev,
                {
                  id: `crit-${Date.now()}`,
                  name: 'New Criterion',
                  maxMarks: 10,
                  awardedMarks: 0,
                },
              ])
            }
            className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Criterion
          </button>

          {/* Comments */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Overall Comments</label>
            <textarea
              rows={3}
              value={evalComments}
              onChange={(e) => setEvalComments(e.target.value)}
              placeholder="Summarise performance, achievements, and areas of growth…"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Final Remarks</label>
            <textarea
              rows={2}
              value={evalRemarks}
              onChange={(e) => setEvalRemarks(e.target.value)}
              placeholder="Final remarks and recommendation…"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </Modal>

      {/* ── Faculty Confirmation Modal ── */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Internship Completion"
        description="Faculty academic sign-off. This action will transition the internship to COMPLETED."
        size="md"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setShowConfirmModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmCompletion}
              disabled={actionLoading || !facultyNotes.trim()}
            >
              {actionLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-1" />Confirming…</>
              ) : (
                <><BadgeCheck className="w-4 h-4 mr-1" />Confirm & Complete</>
              )}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Academic Notes <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              value={facultyNotes}
              onChange={(e) => setFacultyNotes(e.target.value)}
              placeholder="Document your academic review and confirmation notes…"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Academic Recommendation
            </label>
            <select
              value={academicRecommendation}
              onChange={(e) => setAcademicRecommendation(e.target.value as typeof academicRecommendation)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="APPROVED_FOR_CREDITS">Approved for Credits</option>
              <option value="SATISFACTORY">Satisfactory</option>
              <option value="COMMENDED">Commended</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Credits Awarded</label>
            <input
              type="number"
              min={0}
              max={20}
              value={creditsAwarded}
              onChange={(e) => setCreditsAwarded(Number(e.target.value))}
              className="w-24 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </Modal>

      {/* ── Termination Modal ── */}
      <Modal
        isOpen={showTerminateModal}
        onClose={() => setShowTerminateModal(false)}
        title={isMentor ? 'Request Termination' : 'Process Termination'}
        description={
          isMentor
            ? 'Submit a termination request for institutional review.'
            : 'Approve or reject the internship termination request.'
        }
        size="md"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setShowTerminateModal(false)}>
              Cancel
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-rose-300 text-rose-700 hover:bg-rose-50"
              onClick={isMentor ? handleTerminationRequest : handleTerminationDecision}
              disabled={actionLoading || !terminationReason.trim()}
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <XOctagon className="w-4 h-4 mr-1" />
              )}
              {isMentor
                ? 'Submit Request'
                : terminationApproved
                ? 'Approve Termination'
                : 'Reject Request'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {isHodOrAdmin && (
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={terminationApproved}
                  onChange={() => setTerminationApproved(true)}
                  className="accent-rose-600"
                />
                <span className="text-sm font-medium text-slate-700">Approve termination</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={!terminationApproved}
                  onChange={() => setTerminationApproved(false)}
                  className="accent-slate-600"
                />
                <span className="text-sm font-medium text-slate-700">Reject request</span>
              </label>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Justification <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              value={terminationReason}
              onChange={(e) => setTerminationReason(e.target.value)}
              placeholder="Provide a detailed, documented reason for this action…"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              {isMentor
                ? 'This request will be reviewed by an institutional authority (HOD or Admin) before taking effect.'
                : 'This action will permanently affect the internship status and is recorded in the audit trail.'}
            </p>
          </div>
        </div>
      </Modal>

      {/* ── Cancellation Modal ── */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Internship"
        description="This action will cancel the internship. Provide a documented reason."
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setShowCancelModal(false)}>
              Back
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-slate-400 text-slate-700 hover:bg-slate-100"
              onClick={handleCancellation}
              disabled={actionLoading || !cancelReason.trim()}
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <XCircle className="w-4 h-4 mr-1" />
              )}
              Confirm Cancellation
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Explain the reason for cancellation…"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
