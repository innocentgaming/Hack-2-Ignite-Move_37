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
  GitBranch,
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
    <div className="space-y-8 pb-12">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Welcome back, {d?.mentorName || 'Mentor'}
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-100 text-indigo-800">
              Industry Mentor
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Supervising engineering interns at {d?.companyName || 'Host Organization'}. Track progress, define milestones, and review submitted deliverables.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/app/mentor/milestones">
            <Button variant="outline" size="sm" className="gap-1.5">
              <GitBranch className="w-4 h-4 text-slate-600" /> Milestones
            </Button>
          </Link>
          <Link to="/app/mentor/tasks">
            <Button variant="outline" size="sm" className="gap-1.5">
              <CheckSquare className="w-4 h-4 text-slate-600" /> New Task
            </Button>
          </Link>
          <Link to="/app/mentor/submissions">
            <Button variant="primary" size="sm" className="gap-1.5 shadow-sm">
              <FileCheck className="w-4 h-4" /> Review Queue
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

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Assigned Interns</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">{d?.stats?.assignedInterns ?? 0}</div>
            <p className="text-xs text-slate-500 mt-0.5">Enrolled students</p>
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Internships</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">{d?.stats?.activeInternships ?? 0}</div>
            <p className="text-xs text-slate-500 mt-0.5">Underway</p>
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between border-amber-200 bg-amber-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Pending Reviews</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-amber-900">{d?.stats?.pendingReviews ?? 0}</div>
            <p className="text-xs text-amber-700 mt-0.5">Requires evaluation</p>
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tasks in Progress</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">{d?.stats?.tasksAwaitingReview ?? 0}</div>
            <p className="text-xs text-slate-500 mt-0.5">Submitted tasks</p>
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">OBE Outcomes</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">{d?.stats?.outcomesRequiringEvidence ?? 0}</div>
            <p className="text-xs text-slate-500 mt-0.5">Active criteria</p>
          </div>
        </Card>
      </div>

      {/* Pending Reviews Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Submissions Awaiting Your Review</h2>
            <p className="text-xs text-slate-500">Evaluate student work and provide feedback or revision requests.</p>
          </div>
          <Link to="/app/mentor/submissions">
            <Button variant="ghost" size="sm" className="text-indigo-600 gap-1 text-xs">
              View All Submissions <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        {(!d?.recentSubmissions || d.recentSubmissions.length === 0) ? (
          <Card className="p-8 text-center text-slate-500">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
            <p className="text-sm font-semibold text-slate-700">All Caught Up!</p>
            <p className="text-xs text-slate-400 mt-0.5">
              There are no pending submissions awaiting review right now.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {d.recentSubmissions.map((sub) => (
              <Card key={sub.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-sm transition-shadow">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{sub.submissionTitle}</span>
                    <Badge variant="warning">SUBMITTED</Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    Student: <span className="font-medium text-slate-800">{sub.studentName}</span> ({sub.studentEmail}) • Task: <span className="font-medium text-slate-700">{sub.taskTitle}</span>
                  </p>
                  <p className="text-[11px] text-slate-400">Submitted on {sub.submittedAt}</p>
                </div>
                <Link to={`/app/mentor/submissions`}>
                  <Button variant="primary" size="sm" className="gap-1 text-xs flex-shrink-0">
                    Review Evidence <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Interns Roster Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Assigned Interns Overview</h2>
            <p className="text-xs text-slate-500">Monitor completion rates and milestone progressions.</p>
          </div>
          <Link to="/app/mentor/interns">
            <Button variant="ghost" size="sm" className="text-indigo-600 gap-1 text-xs">
              View All Interns <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        {(!d?.interns || d.interns.length === 0) ? (
          <Card className="p-8 text-center text-slate-500">
            <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">No Interns Assigned Yet</p>
            <p className="text-xs text-slate-400 mt-0.5">
              When students are assigned to you for industrial mentoring, they will appear here.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {d.interns.map((intern) => (
              <Card key={intern.studentId} className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{intern.studentName}</h3>
                      <p className="text-xs text-slate-500">{intern.department}</p>
                    </div>
                    <Badge variant={intern.status === 'ACTIVE' ? 'success' : 'default'}>
                      {intern.status}
                    </Badge>
                  </div>

                  <div className="mt-3 p-3 bg-slate-50 rounded-xl space-y-1">
                    <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                      Internship Title
                    </span>
                    <span className="text-xs font-semibold text-slate-800 block">
                      {intern.internshipTitle}
                    </span>
                    {intern.currentMilestoneTitle && (
                      <div className="flex items-center gap-1.5 text-xs text-indigo-700 mt-1 font-medium">
                        <GitBranch className="w-3.5 h-3.5" />
                        <span>Current: {intern.currentMilestoneTitle}</span>
                      </div>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Deliverables Progress</span>
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
                    <span className="text-xs text-amber-700 font-medium bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                      {intern.pendingSubmissionsCount} pending review
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">All submissions reviewed</span>
                  )}

                  <Link to={`/app/mentor/interns/${intern.studentId}`}>
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
                      Open Profile <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
