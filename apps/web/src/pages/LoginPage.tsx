import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { FormInput } from '../components/FormInput';
import { ShieldCheck, AlertCircle, ArrowRight, UserCircle2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState('admin@apex.edu');
  const [password, setPassword] = useState('Password123!');
  const [organizationCode, setOrganizationCode] = useState('apex-inst');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const res = await login({
      email,
      password,
      organizationCode: organizationCode.trim() || undefined,
    });

    if (res.success) {
      navigate('/app/dashboard');
    } else {
      setErrorMessage(res.error || 'Authentication failed');
    }
  };

  const handleDemoSelect = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setOrganizationCode('apex-inst');
    setErrorMessage(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome to InternOS</h2>
        <p className="text-xs text-slate-500">Sign in to your educational institution portal</p>
      </div>

      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Demo Quick-Fill Picker */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
          <span className="flex items-center gap-1.5">
            <UserCircle2 className="w-3.5 h-3.5 text-indigo-600" />
            Quick Demo Accounts:
          </span>
          <span className="text-[10px] text-slate-400 font-mono">Password: Password123!</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => handleDemoSelect('admin@apex.edu')}
            className={`p-1.5 text-left rounded border transition-colors ${
              email === 'admin@apex.edu'
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-medium'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            🏛️ Institution Admin
          </button>
          <button
            type="button"
            onClick={() => handleDemoSelect('dr.sharma@apex.edu')}
            className={`p-1.5 text-left rounded border transition-colors ${
              email === 'dr.sharma@apex.edu'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-medium'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            🎓 Faculty Supervisor
          </button>
          <button
            type="button"
            onClick={() => handleDemoSelect('raj.patel@acmecloud.com')}
            className={`p-1.5 text-left rounded border transition-colors ${
              email === 'raj.patel@acmecloud.com'
                ? 'bg-amber-50 border-amber-300 text-amber-700 font-medium'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            💼 Industry Mentor
          </button>
          <button
            type="button"
            onClick={() => handleDemoSelect('alex.student@apex.edu')}
            className={`p-1.5 text-left rounded border transition-colors ${
              email === 'alex.student@apex.edu'
                ? 'bg-sky-50 border-sky-300 text-sky-700 font-medium'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            🎒 Student Intern
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          label="Institution / Tenant Code"
          type="text"
          value={organizationCode}
          onChange={(e) => setOrganizationCode(e.target.value)}
          placeholder="e.g. apex-inst"
          required
        />

        <FormInput
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@university.edu"
          required
        />

        <FormInput
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />

        <div className="pt-2">
          <Button type="submit" size="lg" className="w-full gap-2" isLoading={isLoading}>
            <span>Sign In to Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </form>

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          Tenant Isolation Active
        </span>
        <span className="font-mono text-[10px]">JWT + RBAC</span>
      </div>
    </div>
  );
};
