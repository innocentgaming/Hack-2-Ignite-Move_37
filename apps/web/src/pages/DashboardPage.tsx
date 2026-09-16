import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardBody } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { UserRole } from '@internos/types';
import {
  Briefcase,
  CheckCircle2,
  Clock,
  Award,
  Building2,
  GitBranch,
  TrendingUp,
  FileCheck2,
  Sparkles,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role || UserRole.STUDENT;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 md:p-8 text-white border border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Workspace Active • {user?.organizationName}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Hello, {user?.firstName} {user?.lastName}
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl">
            {role === UserRole.INSTITUTION_ADMIN &&
              'Manage institutional internship accreditation, departments, supervisor allocations, and audit compliance.'}
            {role === UserRole.FACULTY_SUPERVISOR &&
              'Monitor assigned student interns, review milestone technical reports, and execute outcome-based rubric evaluations.'}
            {role === UserRole.INDUSTRY_MENTOR &&
              'Track corporate intern progress, evaluate workplace milestones, and provide industrial mentorship feedback.'}
            {role === UserRole.STUDENT &&
              'Track your internship lifecycle, submit weekly milestone progress, and monitor faculty/mentor evaluations.'}
            {role === UserRole.SUPER_ADMIN &&
              'Global Multi-Tenant Administration: Oversee all institutions, subscription tiers, and system health.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="border-slate-700 bg-slate-800/80 text-white hover:bg-slate-700">
            View Guidelines
          </Button>
          <Button size="sm" className="bg-indigo-500 hover:bg-indigo-600">
            Active Milestone
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card hoverable>
          <CardBody className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Internships</span>
              <div className="text-2xl font-bold text-slate-900">42</div>
              <div className="text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+12% this semester</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Briefcase className="w-6 h-6" />
            </div>
          </CardBody>
        </Card>

        <Card hoverable>
          <CardBody className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pending Submissions</span>
              <div className="text-2xl font-bold text-slate-900">7</div>
              <div className="text-[11px] text-amber-600 flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5" />
                <span>Due in 48 hours</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <FileCheck2 className="w-6 h-6" />
            </div>
          </CardBody>
        </Card>

        <Card hoverable>
          <CardBody className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Completed Rubrics</span>
              <div className="text-2xl font-bold text-slate-900">89%</div>
              <div className="text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>On-track for PO-1</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
          </CardBody>
        </Card>

        <Card hoverable>
          <CardBody className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Verified Companies</span>
              <div className="text-2xl font-bold text-slate-900">18</div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                <Building2 className="w-3.5 h-3.5" />
                <span>Acme, CloudTech, etc.</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader
              title="Active Internship Lifecycle"
              subtitle="Standard 16-Week Technical Internship Blueprint"
              action={
                <Badge variant="indigo" dot>
                  Workflow Phase 2
                </Badge>
              }
            />
            <CardBody className="space-y-6">
              {/* Progress bar */}
              <div>
                <div className="flex items-center justify-between text-xs font-medium text-slate-700 mb-2">
                  <span>Overall Program Completion</span>
                  <span className="font-semibold text-indigo-600">35%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full w-[35%]" />
                </div>
              </div>

              {/* Tasks list */}
              <div className="space-y-3">
                <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Offer Letter & Induction Verification</div>
                      <div className="text-xs text-slate-500">Stage: Onboarding • Completed June 12</div>
                    </div>
                  </div>
                  <Badge variant="emerald">Approved</Badge>
                </div>

                <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/30 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Mid-Term Technical Milestone Report</div>
                      <div className="text-xs text-slate-500">Stage: Mid-Term • Due in 5 days • Assigned to Student</div>
                    </div>
                  </div>
                  <Badge variant="indigo">In Progress</Badge>
                </div>

                <div className="p-4 rounded-xl border border-slate-200/80 bg-white flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">
                      <GitBranch className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-700">Final Industry Evaluation & Viva Voce</div>
                      <div className="text-xs text-slate-500">Stage: Final • Evaluator: Faculty & Mentor</div>
                    </div>
                  </div>
                  <Badge variant="slate">Pending</Badge>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right Column (1 Col) */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Tenant & Security Context" subtitle="Server-side Enforced Isolation" />
            <CardBody className="space-y-4 text-xs">
              <div className="space-y-2">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Institution:</span>
                  <span className="font-semibold text-slate-800">{user?.organizationName}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Tenant Code:</span>
                  <span className="font-mono text-slate-800">{user?.organizationCode}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Active Role:</span>
                  <Badge variant="indigo" size="sm">{role}</Badge>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Tenant Boundary:</span>
                  <span className="text-emerald-600 font-semibold">Strict Server-side</span>
                </div>
              </div>

              <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 text-slate-600">
                <p className="font-semibold text-indigo-900 mb-1">Architecture Principle:</p>
                Frontend visibility is not a security boundary. All API endpoints validate JWT claims and enforce organizationId tenant filters.
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Academic Outcomes (PO)" subtitle="Program Educational Objectives" />
            <CardBody className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-1">
                  <span>PO-1: Engineering Knowledge</span>
                  <Badge variant="emerald" size="sm">Active</Badge>
                </div>
                <p className="text-[11px] text-slate-500">
                  Apply mathematics, science, and engineering fundamentals to real-world cloud engineering tasks.
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};
