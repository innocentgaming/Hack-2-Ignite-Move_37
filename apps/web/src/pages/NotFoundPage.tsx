import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { Compass, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-8 text-center space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
          <Compass className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <span className="text-4xl font-extrabold text-indigo-600">404</span>
          <h1 className="text-xl font-bold text-slate-900">Resource Not Found</h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            The route or resource you requested is not available or you do not have permission to view it within this tenant workspace.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3">
          <Link to="/app/dashboard">
            <Button size="sm" className="gap-1.5">
              <Home className="w-4 h-4" />
              <span>Go to Dashboard</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
