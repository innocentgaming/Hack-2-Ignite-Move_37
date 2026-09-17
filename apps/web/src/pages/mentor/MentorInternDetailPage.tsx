import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';
import { MentorInternDetailDto } from '@internos/types';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import {
  Users,
  Briefcase,
  GitBranch,
  CheckSquare,
  FileCheck,
  Target,
  MessageSquare,
  FolderArchive,
  ArrowLeft,
  ExternalLink,
  Star,
  CheckCircle2,
  RotateCcw,
  FileText,
} from 'lucide-react';

export const MentorInternDetailPage: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const [data, setData] = useState<MentorInternDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'milestones' | 'tasks' | 'submissions' | 'outcomes' | 'feedback' | 'documents'
  >('overview');

  // Review modal state
  const [reviewModalSub, setReviewModalSub] = useState<any | null>(null);
  const [reviewScore, setReviewScore] = useState(5);
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [reviewStrengths, setReviewStrengths] = useState('');
  const [reviewImprovements, setReviewImprovements] = useState('');
  const [reviewNextAction, setReviewNextAction] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchDetail = async () => {
    if (!studentId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get<MentorInternDetailDto>(`/api/v1/mentor/interns/${studentId}`);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.error?.message || 'Failed to load intern details');
      }
    } catch (err: any) {
      setError(err?.message || 'Error connecting to intern management service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [studentId]);

  const handleReviewSubmit = async (decision: 'ACCEPTED' | 'NEEDS_REVISION') => {
    if (!reviewModalSub) return;
    if (!reviewFeedback.trim()) {
      alert('Please enter review comments for the student.');
      return;
    }

    try {
      setSubmittingReview(true);
      const res = await apiClient.post(`/api/v1/mentor/submissions/${reviewModalSub.id}/review`, {
        status: decision,
        feedback: reviewFeedback,
        score: reviewScore,
        rating: reviewScore,
        strengths: reviewStrengths,
        improvements: reviewImprovements,
        nextAction: reviewNextAction,
      });

      if (res.success) {
        setReviewModalSub(null);
        setReviewFeedback('');
        setReviewStrengths('');
        setReviewImprovements('');
        setReviewNextAction('');
        await fetchDetail();
      } else {
        alert(res.error?.message || 'Failed to submit review');
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton count={4} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="p-8 text-center border-rose-200 bg-rose-50/50">
        <p className="text-sm text-rose-700 font-semibold">{error || 'Intern profile not found'}</p>
        <Link to="/app/mentor/interns">
          <Button variant="secondary" className="mt-4 gap-1.5">
            <ArrowLeft className="w-4 h-4" /> Back to Interns Roster
          </Button>
        </Link>
      </Card>
    );
  }

  const { student, internship, milestones, tasks, submissions, outcomes, feedbacks, documents } = data;

  return (
    <div className="space-y-6 pb-16">
      {/* Top Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link to="/app/mentor/interns">
            <Button variant="outline" size="sm" className="p-2 h-9 w-9 rounded-xl">
              <ArrowLeft className="w-4 h-4 text-slate-600" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{student.name}</h1>
              <Badge variant={internship.status === 'ACTIVE' ? 'success' : 'default'}>
                {internship.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-500">
              {student.department} • Roll: {student.rollNumber} • {internship.title} @ {internship.companyName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right sm:block hidden">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Overall Progress</span>
            <span className="text-sm font-bold text-slate-800">{internship.progress}% Completed</span>
          </div>
          <div className="w-24 bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${internship.progress}%` }} />
          </div>
        </div>
      </div>

      {/* 7 Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto no-scrollbar">
        {[
          { id: 'overview', label: 'Overview', icon: Briefcase },
          { id: 'milestones', label: `Milestones (${milestones.length})`, icon: GitBranch },
          { id: 'tasks', label: `Tasks (${tasks.length})`, icon: CheckSquare },
          { id: 'submissions', label: `Submissions (${submissions.length})`, icon: FileCheck },
          { id: 'outcomes', label: `Learning Outcomes (${outcomes.length})`, icon: Target },
          { id: 'feedback', label: `Feedback (${feedbacks.length})`, icon: MessageSquare },
          { id: 'documents', label: `Documents (${documents.length})`, icon: FolderArchive },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-semibold whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50/40 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" /> Student Profile
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Full Name</span>
                <span className="font-semibold text-slate-800">{student.name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Email Address</span>
                <span className="font-semibold text-slate-800">{student.email}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Department</span>
                <span className="font-semibold text-slate-800">{student.department}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Roll Number</span>
                <span className="font-mono text-slate-800">{student.rollNumber}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Batch Year</span>
                <span className="font-semibold text-slate-800">Class of {student.batchYear}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Institution</span>
                <span className="font-semibold text-slate-800">{student.college}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-600" /> Internship Details
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Role Title</span>
                <span className="font-semibold text-slate-800">{internship.title}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Host Enterprise</span>
                <span className="font-semibold text-slate-800">{internship.companyName}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Start Date</span>
                <span className="font-semibold text-slate-800">{internship.startDate}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Scheduled End Date</span>
                <span className="font-semibold text-slate-800">{internship.endDate}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Work Mode</span>
                <Badge variant="outline">{internship.workMode}</Badge>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Lifecycle Status</span>
                <Badge variant="success">{internship.status}</Badge>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: MILESTONES */}
      {activeTab === 'milestones' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Internship Milestones</h3>
            <Link to="/app/mentor/milestones">
              <Button variant="outline" size="sm" className="text-xs">
                Manage Milestones
              </Button>
            </Link>
          </div>
          {milestones.length === 0 ? (
            <Card className="p-8 text-center text-slate-500">
              <p className="text-xs">No milestones created for this internship yet.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {milestones.map((m) => (
                <Card key={m.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          Milestone {m.order}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">{m.title}</h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{m.description}</p>
                      <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-2">
                        <span>Due: {m.dueDate}</span>
                        <span>•</span>
                        <span>
                          {m.completedTasks ?? 0} of {m.totalTasks ?? 0} Tasks Completed
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-800">{m.progress}%</span>
                      <div className="w-20 bg-slate-100 rounded-full h-2 mt-1">
                        <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${m.progress}%` }} />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TASKS */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Assigned Tasks & Deliverables</h3>
            <Link to="/app/mentor/tasks">
              <Button variant="outline" size="sm" className="text-xs">
                Create New Task
              </Button>
            </Link>
          </div>
          {tasks.length === 0 ? (
            <Card className="p-8 text-center text-slate-500">
              <p className="text-xs">No tasks configured for this intern.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {tasks.map((t) => (
                <Card key={t.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-900">{t.title}</span>
                      <Badge
                        variant={
                          t.status === 'APPROVED'
                            ? 'success'
                            : t.status === 'SUBMITTED'
                            ? 'warning'
                            : 'default'
                        }
                      >
                        {t.status}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] py-0">
                        {t.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">{t.description}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                      <span>Due: {t.dueDate}</span>
                      {t.milestoneTitle && (
                        <>
                          <span>•</span>
                          <span className="text-indigo-600 font-medium">{t.milestoneTitle}</span>
                        </>
                      )}
                      {t.expectedEvidence && (
                        <>
                          <span>•</span>
                          <span className="text-slate-600">Expected: {t.expectedEvidence}</span>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SUBMISSIONS & QUICK REVIEW */}
      {activeTab === 'submissions' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Submitted Work & Actual Evidence</h3>
          {submissions.length === 0 ? (
            <Card className="p-8 text-center text-slate-500">
              <p className="text-xs">No submissions made by this student yet.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {submissions.map((sub: any) => (
                <Card key={sub.id} className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{sub.title}</span>
                        <Badge
                          variant={
                            sub.status === 'ACCEPTED'
                              ? 'success'
                              : sub.status === 'SUBMITTED'
                              ? 'warning'
                              : sub.status === 'REVISION_NEEDED'
                              ? 'destructive'
                              : 'default'
                          }
                        >
                          {sub.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{sub.content || sub.description}</p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2">
                        <span>Submitted on {new Date(sub.submittedAt).toLocaleDateString()}</span>
                        {sub.documentUrl && (
                          <>
                            <span>•</span>
                            <a
                              href={sub.documentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:underline inline-flex items-center gap-1 font-medium"
                            >
                              <ExternalLink className="w-3 h-3" /> View Evidence Artifact
                            </a>
                          </>
                        )}
                      </div>
                    </div>

                    <Button
                      variant={sub.status === 'SUBMITTED' ? 'primary' : 'outline'}
                      size="sm"
                      className="text-xs flex-shrink-0"
                      onClick={() => {
                        setReviewModalSub(sub);
                        setReviewFeedback(sub.mentorFeedback || '');
                        setReviewScore(sub.mentorRating || 5);
                        setReviewStrengths(sub.mentorStrengths || '');
                        setReviewImprovements(sub.mentorImprovements || '');
                        setReviewNextAction(sub.mentorNextAction || '');
                      }}
                    >
                      {sub.status === 'SUBMITTED' ? 'Review & Grade' : 'Update Review'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: LEARNING OUTCOMES */}
      {activeTab === 'outcomes' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Outcome-Based Education (OBE) Evidence</h3>
          {outcomes.length === 0 ? (
            <Card className="p-8 text-center text-slate-500">
              <p className="text-xs">No learning outcomes mapped.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {outcomes.map((o) => (
                <Card key={o.outcomeId} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                          {o.code}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">{o.name}</h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{o.description}</p>
                    </div>
                    <Badge
                      variant={
                        o.status === 'VERIFIED'
                          ? 'success'
                          : o.status === 'EVIDENCE_SUBMITTED'
                          ? 'warning'
                          : 'default'
                      }
                    >
                      {o.status}
                    </Badge>
                  </div>

                  {/* Mentor Expected Evidence vs Actual Evidence */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-100 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Mentor Expected Evidence Criteria
                      </span>
                      <ul className="list-disc list-inside text-slate-700 space-y-0.5">
                        {o.expectedEvidence.map((ev, i) => (
                          <li key={i}>{ev}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 bg-indigo-50/40 border border-indigo-100 rounded-xl">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block mb-1">
                        Student Actual Submitted Evidence
                      </span>
                      {o.studentEvidence.length === 0 ? (
                        <p className="text-slate-400 italic">No evidence artifacts submitted yet.</p>
                      ) : (
                        <div className="space-y-1">
                          {o.studentEvidence.map((se, idx) => (
                            <div key={idx} className="flex items-center justify-between text-slate-800">
                              <span className="font-medium line-clamp-1">{se.taskTitle}</span>
                              {se.evidenceUrl && (
                                <a
                                  href={se.evidenceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-indigo-600 hover:underline flex items-center gap-1 font-semibold flex-shrink-0 ml-2"
                                >
                                  <ExternalLink className="w-3 h-3" /> View
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: FEEDBACK LEDGER */}
      {activeTab === 'feedback' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Feedback History for this Intern</h3>
          {feedbacks.length === 0 ? (
            <Card className="p-8 text-center text-slate-500">
              <p className="text-xs">No feedback recorded yet.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {feedbacks.map((fb) => (
                <Card key={fb.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">{fb.taskTitle || 'Deliverable'}</span>
                    {fb.rating && (
                      <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                        Rating: {fb.rating}/5
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-700">{fb.feedback}</p>
                  {(fb.strengths || fb.improvements) && (
                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-100">
                      {fb.strengths && <div className="text-emerald-800">Strengths: {fb.strengths}</div>}
                      {fb.improvements && <div className="text-amber-800">Improvements: {fb.improvements}</div>}
                    </div>
                  )}
                  <div className="text-[10px] text-slate-400">Recorded on {new Date(fb.createdAt).toLocaleDateString()}</div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 7: DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Internship Documents & Records</h3>
          {documents.length === 0 ? (
            <Card className="p-8 text-center text-slate-500">
              <p className="text-xs">No documents on file.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {documents.map((doc) => (
                <Card key={doc.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{doc.name}</h4>
                      <p className="text-[10px] text-slate-400">Uploaded on {doc.uploadedAt}</p>
                    </div>
                  </div>
                  <a href={doc.url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="text-xs gap-1">
                      <ExternalLink className="w-3 h-3" /> View
                    </Button>
                  </a>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* REVIEW MODAL */}
      {reviewModalSub && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Evaluate Submission Evidence</h3>
                <p className="text-xs text-slate-500">{reviewModalSub.title}</p>
              </div>
              <button
                onClick={() => setReviewModalSub(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Evidence Artifact Link */}
            {reviewModalSub.documentUrl && (
              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-600">Submitted Artifact:</span>
                <a
                  href={reviewModalSub.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 font-semibold flex items-center gap-1 hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open Evidence Link
                </a>
              </div>
            )}

            {/* Rating Stars */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Quality Rating (1 to 5 Stars): {reviewScore}/5
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewScore(star)}
                    className="p-1 text-amber-400 focus:outline-none"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= reviewScore ? 'fill-amber-400 text-amber-500' : 'text-slate-200 fill-slate-100'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Detailed Feedback */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Evaluation Notes & Feedback *
              </label>
              <textarea
                value={reviewFeedback}
                onChange={(e) => setReviewFeedback(e.target.value)}
                placeholder="Provide constructive assessment of code quality, architecture, and tests..."
                rows={3}
                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* Strengths & Improvements */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Key Strengths</label>
                <input
                  type="text"
                  value={reviewStrengths}
                  onChange={(e) => setReviewStrengths(e.target.value)}
                  placeholder="e.g. Clean abstraction, 100% test coverage"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Areas for Refinement</label>
                <input
                  type="text"
                  value={reviewImprovements}
                  onChange={(e) => setReviewImprovements(e.target.value)}
                  placeholder="e.g. Add logging, handle edge cases"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Recommended Next Action</label>
              <input
                type="text"
                value={reviewNextAction}
                onChange={(e) => setReviewNextAction(e.target.value)}
                placeholder="e.g. Proceed to Task 2 in Milestone 1"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReviewModalSub(null)}
                disabled={submittingReview}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                className="gap-1 bg-amber-600 hover:bg-amber-700 text-white"
                onClick={() => handleReviewSubmit('NEEDS_REVISION')}
                disabled={submittingReview}
              >
                <RotateCcw className="w-3.5 h-3.5" /> Request Revision
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => handleReviewSubmit('ACCEPTED')}
                disabled={submittingReview}
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
