import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { apiClient } from '../services/apiClient';
import { SystemHealthData } from '@internos/types';
import {
  ShieldCheck,
  Building2,
  GraduationCap,
  Users,
  Briefcase,
  GitBranch,
  Layers,
  ArrowRight,
  Database,
  CheckCircle2,
  Activity,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [health, setHealth] = useState<SystemHealthData | null>(null);

  useEffect(() => {
    async function checkHealth() {
      const res = await apiClient.get<SystemHealthData>('/api/health');
      if (res.success && res.data) {
        setHealth(res.data);
      }
    }
    checkHealth();
  }, []);

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative pt-20 px-6 md:px-12 max-w-7xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
          <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>API Health: {health?.status === 'healthy' ? 'Online' : 'Checking...'} (v{health?.version || '0.1.0'})</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight md:leading-tight">
          Next-Generation <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-sky-300 to-indigo-200">Internship Management</span> & Outcome Monitoring
        </h1>

        <p className="text-base md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          The institutional operating system designed for universities, colleges, and industry partners. Multi-tenant by design, backed by PostgreSQL, Prisma ORM, and server-side RBAC.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link to="/register-institution">
            <Button size="lg" className="w-full sm:w-auto px-8 bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30">
              <span>Register Your Institution</span>
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="outline" size="lg" className="w-full sm:w-auto border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700">
              Explore Demo Environment
            </Button>
          </Link>
        </div>

        {/* Live Architecture Badge Bar */}
        <div className="pt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-800 space-y-1">
            <div className="text-xs text-indigo-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" /> Multi-Tenant
            </div>
            <div className="text-sm font-semibold text-white">Strict Isolation</div>
            <p className="text-xs text-slate-400">organizationId scoped queries</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-800 space-y-1">
            <div className="text-xs text-emerald-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Security
            </div>
            <div className="text-sm font-semibold text-white">Server-side RBAC</div>
            <p className="text-xs text-slate-400">5 Distinct User Roles</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-800 space-y-1">
            <div className="text-xs text-sky-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" /> Database
            </div>
            <div className="text-sm font-semibold text-white">20 Prisma Models</div>
            <p className="text-xs text-slate-400">PostgreSQL Foundation</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-800 space-y-1">
            <div className="text-xs text-purple-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5" /> Workflows
            </div>
            <div className="text-sm font-semibold text-white">Lifecycle Engine</div>
            <p className="text-xs text-slate-400">Outcome & Rubric Mapping</p>
          </div>
        </div>
      </section>

      {/* Role Ecosystem Section */}
      <section id="roles" className="px-6 md:px-12 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <Badge variant="indigo" size="md">Stakeholder Ecosystem</Badge>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Tailored Experiences Across the Institution
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Every actor accesses an isolated, role-specific workspace enforcing enterprise data ownership rules.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-4 hover:border-slate-700 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Institution Admin</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Oversee departmental programs, manage student and supervisor rosters, configure accreditation rubric templates, and inspect audit logs.
            </p>
            <ul className="text-xs text-slate-300 space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Department Configuration</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>System Audit Logs</span>
              </li>
            </ul>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-4 hover:border-slate-700 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Faculty Supervisor</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Track student milestone deliverables, approve technical reports, perform rubric-based evaluations, and monitor academic outcome achievements.
            </p>
            <ul className="text-xs text-slate-300 space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Student Roster Monitoring</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Rubric Evaluations</span>
              </li>
            </ul>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-4 hover:border-slate-700 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Industry Mentor</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Provide real-time feedback on student project deliverables, conduct mid-term performance assessments, and certify workplace competencies.
            </p>
            <ul className="text-xs text-slate-300 space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Milestone Verification</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Industry Reviews</span>
              </li>
            </ul>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-4 hover:border-slate-700 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Briefcase className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Student Intern</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Submit periodic progress reports, upload verified technical artifacts, track evaluation grades, and ensure graduation compliance.
            </p>
            <ul className="text-xs text-slate-300 space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                <span>Milestone Submissions</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                <span>Outcome Progression</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Monorepo Architecture Highlights */}
      <section id="architecture" className="px-6 md:px-12 max-w-7xl mx-auto space-y-8">
        <div className="p-8 md:p-12 rounded-3xl bg-gradient-to-r from-slate-900 to-indigo-950 border border-slate-800 space-y-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
            <Layers className="w-4 h-4" /> Architectural Blueprint
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Engineered for Scalable Educational Governance
          </h2>
          <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
            InternOS employs a clean modular monorepo structure separating data modeling, shared domain contracts, backend API micro-controllers, and modern client applications.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-2">
              <div className="font-mono text-xs text-indigo-300">packages/prisma</div>
              <p className="text-xs text-slate-300">
                20 models covering Organizations, Users, Profiles, Companies, Internships, Workflows, Submissions, Reviews, Outcomes, and Audit Logs.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-2">
              <div className="font-mono text-xs text-emerald-300">apps/api</div>
              <p className="text-xs text-slate-300">
                Express TypeScript server with JWT auth, request logging, server-side RBAC, strict tenant isolation middleware, and storage abstractions.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-2">
              <div className="font-mono text-xs text-amber-300">apps/web</div>
              <p className="text-xs text-slate-300">
                React 18 + TypeScript + Vite + Tailwind CSS featuring role-aware sidebar, multi-tenant app shell, and quick role switching.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
