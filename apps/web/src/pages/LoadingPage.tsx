import React from 'react';
import { Loading } from '../components/Loading';

export const LoadingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-8 text-center space-y-6">
        <Loading size="lg" label="Initializing InternOS Workspace..." />
        <p className="text-xs text-slate-500 leading-relaxed">
          Verifying security certificates and loading multi-tenant configuration...
        </p>
      </div>
    </div>
  );
};

export default LoadingPage;
