import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { FormInput } from '../components/FormInput';
import { ShieldCheck, AlertCircle, ArrowRight, Building2 } from 'lucide-react';
import { UserRole } from '@internos/types';
import { normalizeRole } from '@internos/shared';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState('admin@org-a.com');
  const [password, setPassword] = useState('Password123!');
  const [organizationCode, setOrganizationCode] = useState('ORG_A');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getRoleRedirect = (role: UserRole | string): string => {
    const norm = normalizeRole(role);
    switch (norm) {
      case UserRole.ADMIN:
        return '/app/admin';
      case UserRole.HOD:
        return '/app/hod';
      case UserRole.FACULTY:
        return '/app/faculty';
      case UserRole.MENTOR:
        return '/app/mentor';
      case UserRole.STUDENT:
      default:
        return '/app/student';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const res = await login({
      email,
      password,
      organizationCode: organizationCode.trim() || undefined,
    });

    if (res.success && res.user) {
      const targetPath = getRoleRedirect(res.user.role);
      navigate(targetPath);
    } else {
      setErrorMessage(res.error || 'Authentication failed');
    }
  };

  const handleDemoSelect = (demoEmail: string, orgCode: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setOrganizationCode(orgCode);
    setErrorMessage(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome to InternOS</h2>
        <p className="text-xs text-slate-500">Sign in to your educational institution portal (Phase 1)</p>
      </div>

      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Multi-Tenant Quick Account Picker */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
          <span className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
            Quick Accounts (Organization A):
          </span>
          <span className="text-[10px] text-slate-400 font-mono">Pass: Password123!</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => handleDemoSelect('admin@org-a.com', 'ORG_A')}
            className={`p-1.5 text-left rounded border transition-colors ${
              email === 'admin@org-a.com'
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-medium'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            🏛️ ADMIN (Org A)
          </button>
          <button
            type="button"
            onClick={() => handleDemoSelect('hod@org-a.com', 'ORG_A')}
            className={`p-1.5 text-left rounded border transition-colors ${
              email === 'hod@org-a.com'
                ? 'bg-violet-50 border-violet-300 text-violet-700 font-medium'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            🧭 HOD (Org A)
          </button>
          <button
            type="button"
            onClick={() => handleDemoSelect('faculty@org-a.com', 'ORG_A')}
            className={`p-1.5 text-left rounded border transition-colors ${
              email === 'faculty@org-a.com'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-medium'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            🎓 FACULTY (Org A)
          </button>
          <button
            type="button"
            onClick={() => handleDemoSelect('student@org-a.com', 'ORG_A')}
            className={`p-1.5 text-left rounded border transition-colors ${
              email === 'student@org-a.com'
                ? 'bg-sky-50 border-sky-300 text-sky-700 font-medium'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            🎒 STUDENT (Org A)
          </button>
          <button
            type="button"
            onClick={() => handleDemoSelect('mentor@org-a.com', 'ORG_A')}
            className={`p-1.5 text-left rounded border transition-colors ${
              email === 'mentor@org-a.com'
                ? 'bg-amber-50 border-amber-300 text-amber-700 font-medium'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            💼 MENTOR (Org A)
          </button>
        </div>

        {/* Organization B Tenant Switcher */}
        <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] font-semibold text-slate-700">
          <span>Organization B (Isolated Tenant):</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => handleDemoSelect('admin@org-b.com', 'ORG_B')}
            className={`p-1.5 text-left rounded border transition-colors ${
              email === 'admin@org-b.com'
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-medium'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            🏛️ ADMIN (Org B)
          </button>
          <button
            type="button"
            onClick={() => handleDemoSelect('student@org-b.com', 'ORG_B')}
            className={`p-1.5 text-left rounded border transition-colors ${
              email === 'student@org-b.com'
                ? 'bg-sky-50 border-sky-300 text-sky-700 font-medium'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            🎒 STUDENT (Org B)
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          label="Institution / Tenant Code"
          type="text"
          value={organizationCode}
          onChange={(e) => setOrganizationCode(e.target.value)}
          placeholder="e.g. ORG_A or ORG_B"
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
          Strict Tenant Isolation Active
        </span>
        <Link to="/activate" className="text-indigo-600 hover:text-indigo-700 font-medium">
          Have an invite? Activate account
        </Link>
      </div>
    </div>
  );
};
