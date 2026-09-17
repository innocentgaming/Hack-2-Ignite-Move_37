import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { FormInput } from '../components/FormInput';
import { ShieldCheck, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export const ActivateAccountPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { activateAccount, isLoading } = useAuth();

  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const queryToken = searchParams.get('token');
    if (queryToken) {
      setToken(queryToken);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }

    const res = await activateAccount({ token, password });

    if (res.success) {
      setSuccessMessage(res.message || 'Account activated successfully!');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } else {
      setErrorMessage(res.error || 'Account activation failed');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 space-y-6 max-w-md w-full mx-auto">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Activate Your InternOS Account</h2>
        <p className="text-xs text-slate-500">Set your secure password to complete account activation</p>
      </div>

      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-emerald-700 text-xs">
          <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{successMessage} Redirecting to login...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          label="Activation Token"
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Paste your activation token here"
          required
        />

        <FormInput
          label="New Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Minimum 6 characters"
          required
        />

        <FormInput
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-type your password"
          required
        />

        <div className="pt-2">
          <Button type="submit" size="lg" className="w-full gap-2" isLoading={isLoading} disabled={!!successMessage}>
            <span>Activate Account</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </form>

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          bcrypt SHA-512 Security
        </span>
        <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
          Back to Login
        </Link>
      </div>
    </div>
  );
};
