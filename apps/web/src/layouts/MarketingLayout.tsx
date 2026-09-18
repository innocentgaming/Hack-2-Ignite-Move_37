import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Building2, ArrowRight, Menu, X } from 'lucide-react';
import { Button } from '../components/Button';

export const MarketingLayout: React.FC = () => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Header */}
      <header className="h-20 border-b border-slate-800 px-4 sm:px-6 md:px-12 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-30">
        <Link to="/" className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30">
            <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <span className="text-lg sm:text-xl font-bold tracking-tight text-white">InternOS</span>
            <span className="block text-[10px] sm:text-[11px] text-indigo-400 font-medium">Smart Internship Platform</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-medium text-slate-300">
          <a href="#features" className="hover:text-white transition-colors">Platform Capabilities</a>
          <a href="#architecture" className="hover:text-white transition-colors">Architecture</a>
          <a href="#roles" className="hover:text-white transition-colors">Role Workflows</a>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link to="/login" className="hidden sm:inline-block">
            <Button variant="white" size="sm" className="px-3 sm:px-4 py-1.5 text-xs font-bold text-slate-900 shadow-sm">
              Sign In
            </Button>
          </Link>
          <Link to="/login">
            <Button size="sm" className="gap-1 sm:gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-3 sm:px-4 py-1.5 text-xs shadow-md shadow-indigo-600/20">
              <span>Launch Console</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Button>
          </Link>

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Dropdown */}
      {isMobileNavOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-6 py-4 space-y-3 animate-in slide-in-from-top-2 duration-150">
          <a
            href="#features"
            onClick={() => setIsMobileNavOpen(false)}
            className="block text-sm font-medium text-slate-300 hover:text-white py-1"
          >
            Platform Capabilities
          </a>
          <a
            href="#architecture"
            onClick={() => setIsMobileNavOpen(false)}
            className="block text-sm font-medium text-slate-300 hover:text-white py-1"
          >
            Architecture
          </a>
          <a
            href="#roles"
            onClick={() => setIsMobileNavOpen(false)}
            className="block text-sm font-medium text-slate-300 hover:text-white py-1"
          >
            Role Workflows
          </a>
          <div className="pt-2 border-t border-slate-800 flex items-center gap-3">
            <Link to="/login" className="w-full" onClick={() => setIsMobileNavOpen(false)}>
              <Button variant="white" size="sm" className="w-full text-xs font-bold text-slate-900">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 sm:py-8 px-4 sm:px-6 md:px-12 text-center text-xs text-slate-500">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="font-semibold text-slate-400">InternOS</span>
            <span>— Enterprise University Internship Governance Platform</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <span>Multi-Tenant Architecture</span>
            <span>Prisma ORM + PostgreSQL</span>
            <span>Express + React TS</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
