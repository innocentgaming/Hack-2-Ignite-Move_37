import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '../Card';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { apiClient } from '../../services/apiClient';
import {
  MentorWorkspaceDto,
  SubmissionDto,
  ReviewDto,
  OutcomeStatus,
  InternshipDetailsDto,
  ExpectedOutcomeDto,
} from '@internos/types';
import {
  Award,
  Users,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Target,
  Edit,
  Plus,
  UserX,
  ExternalLink,
} from 'lucide-react';

export const MentorWorkspace: React.FC = () => {
  const [data, setData] = useState<MentorWorkspaceDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Review Modal State
  const [reviewSubmission, setReviewSubmission] = useState<SubmissionDto | null>(null);
  const [reviewScore, setReviewScore] = useState<number>(85);
  const [reviewFeedback, setReviewFeedback] = useState<string>('');
  const [requestRevision, setRequestRevision] = useState<boolean>(false);
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);

  // Outcome Modification Modal State
  const [selectedInternshipForOutcomes, setSelectedInternshipForOutcomes] = useState<InternshipDetailsDto | null>(null);
  const [editingOutcomes, setEditingOutcomes] = useState<ExpectedOutcomeDto[]>([]);
  const [changeReason, setChangeReason] = useState<string>('');
  const [submittingOutcomes, setSubmittingOutcomes] = useState<boolean>(false);

  // Concern Modal State
  const [concernInternship, setConcernInternship] = useState<InternshipDetailsDto | null>(null);
  const [concernReason, setConcernReason] = useState<string>('');
  const [concernSeverity, setConcernSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('HIGH');
  const [submittingConcern, setSubmittingConcern] = useState<boolean>(false);

  // Termination Modal State
  const [terminationInternship, setTerminationInternship] = useState<InternshipDetailsDto | null>(null);
  const [terminationReason, setTerminationReason] = useState<string>('');
  const [submittingTermination, setSubmittingTermination] = useState<boolean>(false);

  // Final Evaluation Modal State
  const [evalInternship, setEvalInternship] = useState<InternshipDetailsDto | null>(null);
  const [evalOverall, setEvalOverall] = useState<number>(90);
  const [evalTechnical, setEvalTechnical] = useState<number>(92);
  const [evalSoftSkills, setEvalSoftSkills] = useState<number>(88);
  const [evalRecommendation, setEvalRecommendation] = useState<string>('STRONG_HIRE');
  const [evalComments, setEvalComments] = useState<string>('');
  const [submittingEval, setSubmittingEval] = useState<boolean>(false);

  const fetchWorkspace = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get<MentorWorkspaceDto>('/api/v1/workspaces/mentor/dashboard');
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.error?.message || 'Failed to load mentor workspace');
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

  // Submit Review Handler
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewSubmission) return;

    setSubmittingReview(true);
    try {
      const res = await apiClient.post<ReviewDto>('/api/v1/workspaces/reviews', {
        submissionId: reviewSubmission.id,
        score: reviewScore,
        feedback: reviewFeedback.trim(),
        requestRevision,
      });

      if (res.success) {
        setSuccessMessage(
          requestRevision
            ? 'Revision requested from student with comments.'
            : 'Deliverable reviewed and accepted successfully!'
        );
        setReviewSubmission(null);
        setReviewFeedback('');
        setRequestRevision(false);
        await fetchWorkspace();
      } else {
        setError(res.error?.message || 'Failed to submit review');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Review error');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Modify Outcomes Handler
  const handleOutcomeSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInternshipForOutcomes) return;

    setSubmittingOutcomes(true);
    try {
      const res = await apiClient.put(
        `/api/v1/workspaces/internships/${selectedInternshipForOutcomes.id}/outcomes`,
        {
          outcomes: editingOutcomes,
          changeReason: changeReason.trim() || 'Mentor modified expected outcomes contract',
        }
      );

      if (res.success) {
        setSuccessMessage('Expected outcomes modified and new immutable version recorded!');
        setSelectedInternshipForOutcomes(null);
        setChangeReason('');
        await fetchWorkspace();
      } else {
        setError(res.error?.message || 'Failed to update outcomes');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Outcomes update error');
    } finally {
      setSubmittingOutcomes(false);
    }
  };

  // Raise Concern Handler
  const handleConcernSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concernInternship) return;

    setSubmittingConcern(true);
    try {
      const res = await apiClient.post(
        `/api/v1/workspaces/internships/${concernInternship.id}/concerns`,
        {
          internshipId: concernInternship.id,
          reason: concernReason.trim(),
          severity: concernSeverity,
        }
      );

      if (res.success) {
        setSuccessMessage('Concern officially recorded and escalated to faculty supervisor!');
        setConcernInternship(null);
        setConcernReason('');
        await fetchWorkspace();
      } else {
        setError(res.error?.message || 'Failed to raise concern');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Concern error');
    } finally {
      setSubmittingConcern(false);
    }
  };

  // Request Termination Handler
  const handleTerminationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminationInternship) return;

    setSubmittingTermination(true);
    try {
      const res = await apiClient.post(
        `/api/v1/workspaces/internships/${terminationInternship.id}/termination-request`,
        {
          reason: terminationReason.trim(),
        }
      );

      if (res.success) {
        setSuccessMessage('Termination request logged and flagged critical for HOD action!');
        setTerminationInternship(null);
        setTerminationReason('');
        await fetchWorkspace();
      } else {
        setError(res.error?.message || 'Failed to request termination');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Termination error');
    } finally {
      setSubmittingTermination(false);
    }
  };

  // Submit Final Evaluation Handler
  const handleEvalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evalInternship) return;

    setSubmittingEval(true);
    try {
      const res = await apiClient.post(
        `/api/v1/workspaces/internships/${evalInternship.id}/evaluations`,
        {
          rubricScores: {
            overall: evalOverall,
            technical: evalTechnical,
            softSkills: evalSoftSkills,
          },
          finalGrade: evalRecommendation,
          comments: evalComments.trim(),
        }
      );

      if (res.success) {
        setSuccessMessage('Final internship evaluation and performance rubric submitted!');
        setEvalInternship(null);
        setEvalComments('');
        await fetchWorkspace();
      } else {
        setError(res.error?.message || 'Failed to submit evaluation');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Evaluation error');
    } finally {
      setSubmittingEval(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium text-slate-500">Loading industry mentor workspace...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800">
        <p className="font-semibold text-base mb-1">Mentor Workspace Unavailable</p>
        <p className="text-sm text-rose-600 mb-4">{error || 'Unable to access mentor records.'}</p>
        <Button size="sm" variant="outline" onClick={fetchWorkspace}>
          Retry
        </Button>
      </div>
    );
  }

  const { assignedStudents, assignedInternships, pendingReviews, recentSubmissions, activeConcerns } = data;

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hoverable>
          <CardBody className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase">Assigned Interns</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{assignedStudents.length}</div>
              <p className="text-[11px] text-slate-500 mt-0.5">Corporate mentees</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </CardBody>
        </Card>

        <Card hoverable>
          <CardBody className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-indigo-600 uppercase">Pending Reviews</span>
              <div className="text-2xl font-black text-indigo-600 mt-1">{pendingReviews.length}</div>
              <p className="text-[11px] text-slate-500 mt-0.5">Submissions awaiting feedback</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <FileCheck className="w-5 h-5" />
            </div>
          </CardBody>
        </Card>

        <Card hoverable>
          <CardBody className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-700 uppercase">Total Submissions</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">{recentSubmissions.length}</div>
              <p className="text-[11px] text-emerald-700 mt-0.5">Received to date</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardBody>
        </Card>

        <Card hoverable className={activeConcerns.length > 0 ? 'border-amber-300 bg-amber-50/20' : ''}>
          <CardBody className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-amber-700 uppercase">Active Concerns</span>
              <div className="text-2xl font-black text-amber-600 mt-1">{activeConcerns.length}</div>
              <p className="text-[11px] text-amber-600 mt-0.5">Reported to faculty</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardBody>
        </Card>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {successMessage}
          </span>
          <Button size="sm" variant="outline" onClick={() => setSuccessMessage(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Pending Reviews Queue */}
      <Card>
        <CardHeader
          title="Pending Submissions Review Queue"
          subtitle="Review student deliverables, provide qualitative remarks, rating (0-100), or request revisions."
        />
        <CardBody className="p-0">
          {pendingReviews.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No pending reviews in your queue! All student deliverables are caught up.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingReviews.map((sub) => (
                <div key={sub.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors">
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{sub.title}</span>
                      <Badge variant="indigo" size="sm">
                        {sub.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-700">{sub.content}</p>
                    <div className="flex items-center gap-4 text-[11px] text-slate-400">
                      <span>Submitted: {new Date(sub.submittedAt).toLocaleDateString()}</span>
                      {sub.documentUrl && (
                        <a
                          href={sub.documentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 hover:text-indigo-800 underline flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View Attachment
                        </a>
                      )}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="primary"
                    className="self-start md:self-auto flex items-center gap-1.5"
                    onClick={() => {
                      setReviewSubmission(sub);
                      setReviewScore(85);
                      setReviewFeedback('');
                      setRequestRevision(false);
                    }}
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    Audit & Review
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Assigned Internships & Outcome Management Section */}
      <Card>
        <CardHeader
          title="Assigned Mentees & Outcome Management"
          subtitle="Direct supervisor controls: adjust learning outcomes (with immutable version history), raise flags, or evaluate."
        />
        <CardBody className="p-0">
          <div className="divide-y divide-slate-100">
            {assignedInternships.map((intern) => (
              <div key={intern.id} className="p-5 space-y-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-base">{intern.title}</span>
                      <Badge variant={intern.status === 'ACTIVE' ? 'emerald' : 'slate'} size="sm">
                        {intern.status}
                      </Badge>
                      <Badge variant="purple" size="sm">
                        Outcome v{intern.outcomeVersion || 1}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Company: {intern.company?.name || 'Partner Host'} • Start: {new Date(intern.startDate).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Mentor Actions Toolbar */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs flex items-center gap-1"
                      onClick={() => {
                        setSelectedInternshipForOutcomes(intern);
                        setEditingOutcomes([...intern.expectedOutcomes]);
                      }}
                    >
                      <Edit className="w-3 h-3 text-indigo-600" />
                      Modify Outcomes
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs flex items-center gap-1 text-amber-700 border-amber-200 hover:bg-amber-50"
                      onClick={() => setConcernInternship(intern)}
                    >
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      Raise Concern
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs flex items-center gap-1"
                      onClick={() => setEvalInternship(intern)}
                    >
                      <Award className="w-3 h-3 text-indigo-600" />
                      Final Evaluation
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs flex items-center gap-1 text-rose-700 border-rose-200 hover:bg-rose-50"
                      onClick={() => setTerminationInternship(intern)}
                    >
                      <UserX className="w-3 h-3 text-rose-600" />
                      Request Termination
                    </Button>
                  </div>
                </div>

                {/* Outcomes mini-grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                  {intern.expectedOutcomes.map((o, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800">{o.title}</span>
                        <span className="text-[10px] text-slate-500 uppercase font-bold">{o.status || 'PLANNED'}</span>
                      </div>
                      <p className="text-slate-500 text-[11px] line-clamp-2">{o.expectedEvidence}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Review Modal */}
      {reviewSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Review Deliverable</h3>
                <p className="text-xs text-slate-500">Submission: {reviewSubmission.title}</p>
              </div>
              <button
                onClick={() => setReviewSubmission(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Evaluation Score (0 - 100)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={reviewScore}
                  onChange={(e) => setReviewScore(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Supervisor Feedback & Guidance</label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Provide technical critique, highlights, and improvements..."
                  value={reviewFeedback}
                  onChange={(e) => setReviewFeedback(e.target.value)}
                  required
                />
              </div>

              <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl flex items-center gap-3">
                <input
                  type="checkbox"
                  id="requestRevisionCheck"
                  checked={requestRevision}
                  onChange={(e) => setRequestRevision(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                />
                <label htmlFor="requestRevisionCheck" className="text-xs font-semibold text-amber-900 cursor-pointer">
                  Request Student Revision (Re-opens milestone task for resubmission)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <Button variant="outline" size="sm" type="button" onClick={() => setReviewSubmission(null)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={submittingReview}>
                  {submittingReview ? 'Submitting...' : 'Complete Review'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modify Outcomes Modal */}
      {selectedInternshipForOutcomes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-600" />
                  Modify Expected Outcomes
                </h3>
                <p className="text-xs text-slate-500">
                  Modifying outcomes creates a new immutable OutcomeVersion (v
                  {(selectedInternshipForOutcomes.outcomeVersion || 1) + 1}). Historical snapshots remain intact.
                </p>
              </div>
              <button
                onClick={() => setSelectedInternshipForOutcomes(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleOutcomeSave} className="space-y-4 overflow-y-auto flex-1 pr-1">
              <div className="space-y-3">
                {editingOutcomes.map((o, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        className="font-semibold text-xs border border-slate-300 rounded px-2 py-1 w-full bg-white"
                        value={o.title}
                        onChange={(e) => {
                          const updated = [...editingOutcomes];
                          updated[idx] = { ...updated[idx], title: e.target.value };
                          setEditingOutcomes(updated);
                        }}
                        placeholder="Outcome Title"
                        required
                      />

                      <select
                        className="text-xs border border-slate-300 rounded px-2 py-1 bg-white"
                        value={o.status || OutcomeStatus.PLANNED}
                        onChange={(e) => {
                          const updated = [...editingOutcomes];
                          updated[idx] = { ...updated[idx], status: e.target.value as OutcomeStatus };
                          setEditingOutcomes(updated);
                        }}
                      >
                        <option value={OutcomeStatus.PLANNED}>PLANNED</option>
                        <option value={OutcomeStatus.IN_PROGRESS}>IN_PROGRESS</option>
                        <option value={OutcomeStatus.MET}>MET</option>
                      </select>
                    </div>

                    <input
                      type="text"
                      className="text-xs border border-slate-300 rounded px-2 py-1 w-full bg-white text-slate-600"
                      value={o.expectedEvidence}
                      onChange={(e) => {
                        const updated = [...editingOutcomes];
                        updated[idx] = { ...updated[idx], expectedEvidence: e.target.value };
                        setEditingOutcomes(updated);
                      }}
                      placeholder="Expected Evidence Deliverable"
                      required
                    />
                  </div>
                ))}

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-full flex items-center justify-center gap-1.5 text-xs py-2"
                  onClick={() => {
                    setEditingOutcomes([
                      ...editingOutcomes,
                      {
                        id: `outcome-${Date.now().toString(36)}`,
                        title: 'New Technical Objective',
                        description: 'Detailed workplace milestone',
                        expectedEvidence: 'Code repository PR or demonstration',
                        status: OutcomeStatus.PLANNED,
                      },
                    ]);
                  }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Expected Outcome
                </Button>
              </div>

              <div className="space-y-1 pt-2">
                <label className="text-xs font-semibold text-slate-700">Reason for Contract Revision</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="e.g. Added distributed microservices to align with Q3 deliverable goals"
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setSelectedInternshipForOutcomes(null)}
                >
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={submittingOutcomes}>
                  {submittingOutcomes ? 'Saving Version...' : 'Save & Bump Outcome Version'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Raise Concern Modal */}
      {concernInternship && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  Raise Student Concern
                </h3>
                <p className="text-xs text-slate-500">Mentees: {concernInternship.title}</p>
              </div>
              <button
                onClick={() => setConcernInternship(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConcernSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Severity Level</label>
                <select
                  value={concernSeverity}
                  onChange={(e) => setConcernSeverity(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL')}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="LOW">LOW — Minor informational note</option>
                  <option value="MEDIUM">MEDIUM — Attendance or delivery warning</option>
                  <option value="HIGH">HIGH — Repeated non-performance</option>
                  <option value="CRITICAL">CRITICAL — Severe breach or disciplinary</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Explanation & Incidents</label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  placeholder="Detail missed standups, lack of communication, or technical roadblocks..."
                  value={concernReason}
                  onChange={(e) => setConcernReason(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <Button variant="outline" size="sm" type="button" onClick={() => setConcernInternship(null)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={submittingConcern}>
                  {submittingConcern ? 'Escalating...' : 'Record & Escalate'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request Termination Modal */}
      {terminationInternship && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-rose-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
              <div>
                <h3 className="font-bold text-rose-800 text-lg flex items-center gap-2">
                  <UserX className="w-5 h-5 text-rose-600" />
                  Request Internship Termination
                </h3>
                <p className="text-xs text-slate-500">Mentees: {terminationInternship.title}</p>
              </div>
              <button
                onClick={() => setTerminationInternship(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleTerminationSubmit} className="space-y-4">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                Notice: Formal termination requests escalate directly to the Head of Department (HOD) for official administrative review.
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Official Termination Justification</label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  placeholder="Specify prolonged non-response, breach of conduct, or unresolvable performance issues..."
                  value={terminationReason}
                  onChange={(e) => setTerminationReason(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <Button variant="outline" size="sm" type="button" onClick={() => setTerminationInternship(null)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={submittingTermination} className="bg-rose-600 hover:bg-rose-700">
                  {submittingTermination ? 'Transmitting...' : 'Submit Formal Request'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Final Evaluation Modal */}
      {evalInternship && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-600" />
                  Final Performance Evaluation
                </h3>
                <p className="text-xs text-slate-500">Student: {evalInternship.title}</p>
              </div>
              <button
                onClick={() => setEvalInternship(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEvalSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700">Overall (0-100)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={evalOverall}
                    onChange={(e) => setEvalOverall(Number(e.target.value))}
                    className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700">Technical (0-100)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={evalTechnical}
                    onChange={(e) => setEvalTechnical(Number(e.target.value))}
                    className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700">Soft Skills (0-100)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={evalSoftSkills}
                    onChange={(e) => setEvalSoftSkills(Number(e.target.value))}
                    className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Hiring / Completion Recommendation</label>
                <select
                  value={evalRecommendation}
                  onChange={(e) => setEvalRecommendation(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                >
                  <option value="STRONG_HIRE">STRONG HIRE — Exceeded expectations</option>
                  <option value="HIRE">HIRE — Met technical and professional benchmarks</option>
                  <option value="NEUTRAL">NEUTRAL — Satisfactory completion only</option>
                  <option value="NO_HIRE">DO NOT HIRE — Below workplace standards</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Qualitative Remarks & Strengths</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Outline key technical contributions, work ethic, and future areas of growth..."
                  value={evalComments}
                  onChange={(e) => setEvalComments(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <Button variant="outline" size="sm" type="button" onClick={() => setEvalInternship(null)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={submittingEval}>
                  {submittingEval ? 'Submitting...' : 'Submit Evaluation'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
