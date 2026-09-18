import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { FormInput } from '../components/FormInput';
import { ShieldCheck, AlertCircle, ArrowRight, ArrowLeft, Building2, Sparkles, UserCheck } from 'lucide-react';
import { UserRole } from '@internos/types';
import { normalizeRole } from '@internos/shared';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();

  const [mode, setMode] = useState<'demo' | 'real'>('demo');
  const [email, setEmail] = useState('admin@mitpune.edu.in');
  const [password, setPassword] = useState('Password123!');
  const [organizationCode, setOrganizationCode] = useState('MIT_PUNE');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getRoleRedirect = (role: UserRole | string): string => {
    const norm = normalizeRole(role);
    switch (norm) {
      case UserRole.ADMIN:
        return '/app/admin';
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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 space-y-6 max-w-lg mx-auto">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
        <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
          v2.4 Production-Ready
        </span>
      </div>

      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome to InternOS</h2>
        <p className="text-xs text-slate-500">Sign in to your university internship governance workspace</p>
      </div>

      {/* Mode Switcher */}
      <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
        <button
          type="button"
          onClick={() => {
            setMode('demo');
            handleDemoSelect('admin@mitpune.edu.in', 'MIT_PUNE');
          }}
          className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            mode === 'demo'
              ? 'bg-white text-indigo-700 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Explore Demo (MIT Pune)</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('real');
            setEmail('');
            setPassword('');
            setOrganizationCode('');
            setErrorMessage(null);
          }}
          className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            mode === 'real'
              ? 'bg-white text-indigo-700 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-3.5 h-3.5 text-slate-500" />
          <span>Real Institution Sign In</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Demo Personas Picker */}
      {mode === 'demo' && (
        <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
            <span className="flex items-center gap-1.5 text-indigo-900 font-bold">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              Maharashtra Institute of Technology, Pune (MIT_PUNE)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Pass: Password123!</span>
          </div>

          <div className="grid grid-cols-1 gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => handleDemoSelect('admin@mitpune.edu.in', 'MIT_PUNE')}
              className={`p-2 text-left rounded-lg border transition-all flex items-center justify-between ${
                email === 'admin@mitpune.edu.in'
                  ? 'bg-white border-indigo-400 text-indigo-950 font-semibold shadow-xs ring-1 ring-indigo-300'
                  : 'bg-white/80 border-slate-200 text-slate-700 hover:bg-white'
              }`}
            >
              <div>
                <div className="font-semibold text-slate-900">🏛️ Prof. Rajesh Kulkarni</div>
                <div className="text-[11px] text-slate-500">Dean / Institutional Administrator</div>
              </div>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold">
                ADMIN
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoSelect('rahul.mehta@tcs.com', 'MIT_PUNE')}
              className={`p-2 text-left rounded-lg border transition-all flex items-center justify-between ${
                email === 'rahul.mehta@tcs.com'
                  ? 'bg-white border-amber-400 text-amber-950 font-semibold shadow-xs ring-1 ring-amber-300'
                  : 'bg-white/80 border-slate-200 text-slate-700 hover:bg-white'
              }`}
            >
              <div>
                <div className="font-semibold text-slate-900">💼 Rahul Mehta</div>
                <div className="text-[11px] text-slate-500">Tech Lead & Industry Mentor (TCS)</div>
              </div>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                MENTOR
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoSelect('priya.nair@infosys.com', 'MIT_PUNE')}
              className={`p-2 text-left rounded-lg border transition-all flex items-center justify-between ${
                email === 'priya.nair@infosys.com'
                  ? 'bg-white border-amber-400 text-amber-950 font-semibold shadow-xs ring-1 ring-amber-300'
                  : 'bg-white/80 border-slate-200 text-slate-700 hover:bg-white'
              }`}
            >
              <div>
                <div className="font-semibold text-slate-900">💼 Priya Nair</div>
                <div className="text-[11px] text-slate-500">Corporate Project Mentor (Infosys)</div>
              </div>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                MENTOR
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoSelect('aarav.sharma@mitpune.edu.in', 'MIT_PUNE')}
              className={`p-2 text-left rounded-lg border transition-all flex items-center justify-between ${
                email === 'aarav.sharma@mitpune.edu.in'
                  ? 'bg-white border-sky-400 text-sky-950 font-semibold shadow-xs ring-1 ring-sky-300'
                  : 'bg-white/80 border-slate-200 text-slate-700 hover:bg-white'
              }`}
            >
              <div>
                <div className="font-semibold text-slate-900">🎒 Aarav Sharma</div>
                <div className="text-[11px] text-slate-500">B.Tech CSE • Infosys Full-Stack Intern</div>
              </div>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-bold">
                STUDENT
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoSelect('ananya.patil@mitpune.edu.in', 'MIT_PUNE')}
              className={`p-2 text-left rounded-lg border transition-all flex items-center justify-between ${
                email === 'ananya.patil@mitpune.edu.in'
                  ? 'bg-white border-sky-400 text-sky-950 font-semibold shadow-xs ring-1 ring-sky-300'
                  : 'bg-white/80 border-slate-200 text-slate-700 hover:bg-white'
              }`}
            >
              <div>
                <div className="font-semibold text-slate-900">🎒 Ananya Patil</div>
                <div className="text-[11px] text-slate-500">B.Tech ENTC • Tata Elxsi Embedded Intern</div>
              </div>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-bold">
                STUDENT
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Main Sign In Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          label="Institution / Tenant Code"
          type="text"
          value={organizationCode}
          onChange={(e) => setOrganizationCode(e.target.value)}
          placeholder="e.g. MIT_PUNE or your assigned code"
          required
        />

        <FormInput
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@university.edu.in"
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
          <Button
            type="submit"
            size="lg"
            className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 shadow-md hover:shadow-lg transition-all"
            isLoading={isLoading}
          >
            <UserCheck className="w-4 h-4" />
            <span>Sign In to Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </form>

      {/* Registration & Activation Links */}
      <div className="pt-2 border-t border-slate-100 space-y-2 text-xs text-slate-500">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Multi-Tenant Isolation Active
          </span>
          <Link to="/activate" className="text-indigo-600 hover:text-indigo-700 font-medium">
            Activate Invite
          </Link>
        </div>
        <div className="text-center pt-2">
          <span>Are you an institution administrator? </span>
          <Link to="/register-institution" className="text-indigo-600 hover:text-indigo-700 font-semibold underline">
            Register Your University
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
