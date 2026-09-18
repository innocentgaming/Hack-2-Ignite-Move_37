import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Building2, ArrowRight } from 'lucide-react';
import { Button } from '../components/Button';

export const MarketingLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Header */}
      <header className="h-20 border-b border-slate-800 px-6 md:px-12 flex items-center justify-between sticky top-0 bg-slate-900/90 backdrop-blur z-30">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white">InternOS</span>
            <span className="block text-[11px] text-indigo-400 font-medium">Smart Internship Platform</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a href="#features" className="hover:text-white transition-colors">Platform Capabilities</a>
          <a href="#architecture" className="hover:text-white transition-colors">Architecture</a>
          <a href="#roles" className="hover:text-white transition-colors">Role Workflows</a>
        </nav>

        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="white" size="sm" className="px-4 py-1.5 text-xs font-bold text-slate-900 shadow-sm">
              Sign In
            </Button>
          </Link>
          <Link to="/login">
            <Button size="sm" className="gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-1.5 text-xs shadow-md shadow-indigo-600/20">
              <span>Launch Console</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 px-6 md:px-12 text-center text-xs text-slate-500">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">InternOS</span>
            <span>— Enterprise University Internship Governance Platform</span>
          </div>
          <div className="flex items-center gap-6">
            <span>Multi-Tenant Architecture</span>
            <span>Prisma ORM + PostgreSQL</span>
            <span>Express + React TS</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
