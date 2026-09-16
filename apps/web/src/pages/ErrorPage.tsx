import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { AlertOctagon, RotateCcw, Home } from 'lucide-react';

export const ErrorPage: React.FC<{ error?: Error; resetErrorBoundary?: () => void }> = ({
  error,
  resetErrorBoundary,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-8 text-center space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertOctagon className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-slate-900">Application Exception</h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            An unexpected error occurred in the InternOS runtime environment. Our centralized telemetry has logged this event.
          </p>
          {error?.message && (
            <div className="p-3 bg-slate-50 rounded-lg text-[11px] font-mono text-slate-700 border border-slate-200 overflow-x-auto text-left">
              {error.message}
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-3">
          {resetErrorBoundary && (
            <Button variant="outline" size="sm" onClick={resetErrorBoundary} className="gap-1.5">
              <RotateCcw className="w-4 h-4" />
              <span>Retry Action</span>
            </Button>
          )}
          <Link to="/">
            <Button size="sm" className="gap-1.5">
              <Home className="w-4 h-4" />
              <span>Back to Home</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
