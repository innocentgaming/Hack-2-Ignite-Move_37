import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { FormInput } from '../components/FormInput';
import { apiClient } from '../services/apiClient';
import { Building2, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { RegisterInstitutionDto, RegisterInstitutionResponseData } from '@internos/types';

export const RegisterInstitutionPage: React.FC = () => {
  // Institution details
  const [institutionName, setInstitutionName] = useState('');
  const [institutionCode, setInstitutionCode] = useState('');
  const [officialEmail, setOfficialEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('United States');

  // Administrator details
  const [adminFirstName, setAdminFirstName] = useState('');
  const [adminLastName, setAdminLastName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(true);

  // States
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!institutionName.trim() || !institutionCode.trim() || !officialEmail.trim()) {
      setErrorMessage('Institution name, code, and official email are required.');
      return;
    }

    if (!adminEmail.trim() || !adminFirstName.trim() || !adminLastName.trim()) {
      setErrorMessage('Primary administrator information is required.');
      return;
    }

    if (adminPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (adminPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (!acceptedTerms) {
      setErrorMessage('You must accept institutional governance terms.');
      return;
    }

    setLoading(true);
    try {
      const payload: RegisterInstitutionDto = {
        institutionName: institutionName.trim(),
        institutionCode: institutionCode.trim().toUpperCase(),
        officialEmail: officialEmail.trim().toLowerCase(),
        website: website.trim() || undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        country: country.trim() || undefined,
        adminFirstName: adminFirstName.trim(),
        adminLastName: adminLastName.trim(),
        adminEmail: adminEmail.trim().toLowerCase(),
        password: adminPassword,
      };

      const res = await apiClient.post<RegisterInstitutionResponseData>('/api/v1/auth/register-institution', payload);

      if (res.success && res.data) {
        // Store JWT token
        localStorage.setItem('internos_token', res.data.token);
        localStorage.setItem('internos_user', JSON.stringify(res.data.user));
        
        const tenantName = res.data.organization?.name || res.data.user?.organizationName || institutionName;
        setSuccessMessage(`Tenant "${tenantName}" provisioned successfully! Redirecting to your Admin Dashboard...`);

        setTimeout(() => {
          window.location.href = '/app/dashboard';
        }, 1200);
      } else {
        setErrorMessage(res.error?.message || 'Institution onboarding failed.');
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Network error during institution registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 space-y-6 max-w-2xl w-full mx-auto my-6">
      <div className="space-y-1 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-2">
          <Building2 className="w-3.5 h-3.5" />
          <span>Real College & University Onboarding</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Register Your Institution</h2>
        <p className="text-xs text-slate-500">
          Set up an isolated multi-tenant internship governance platform for your university or college.
        </p>
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
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: College / University Metadata */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-indigo-600" />
            1. Institution Profile
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormInput
              label="Institution Full Name"
              value={institutionName}
              onChange={(e) => setInstitutionName(e.target.value)}
              placeholder="e.g. Stanford University"
              required
            />
            <FormInput
              label="Institution Code"
              value={institutionCode}
              onChange={(e) => setInstitutionCode(e.target.value.toUpperCase())}
              placeholder="e.g. STANFORD"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormInput
              label="Official Institutional Email"
              type="email"
              value={officialEmail}
              onChange={(e) => setOfficialEmail(e.target.value)}
              placeholder="registrar@stanford.edu"
              required
            />
            <FormInput
              label="Official Website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://www.stanford.edu"
            />
          </div>

          <FormInput
            label="Street Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="450 Jane Stanford Way"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormInput
              label="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Stanford"
            />
            <FormInput
              label="State / Province"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="CA"
            />
            <FormInput
              label="Country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="United States"
            />
          </div>
        </div>

        {/* Section 2: Primary Administrator */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            2. Primary Administrator Account
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormInput
              label="First Name"
              value={adminFirstName}
              onChange={(e) => setAdminFirstName(e.target.value)}
              placeholder="John"
              required
            />
            <FormInput
              label="Last Name"
              value={adminLastName}
              onChange={(e) => setAdminLastName(e.target.value)}
              placeholder="Doe"
              required
            />
          </div>

          <FormInput
            label="Administrator Email (Login)"
            type="email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            placeholder="admin@stanford.edu"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormInput
              label="Password"
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <FormInput
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        {/* Terms */}
        <div className="pt-2">
          <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>
              I confirm that I am an authorized administrative representative of this institution, and I agree to isolated tenant data governance.
            </span>
          </label>
        </div>

        <div className="space-y-3 pt-2">
          <Button type="submit" variant="primary" size="lg" className="w-full gap-2 text-sm" isLoading={loading}>
            <span>Provision Institution & Launch Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Button>

          <div className="text-center">
            <Link to="/login" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
              Already registered or want to use the Demo Environment? Sign In →
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
};

export default RegisterInstitutionPage;
