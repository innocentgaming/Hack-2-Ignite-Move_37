import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';
import { StudentDashboardDto, SubmissionStatus } from '@internos/types';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import {
  Briefcase,
  Building2,
  CheckCircle2,
  Clock,
  ArrowRight,
  Target,
  FileCheck,
  AlertCircle,
  GitBranch,
  UserCheck,
  PlusCircle,
} from 'lucide-react';

export const StudentOverviewPage: React.FC = () => {
  const [data, setData] = useState<StudentDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get<StudentDashboardDto>('/api/v1/student/dashboard');
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.error?.message || 'Failed to load student dashboard');
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred while loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-4 w-96 bg-slate-200 rounded-lg animate-pulse" />
        </div>
        <LoadingSkeleton count={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 space-y-3">
        <div className="flex items-center gap-2 font-bold text-base">
          <AlertCircle className="w-5 h-5 text-rose-600" />
          <span>Error loading student workspace</span>
        </div>
        <p className="text-sm">{error}</p>
        <Button variant="secondary" size="sm" onClick={fetchDashboard}>
          Retry Connection
        </Button>
      </div>
    );
  }

  // If no active internship exists
  if (!data?.internship) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {getGreeting()}, {data?.studentName || 'Student'} 👋
          </h1>
          <p className="text-sm text-slate-500">Welcome to your production internship workspace.</p>
        </div>

        <Card className="border-dashed border-2 border-slate-300 p-8 text-center bg-white rounded-2xl space-y-4">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
            <Briefcase className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-lg font-bold text-slate-900">No active internship registered</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Register your off-campus or on-campus corporate internship engagement to unlock milestone tracking, deliverable submissions, and mentor evaluations.
            </p>
          </div>
          <Link to="/app/internships/new">
            <Button variant="primary" className="gap-2">
              <PlusCircle className="w-4 h-4" />
              Register Internship
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const { internship, activeMilestone, upcomingTasks, recentSubmissions, outcomesSummary, upcomingDeadlines } = data;

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Header Greeting & Primary Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {getGreeting()}, {data.studentName} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Here is your live progress and upcoming deliverables for today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/app/student/tasks">
            <Button variant="primary" size="sm" className="gap-2 shadow-xs">
              <FileCheck className="w-4 h-4" />
              Submit Evidence
            </Button>
          </Link>
          <Link to="/app/student/internship">
            <Button variant="secondary" size="sm" className="gap-1.5">
              <span>View Engagement</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Main Internship Hero Card */}
      <Card className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border-0 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge variant="emerald" size="sm" className="font-semibold tracking-wide">
                {internship.status}
              </Badge>
              <span className="text-xs text-indigo-300 font-mono">
                {internship.workMode} ENGAGEMENT
              </span>
              {internship.departmentName && (
                <>
                  <span className="text-indigo-400/50">•</span>
                  <span className="text-xs text-indigo-200">{internship.departmentName}</span>
                </>
              )}
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {internship.title}
              </h2>
              <div className="flex items-center gap-2 text-indigo-200 text-sm mt-1 font-medium">
                <Building2 className="w-4 h-4 text-indigo-400" />
                <span>{internship.companyName}</span>
                {internship.companyWebsite && (
                  <a
                    href={internship.companyWebsite}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-2 ml-1"
                  >
                    website
                  </a>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-3 border-t border-indigo-900/60 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px] font-medium uppercase tracking-wider">
                  Timeline
                </span>
                <span className="text-slate-200 font-semibold mt-0.5 block">
                  {internship.startDate} → {internship.endDate}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] font-medium uppercase tracking-wider">
                  Assigned Mentor
                </span>
                <span className="text-slate-200 font-semibold mt-0.5 block flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                  {internship.mentorName || 'Pending'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] font-medium uppercase tracking-wider">
                  Mentor Email
                </span>
                <span className="text-slate-300 font-mono text-[11px] truncate block mt-0.5">
                  {internship.mentorEmail || 'Unassigned'}
                </span>
              </div>
            </div>
          </div>

          {/* Progress Gauge */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-indigo-200 mb-1 font-semibold">
                <span>Overall Progress</span>
                <span className="text-xl font-bold text-white font-mono">
                  {internship.overallProgress}%
                </span>
              </div>
              <div className="w-full bg-black/30 h-3 rounded-full overflow-hidden p-0.5 border border-white/10">
                <div
                  className="bg-gradient-to-r from-indigo-400 via-emerald-400 to-emerald-300 h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, Math.max(0, internship.overallProgress))}%` }}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 text-xs space-y-1.5 text-slate-300">
              <div className="flex items-center justify-between">
                <span>Verified Outcomes:</span>
                <span className="font-bold text-emerald-400 font-mono">
                  {outcomesSummary.verified} / {outcomesSummary.total}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Outcomes in Progress:</span>
                <span className="font-bold text-indigo-300 font-mono">
                  {outcomesSummary.progressing}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 3. Active Milestone Banner */}
      {activeMilestone && (
        <Card className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-5 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-sm mt-0.5">
                <GitBranch className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-indigo-700 tracking-wider uppercase">
                    Active Milestone
                  </span>
                  <span className="text-xs text-indigo-400">•</span>
                  <span className="text-xs text-indigo-600 font-medium flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Due: {activeMilestone.dueDate}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  {activeMilestone.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activeMilestone.completedTasks} of {activeMilestone.totalTasks} actionable tasks completed
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-36 hidden sm:block">
                <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                  <span>Milestone Completion</span>
                  <span>{activeMilestone.progress}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all"
                    style={{ width: `${activeMilestone.progress}%` }}
                  />
                </div>
              </div>
              <Link to={`/app/student/milestones/${activeMilestone.id}`}>
                <Button variant="secondary" size="sm" className="whitespace-nowrap gap-1">
                  <span>Milestone Tasks</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* 4. Two-Column Grid: Upcoming Tasks & Recent Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Actionable Tasks */}
        <Card className="rounded-2xl border border-slate-200 p-6 shadow-xs bg-white space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                Today / Upcoming Tasks
              </h3>
              <p className="text-xs text-slate-500">Actionable work items awaiting your evidence submission</p>
            </div>
            <Link to="/app/student/tasks" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
              View All Tasks →
            </Link>
          </div>

          {upcomingTasks.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              All assigned tasks are completed or submitted! Great job.
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingTasks.map((t: any) => (
                <div
                  key={t.id}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/20 transition-all flex items-center justify-between gap-3"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 truncate">{t.title}</span>
                      <Badge
                        variant={
                          t.priority === 'URGENT' || t.priority === 'HIGH'
                            ? 'rose'
                            : t.priority === 'MEDIUM'
                            ? 'amber'
                            : 'slate'
                        }
                        size="sm"
                      >
                        {t.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      {t.milestoneTitle && (
                        <span className="text-slate-600 truncate max-w-[140px] font-medium">
                          {t.milestoneTitle}
                        </span>
                      )}
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" /> Due {t.dueDate}
                      </span>
                    </div>
                  </div>

                  <Link to={`/app/student/tasks/${t.id}`}>
                    <Button variant="secondary" size="sm" className="text-xs whitespace-nowrap">
                      Open Task
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Right: Recent Submissions & Feedback */}
        <Card className="rounded-2xl border border-slate-200 p-6 shadow-xs bg-white space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                Recent Submissions & Reviews
              </h3>
              <p className="text-xs text-slate-500">Proof submitted to your mentor with feedback</p>
            </div>
            <Link to="/app/student/submissions" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
              View History →
            </Link>
          </div>

          {recentSubmissions.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No submissions uploaded yet. Open an active task to submit your work.
            </div>
          ) : (
            <div className="space-y-3">
              {recentSubmissions.map((s: any) => (
                <div key={s.id} className="p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{s.submissionTitle}</h4>
                      <p className="text-[11px] text-slate-500">Task: {s.taskTitle}</p>
                    </div>
                    <Badge
                      variant={
                        s.status === SubmissionStatus.ACCEPTED
                          ? 'emerald'
                          : s.status === SubmissionStatus.REVISION_NEEDED
                          ? 'rose'
                          : 'amber'
                      }
                      size="sm"
                    >
                      {s.status}
                    </Badge>
                  </div>

                  {s.mentorFeedback ? (
                    <div className="p-2.5 bg-slate-50 rounded-lg text-xs text-slate-700 border border-slate-200/80">
                      <span className="font-semibold text-slate-900 block text-[11px]">
                        Mentor Feedback:
                      </span>
                      <p className="text-[11px] text-slate-600 mt-0.5">{s.mentorFeedback}</p>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">Pending mentor review</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* 5. Bottom Grid: Learning Outcomes Summary & Deadlines */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Learning Outcomes Progress */}
        <Card className="rounded-2xl border border-slate-200 p-5 bg-white space-y-3 md:col-span-2">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-600" />
              Outcome-Based Education (OBE) Progress
            </h4>
            <Link to="/app/student/outcomes" className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold">
              View All Outcomes →
            </Link>
          </div>

          <p className="text-xs text-slate-500">
            Educational outcomes mapped to your degree curriculum. Your mentor defines the Expected Evidence; you submit the Actual Evidence.
          </p>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
              <span className="text-xl font-bold text-emerald-700 font-mono">{outcomesSummary.verified}</span>
              <span className="block text-[11px] font-semibold text-emerald-800 mt-0.5">Verified</span>
            </div>
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-center">
              <span className="text-xl font-bold text-indigo-700 font-mono">{outcomesSummary.progressing}</span>
              <span className="block text-[11px] font-semibold text-indigo-800 mt-0.5">In Progress</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <span className="text-xl font-bold text-slate-700 font-mono">{outcomesSummary.requiresEvidence}</span>
              <span className="block text-[11px] font-semibold text-slate-800 mt-0.5">Needs Proof</span>
            </div>
          </div>
        </Card>

        {/* Deadlines Radar */}
        <Card className="rounded-2xl border border-slate-200 p-5 bg-white space-y-3">
          <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            Upcoming Deadlines
          </h4>

          {upcomingDeadlines.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No urgent deadlines coming up.</p>
          ) : (
            <div className="space-y-2 text-xs">
              {upcomingDeadlines.map((d: any) => (
                <div key={d.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/60">
                  <div className="truncate pr-2">
                    <span className="font-semibold text-slate-800 block truncate">{d.title}</span>
                    <span className="text-[10px] text-slate-400 uppercase font-mono">{d.type}</span>
                  </div>
                  <span
                    className={`font-mono font-bold text-xs whitespace-nowrap px-1.5 py-0.5 rounded ${
                      d.daysRemaining <= 3
                        ? 'bg-rose-100 text-rose-700'
                        : d.daysRemaining <= 7
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {d.daysRemaining <= 0 ? 'Today' : `${d.daysRemaining}d`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default StudentOverviewPage;
