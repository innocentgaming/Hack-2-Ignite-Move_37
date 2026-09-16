import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Building2, ShieldCheck, Sparkles } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-900">
      {/* Left Banner */}
      <div className="md:w-1/2 p-8 md:p-16 flex flex-col justify-between bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border-b md:border-b-0 md:border-r border-slate-800">
        <div>
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white">InternOS</span>
              <span className="block text-xs text-indigo-300 font-medium">Educational Institution Cloud</span>
            </div>
          </Link>

          <div className="mt-16 space-y-6 max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Multi-Tenant Architecture</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Enterprise Internship Governance for Modern Universities.
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Standardize industrial training workflows, track outcome-based evaluations, and unite students, faculty supervisors, and corporate mentors under strict tenant isolation.
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex items-center gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Server-side RBAC</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            <span>Tenant Scoped Data</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Prisma PostgreSQL</span>
          </div>
        </div>
      </div>

      {/* Right Content Area */}
      <div className="md:w-1/2 flex items-center justify-center p-6 md:p-12 bg-slate-50">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
