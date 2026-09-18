import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';
import { MentorDashboardDto } from '@internos/types';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import {
  Users,
  Briefcase,
  Clock,
  CheckCircle2,
  ArrowRight,
  CheckSquare,
  FileCheck,
  Target,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const MentorOverviewPage: React.FC = () => {
  const [dashboard, setDashboard] = useState<MentorDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get<MentorDashboardDto>('/api/v1/mentor/dashboard');
      if (res.success && res.data) {
        setDashboard(res.data);
      } else {
        setError(res.error?.message || 'Failed to load mentor dashboard');
      }
    } catch (err: any) {
      setError(err?.message || 'Error connecting to mentor service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton count={4} />
      </div>
    );
  }

  const d = dashboard;

  return (
    <div className="space-y-8 pb-16">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Welcome back, {d?.mentorName || 'Mark Mentor'}
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Mentor Workspace
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            What requires my attention today? Overseeing interns, reviewing submissions, and tracking accredited learning outcomes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <Link to="/app/mentor/submissions">
            <Button variant="primary" size="sm" className="gap-1.5 shadow-sm font-semibold">
              <FileCheck className="w-4 h-4" /> Review Queue
            </Button>
          </Link>
          <Link to="/app/mentor/tasks">
            <Button variant="outline" size="sm" className="gap-1.5 font-semibold">
              <CheckSquare className="w-4 h-4 text-slate-600" /> New Task
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <Card className="p-4 border-amber-200 bg-amber-50 text-amber-800 text-sm flex items-center justify-between">
          <span>{error}</span>
          <Button variant="secondary" size="sm" onClick={fetchDashboard}>
            Retry
          </Button>
        </Card>
      )}

      {/* TOP METRICS (5 KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <Card className="p-5 flex flex-col justify-between border border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Assigned Interns</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">{d?.stats?.assignedInterns ?? 2}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Supervised interns</p>
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between border border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Internships</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">{d?.stats?.activeInternships ?? 2}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Active placements</p>
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between border-amber-200/90 bg-amber-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">Pending Reviews</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-amber-900">{d?.stats?.pendingReviews ?? 1}</div>
            <p className="text-[11px] text-amber-700 mt-0.5">Action required</p>
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between border border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Tasks Needing Attention</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">{d?.stats?.tasksAwaitingReview ?? 1}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Under evaluation</p>
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between border border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Outcomes Requiring Review</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">{d?.stats?.outcomesRequiringEvidence ?? 1}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Accreditation criteria</p>
          </div>
        </Card>
      </div>

      {/* 1. PENDING REVIEWS SECTION */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Pending Reviews</h2>
            <p className="text-xs text-slate-500">Student deliverables waiting for your technical assessment.</p>
          </div>
          <Link to="/app/mentor/submissions">
            <Button variant="ghost" size="sm" className="text-indigo-600 gap-1 text-xs font-semibold">
              View All Queue <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        {(!d?.recentSubmissions || d.recentSubmissions.length === 0) ? (
          <Card className="p-8 text-center text-slate-500 border border-slate-200/80">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
            <p className="text-sm font-semibold text-slate-700">All Caught Up!</p>
            <p className="text-xs text-slate-400 mt-0.5">There are no pending submissions awaiting review right now.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {d.recentSubmissions.map((sub) => (
              <Card
                key={sub.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-sm transition-shadow border border-amber-200/80 bg-amber-50/20"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {sub.studentName}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-sm font-bold text-slate-900">{sub.taskTitle}</span>
                    <Badge variant="warning">SUBMITTED</Badge>
                  </div>
                  <p className="text-xs text-slate-600">
                    Deliverable: <span className="font-semibold text-slate-800">{sub.submissionTitle}</span>
                  </p>
                  <p className="text-[11px] text-slate-400">Submitted: {sub.submittedAt}</p>
                </div>
                <Link to="/app/mentor/submissions">
                  <Button variant="primary" size="sm" className="gap-1 text-xs flex-shrink-0 font-semibold shadow-sm">
                    Review Evidence <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 2. MY INTERNS SECTION */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">My Interns</h2>
            <p className="text-xs text-slate-500">Supervised students and current progress indicators.</p>
          </div>
          <Link to="/app/mentor/interns">
            <Button variant="ghost" size="sm" className="text-indigo-600 gap-1 text-xs font-semibold">
              View All Interns <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        {(!d?.interns || d.interns.length === 0) ? (
          <Card className="p-8 text-center text-slate-500 border border-slate-200/80">
            <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">No Interns Assigned</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {d.interns.map((intern) => (
              <Card
                key={intern.studentId}
                className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow border border-slate-200/80"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm">
                        {intern.studentName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">{intern.studentName}</h3>
                        <p className="text-xs text-slate-500">{intern.department}</p>
                      </div>
                    </div>
                    <Badge variant={intern.status === 'ACTIVE' ? 'success' : 'default'}>
                      {intern.status}
                    </Badge>
                  </div>

                  <div className="mt-3 p-3 bg-slate-50 rounded-xl space-y-1 border border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Internship Position
                    </span>
                    <p className="text-xs font-bold text-slate-800 line-clamp-1">{intern.internshipTitle}</p>
                    {intern.companyName && (
                      <p className="text-xs text-slate-600 font-medium">{intern.companyName}</p>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Internship Progress</span>
                      <span className="font-bold text-slate-800">{intern.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${intern.progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  {intern.pendingSubmissionsCount > 0 ? (
                    <span className="text-xs text-amber-700 font-semibold bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-lg">
                      {intern.pendingSubmissionsCount} Pending Review
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Up to date
                    </span>
                  )}

                  <Link to={`/app/mentor/interns/${intern.studentId}`}>
                    <Button variant="primary" size="sm" className="gap-1.5 text-xs font-semibold">
                      View Student <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 3. OUTCOMES REQUIRING ATTENTION */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Outcomes Requiring Attention</h2>
            <p className="text-xs text-slate-500">Learning outcomes where intern verification artifacts are missing or pending.</p>
          </div>
          <Link to="/app/mentor/outcomes">
            <Button variant="ghost" size="sm" className="text-indigo-600 gap-1 text-xs font-semibold">
              View All Outcomes <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4 border border-slate-200/80 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                  Sam Student
                </span>
                <Badge variant="warning">EVIDENCE SUBMITTED</Badge>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900">PO-1 Production REST API Engineering</h4>
                <p className="text-xs text-slate-500 mt-0.5">Full Stack Engineering Internship • Google Cloud Solutions</p>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl text-xs space-y-1">
                <div className="flex justify-between font-medium">
                  <span className="text-slate-600">Verification Status</span>
                  <span className="text-amber-700 font-bold">2 evidence criteria missing</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '50%' }} />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <Link to="/app/mentor/outcomes?studentId=user-a-student">
                <Button variant="outline" size="sm" className="text-xs font-semibold">
                  Review Outcome
                </Button>
              </Link>
            </div>
          </Card>

          <Card className="p-4 border border-slate-200/80 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                  David Chen
                </span>
                <Badge variant="outline">IN PROGRESS</Badge>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900">PO-2 Cloud Infrastructure Automation</h4>
                <p className="text-xs text-slate-500 mt-0.5">Cloud Infrastructure & DevOps Internship • Amazon Web Systems</p>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl text-xs space-y-1">
                <div className="flex justify-between font-medium">
                  <span className="text-slate-600">Verification Status</span>
                  <span className="text-slate-700 font-bold">1 evidence criteria missing</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: '75%' }} />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <Link to="/app/mentor/outcomes?studentId=user-a-student-3">
                <Button variant="outline" size="sm" className="text-xs font-semibold">
                  Review Outcome
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
