import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardBody } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { FormInput } from '../components/FormInput';
import { apiClient } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import {
  InternshipDetailsDto,
  InternshipStatus,
  UserRole,
  OutcomeVersionDto,
} from '@internos/types';
import { normalizeRole } from '@internos/shared';
import {
  Building2,
  Calendar,
  UserCheck,
  Target,
  Plus,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Briefcase,
  History,
  Lock,
  Send,
  UserPlus,
  RefreshCw,
  X,
} from 'lucide-react';

export const InternshipsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const rawRole = user?.role || UserRole.STUDENT;
  const role = normalizeRole(rawRole);
  const isStudent = role === UserRole.STUDENT;
  const isApprover = [UserRole.ADMIN, UserRole.MENTOR].includes(role);

  const [internships, setInternships] = useState<InternshipDetailsDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab state for approvers
  const [activeTab, setActiveTab] = useState<'queue' | 'all'>('queue');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Selected Internship for Review / Drawer
  const [selectedInternship, setSelectedInternship] = useState<InternshipDetailsDto | null>(null);

  // Modals
  const [rejectingInternship, setRejectingInternship] = useState<InternshipDetailsDto | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const [assigningFacultyInternship, setAssigningFacultyInternship] = useState<InternshipDetailsDto | null>(null);
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [selectedFacultyName, setSelectedFacultyName] = useState('');

  const [historyInternshipId, setHistoryInternshipId] = useState<string | null>(null);
  const [outcomeVersions, setOutcomeVersions] = useState<OutcomeVersionDto[]>([]);

  // Edit Dates Modal (for Student)
  const [editingDatesInternship, setEditingDatesInternship] = useState<InternshipDetailsDto | null>(null);
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');

  const [actionLoading, setActionLoading] = useState(false);

  const fetchInternships = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<InternshipDetailsDto[]>('/api/v1/internships');
      if (res.success && res.data) {
        setInternships(res.data);
        if (res.data.length > 0 && !selectedInternship) {
          setSelectedInternship(res.data[0]);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load internships');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInternships();
  }, []);

  const handleApprove = async (internship: InternshipDetailsDto) => {
    setActionLoading(true);
    try {
      const res = await apiClient.post<InternshipDetailsDto>(
        `/api/v1/internships/${internship.id}/approve`,
        { approved: true }
      );
      if (res.success && res.data) {
        setInternships((prev) =>
          prev.map((item) => (item.id === internship.id ? (res.data as InternshipDetailsDto) : item))
        );
        setSelectedInternship(res.data);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to approve internship');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingInternship || !rejectionReason.trim()) return;

    setActionLoading(true);
    try {
      const res = await apiClient.post<InternshipDetailsDto>(
        `/api/v1/internships/${rejectingInternship.id}/approve`,
        { approved: false, reason: rejectionReason.trim() }
      );
      if (res.success && res.data) {
        setInternships((prev) =>
          prev.map((item) => (item.id === rejectingInternship.id ? (res.data as InternshipDetailsDto) : item))
        );
        setSelectedInternship(res.data);
        setRejectingInternship(null);
        setRejectionReason('');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reject internship');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitForApproval = async (internship: InternshipDetailsDto) => {
    setActionLoading(true);
    try {
      const res = await apiClient.post<InternshipDetailsDto>(
        `/api/v1/internships/${internship.id}/submit`,
        {}
      );
      if (res.success && res.data) {
        setInternships((prev) =>
          prev.map((item) => (item.id === internship.id ? (res.data as InternshipDetailsDto) : item))
        );
        setSelectedInternship(res.data);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to submit internship for approval');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveDates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDatesInternship) return;

    setActionLoading(true);
    try {
      const res = await apiClient.put<InternshipDetailsDto>(
        `/api/v1/internships/${editingDatesInternship.id}`,
        {
          startDate: new Date(editStartDate).toISOString(),
          endDate: new Date(editEndDate).toISOString(),
        }
      );
      if (res.success && res.data) {
        setInternships((prev) =>
          prev.map((item) => (item.id === editingDatesInternship.id ? (res.data as InternshipDetailsDto) : item))
        );
        setSelectedInternship(res.data);
        setEditingDatesInternship(null);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update dates');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningFacultyInternship || !selectedFacultyId) return;

    setActionLoading(true);
    try {
      const res = await apiClient.post<InternshipDetailsDto>(
        `/api/v1/internships/${assigningFacultyInternship.id}/assign-faculty`,
        {
          facultyId: selectedFacultyId,
          facultyName: selectedFacultyName.trim() || 'Assigned Faculty Coordinator',
        }
      );
      if (res.success && res.data) {
        setInternships((prev) =>
          prev.map((item) =>
            item.id === assigningFacultyInternship.id ? (res.data as InternshipDetailsDto) : item
          )
        );
        setSelectedInternship(res.data);
        setAssigningFacultyInternship(null);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to assign faculty coordinator');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewOutcomeHistory = async (internshipId: string) => {
    setHistoryInternshipId(internshipId);
    try {
      const res = await apiClient.get<OutcomeVersionDto[]>(
        `/api/v1/internships/${internshipId}/outcomes/versions`
      );
      if (res.success && res.data) {
        setOutcomeVersions(res.data);
      }
    } catch (err) {
      console.warn('Could not fetch outcome versions:', err);
    }
  };

  const pendingApprovals = internships.filter(
    (i) => i.status === InternshipStatus.PENDING_APPROVAL
  );

  const displayedInternships = isApprover
    ? activeTab === 'queue'
      ? pendingApprovals
      : statusFilter === 'ALL'
      ? internships
      : internships.filter((i) => i.status === statusFilter)
    : internships;

  // Stepper representation for state machine
  const STEPS: InternshipStatus[] = [
    InternshipStatus.DRAFT,
    InternshipStatus.PENDING_APPROVAL,
    InternshipStatus.APPROVED,
    InternshipStatus.ACTIVE,
    InternshipStatus.READY_FOR_COMPLETION,
    InternshipStatus.COMPLETED,
  ];

  const getStepIndex = (status: InternshipStatus) => {
    return STEPS.indexOf(status);
  };

  const isApprovedOrBeyond = (status: InternshipStatus) => {
    return [
      InternshipStatus.APPROVED,
      InternshipStatus.ACTIVE,
      InternshipStatus.READY_FOR_COMPLETION,
      InternshipStatus.COMPLETED,
    ].includes(status);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs tracking-wider uppercase mb-1">
            <Sparkles className="w-4 h-4" />
            Phase 4 • Internship Lifecycle & State Engine
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {isStudent ? 'My Academic Internship' : 'Institutional Internship Management'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isStudent
              ? 'Register host organizations, track discrete expected outcomes, and monitor approval milestones.'
              : 'Review pending registrations, assign faculty coordinators, and govern lifecycle state transitions.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchInternships} disabled={loading}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
          </Button>

          {isStudent && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/app/internships/new')}
              className="bg-indigo-600 hover:bg-indigo-700 shadow-sm"
            >
              <Plus className="w-4 h-4 mr-1" /> Register Internship
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* APPROVER VIEW: TABS */}
      {isApprover && (
        <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('queue')}
            className={`pb-2 px-1 text-sm font-bold flex items-center gap-2 transition-all relative ${
              activeTab === 'queue'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Approval Queue</span>
            {pendingApprovals.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white">
                {pendingApprovals.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-2 px-1 text-sm font-bold flex items-center gap-2 transition-all relative ${
              activeTab === 'all'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>All Internships ({internships.length})</span>
          </button>

          {activeTab === 'all' && (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs rounded-lg border border-slate-200 p-1.5 bg-white text-slate-700"
              >
                <option value="ALL">All Statuses</option>
                <option value="DRAFT">DRAFT</option>
                <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
                <option value="APPROVED">APPROVED</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="READY_FOR_COMPLETION">READY_FOR_COMPLETION</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      {loading ? (
        <Card>
          <CardBody className="py-12 text-center text-slate-400">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium">Loading internship registry...</p>
          </CardBody>
        </Card>
      ) : displayedInternships.length === 0 ? (
        <Card>
          <CardBody className="py-16 text-center text-slate-400">
            <Briefcase className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <h3 className="text-base font-semibold text-slate-700">No Internships Found</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto mt-1">
              {isStudent
                ? 'You have not registered an internship yet. Click Register Internship above to start.'
                : 'There are currently no internship submissions matching this filter.'}
            </p>
            {isStudent && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/app/internships/new')}
                className="mt-4 bg-indigo-600 hover:bg-indigo-700"
              >
                Register Internship Now
              </Button>
            )}
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: List of Internships */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {isStudent ? 'Your Cohort Internships' : 'Candidate Submissions'} ({displayedInternships.length})
            </div>

            {displayedInternships.map((intern) => {
              const isSelected = selectedInternship?.id === intern.id;
              return (
                <div
                  key={intern.id}
                  onClick={() => setSelectedInternship(intern)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/40 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-slate-900 block line-clamp-1">
                        {intern.title}
                      </span>
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{intern.company.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(intern.startDate).toLocaleDateString()} &rarr;{' '}
                        {new Date(intern.endDate).toLocaleDateString()}
                      </div>
                    </div>

                    <Badge
                      variant={
                        intern.status === InternshipStatus.COMPLETED
                          ? 'emerald'
                          : intern.status === InternshipStatus.ACTIVE
                          ? 'indigo'
                          : intern.status === InternshipStatus.APPROVED
                          ? 'purple'
                          : intern.status === InternshipStatus.PENDING_APPROVAL
                          ? 'amber'
                          : intern.status === InternshipStatus.REJECTED
                          ? 'rose'
                          : 'slate'
                      }
                    >
                      {intern.status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Deep Details & State Machine */}
          {selectedInternship && (
            <div className="lg:col-span-2 space-y-6">
              {/* STATE MACHINE STEPPER */}
              <Card className="shadow-sm border-t-4 border-t-indigo-600">
                <CardBody className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                        Lifecycle State Machine
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <h2 className="text-lg font-bold text-slate-900">{selectedInternship.status}</h2>
                        {selectedInternship.status === InternshipStatus.APPROVED && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                            Workflow Active
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick Action Button for Approver or Student */}
                    {isApprover && selectedInternship.status === InternshipStatus.PENDING_APPROVAL && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRejectingInternship(selectedInternship)}
                          disabled={actionLoading}
                          className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                        >
                          Reject
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleApprove(selectedInternship)}
                          disabled={actionLoading}
                          className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
                        </Button>
                      </div>
                    )}

                    {isStudent && selectedInternship.status === InternshipStatus.DRAFT && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleSubmitForApproval(selectedInternship)}
                        disabled={actionLoading}
                        className="text-xs bg-indigo-600 hover:bg-indigo-700"
                      >
                        <Send className="w-3.5 h-3.5 mr-1" /> Submit for Approval
                      </Button>
                    )}
                  </div>

                  {/* Rejection Advisory */}
                  {selectedInternship.status === InternshipStatus.REJECTED && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Registration Rejected:</strong> {selectedInternship.rejectionReason}
                        {isStudent && (
                          <div className="mt-1">
                            <button
                              onClick={() => {
                                // Transition back to draft
                                apiClient.post(`/api/v1/internships/${selectedInternship.id}/transition`, {
                                  targetStatus: InternshipStatus.DRAFT,
                                  reason: 'Student re-drafting registration',
                                }).then(() => fetchInternships());
                              }}
                              className="font-semibold underline text-rose-900"
                            >
                              Re-open registration as DRAFT to address feedback
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Linear Stepper */}
                  <div className="relative pt-2 pb-2">
                    <div className="hidden sm:flex items-center justify-between relative">
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 z-0" />
                      {STEPS.map((stepName, sIdx) => {
                        const currentIdx = getStepIndex(selectedInternship.status);
                        const isDone = sIdx <= currentIdx;
                        const isCurrent = sIdx === currentIdx;

                        return (
                          <div key={stepName} className="flex flex-col items-center z-10">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                isCurrent
                                  ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                                  : isDone
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-slate-200 text-slate-500'
                              }`}
                            >
                              {sIdx + 1}
                            </div>
                            <span
                              className={`text-[10px] font-semibold mt-1.5 uppercase tracking-wider text-center ${
                                isCurrent
                                  ? 'text-indigo-600 font-bold'
                                  : isDone
                                  ? 'text-slate-800'
                                  : 'text-slate-400'
                              }`}
                            >
                              {stepName.replace(/_/g, ' ')}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* DETAILS CARD */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Host Company Profile */}
                <Card className="shadow-sm">
                  <CardBody className="p-5 space-y-3">
                    <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs uppercase tracking-wider">
                      <Building2 className="w-4 h-4" /> Host Company
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{selectedInternship.company.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{selectedInternship.company.industry}</p>
                    </div>
                    {selectedInternship.company.website && (
                      <a
                        href={selectedInternship.company.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-indigo-600 hover:underline block"
                      >
                        {selectedInternship.company.website}
                      </a>
                    )}
                    {selectedInternship.company.address && (
                      <p className="text-xs text-slate-400">{selectedInternship.company.address}</p>
                    )}
                  </CardBody>
                </Card>

                {/* Timeline & Date Lock Rule */}
                <Card className="shadow-sm">
                  <CardBody className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs uppercase tracking-wider">
                        <Calendar className="w-4 h-4" /> Academic Timeline
                      </div>

                      {/* Date Edit Control */}
                      {isStudent && (
                        <div>
                          {isApprovedOrBeyond(selectedInternship.status) ? (
                            <span
                              title="Dates are immutable after approval"
                              className="text-[11px] text-slate-400 flex items-center gap-1 font-medium bg-slate-100 px-2 py-0.5 rounded"
                            >
                              <Lock className="w-3 h-3" /> Locked
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingDatesInternship(selectedInternship);
                                setEditStartDate(selectedInternship.startDate.slice(0, 10));
                                setEditEndDate(selectedInternship.endDate.slice(0, 10));
                              }}
                              className="text-xs text-indigo-600 hover:underline font-semibold"
                            >
                              Edit Dates
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs text-slate-500">
                        Start: <strong>{new Date(selectedInternship.startDate).toLocaleDateString()}</strong>
                      </div>
                      <div className="text-xs text-slate-500">
                        End: <strong>{new Date(selectedInternship.endDate).toLocaleDateString()}</strong>
                      </div>
                      <div className="text-xs text-slate-400 pt-1">
                        Track: <span className="font-semibold text-slate-700">{selectedInternship.type}</span>
                      </div>
                    </div>

                    {isApprovedOrBeyond(selectedInternship.status) && (
                      <div className="text-[11px] text-slate-400 italic">
                        Post-approval date immutability enforced.
                      </div>
                    )}
                  </CardBody>
                </Card>
              </div>

              {/* SUPERVISOR & MENTOR ASSIGNMENT ROW */}
              <Card className="shadow-sm">
                <CardBody className="p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs uppercase tracking-wider">
                      <UserCheck className="w-4 h-4" /> Supervisory Team & Coordination
                    </div>

                    {/* HOD Faculty Assignment button */}
                    {isApprover && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setAssigningFacultyInternship(selectedInternship);
                          setSelectedFacultyId(selectedInternship.facultyId || 'user-a-faculty');
                          setSelectedFacultyName(selectedInternship.facultyName || 'Dr. Ada Lovelace');
                        }}
                        className="text-xs"
                      >
                        <UserPlus className="w-3.5 h-3.5 mr-1" /> Assign Faculty
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Faculty Coordinator */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                      <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
                        Faculty Coordinator
                      </span>
                      <p className="text-sm font-semibold text-slate-900">
                        {selectedInternship.facultyName || 'Unassigned'}
                      </p>
                      <p className="text-slate-400">Institutional academic mentor</p>
                    </div>

                    {/* Industry Mentor */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                      <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
                        Industry Mentor
                      </span>
                      <p className="text-sm font-semibold text-slate-900">
                        {selectedInternship.mentor?.name || 'Unassigned'}
                      </p>
                      {selectedInternship.mentor && (
                        <p className="text-slate-500">
                          {selectedInternship.mentor.designation} • {selectedInternship.mentor.email}
                        </p>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* STRUCTURED EXPECTED OUTCOMES & VERSION HISTORY */}
              <Card className="shadow-sm">
                <CardBody className="p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-indigo-600" />
                      <h3 className="text-sm font-bold text-slate-800">
                        Structured Expected Outcomes ({selectedInternship.expectedOutcomes.length})
                      </h3>
                    </div>

                    <button
                      onClick={() => handleViewOutcomeHistory(selectedInternship.id)}
                      className="text-xs text-purple-700 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-colors"
                    >
                      <History className="w-3.5 h-3.5" /> Version History (v{selectedInternship.outcomeVersion})
                    </button>
                  </div>

                  <div className="space-y-3">
                    {selectedInternship.expectedOutcomes.map((outcome, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-slate-200 bg-white text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{outcome.title}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                            {outcome.status}
                          </span>
                        </div>
                        {outcome.description && (
                          <p className="text-slate-600">{outcome.description}</p>
                        )}
                        <div className="text-[11px] text-slate-400">
                          Expected Evidence: <strong className="text-slate-700">{outcome.expectedEvidence}</strong>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Navigation to Tasks */}
                  {selectedInternship.workflowInstanceId && (
                    <div className="pt-2 flex justify-end">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate('/app/tasks')}
                        className="text-xs bg-indigo-600 hover:bg-indigo-700"
                      >
                        View Assigned Workflow Tasks <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectingInternship && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-slate-800 text-base">Reject Internship Registration</h3>
              </div>
              <button
                onClick={() => setRejectingInternship(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReject} className="p-6 space-y-4">
              <p className="text-xs text-slate-500">
                Provide a clear academic justification or requirement amendment reason for{' '}
                <strong>{rejectingInternship.title}</strong>. The student will be notified and can
                re-open their registration in DRAFT.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Official Rejection Justification <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Host company is unverified; please attach company MoU or clarify industry mentor contact details..."
                  className="w-full text-sm rounded-xl border border-slate-200 p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setRejectingInternship(null)}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={actionLoading}
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                >
                  {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DATES MODAL (STUDENT PRE-APPROVAL) */}
      {editingDatesInternship && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-base">Modify Academic Dates</h3>
              </div>
              <button
                onClick={() => setEditingDatesInternship(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDates} className="p-6 space-y-4">
              <p className="text-xs text-slate-500">
                You can adjust start and end dates prior to institutional approval. Once approved,
                dates become immutable.
              </p>

              <FormInput
                label="Start Date"
                type="date"
                required
                value={editStartDate}
                onChange={(e) => setEditStartDate(e.target.value)}
              />

              <FormInput
                label="End Date"
                type="date"
                required
                value={editEndDate}
                onChange={(e) => setEditEndDate(e.target.value)}
              />

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setEditingDatesInternship(null)}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={actionLoading}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {actionLoading ? 'Saving...' : 'Save Dates'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN FACULTY MODAL (HOD) */}
      {assigningFacultyInternship && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-base">Assign Faculty Coordinator</h3>
              </div>
              <button
                onClick={() => setAssigningFacultyInternship(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignFaculty} className="p-6 space-y-4">
              <FormInput
                label="Faculty Coordinator Full Name"
                required
                value={selectedFacultyName}
                onChange={(e) => setSelectedFacultyName(e.target.value)}
              />

              <FormInput
                label="Faculty User ID / Employee Code"
                required
                value={selectedFacultyId}
                onChange={(e) => setSelectedFacultyId(e.target.value)}
              />

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setAssigningFacultyInternship(null)}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={actionLoading}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {actionLoading ? 'Assigning...' : 'Confirm Assignment'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OUTCOME VERSION HISTORY MODAL */}
      {historyInternshipId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-slate-800 text-base">Outcome Version History</h3>
              </div>
              <button
                onClick={() => setHistoryInternshipId(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {outcomeVersions.map((v) => (
                <div
                  key={v.id}
                  className="p-4 rounded-xl border border-purple-100 bg-purple-50/20 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-900">
                      Outcome Version {v.versionNumber}
                    </span>
                    <span className="text-slate-400">
                      {new Date(v.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="space-y-1.5 pt-1">
                    {v.outcomes.map((o, oIdx) => (
                      <div key={oIdx} className="p-2 rounded bg-white border border-slate-100">
                        <strong className="text-slate-800">{o.title}</strong>
                        <p className="text-slate-500 text-[11px]">{o.expectedEvidence}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex justify-end pt-3">
                <Button variant="outline" onClick={() => setHistoryInternshipId(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
