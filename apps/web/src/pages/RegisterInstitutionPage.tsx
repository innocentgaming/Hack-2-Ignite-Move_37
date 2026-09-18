import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { FormInput } from '../components/FormInput';
import { apiClient } from '../services/apiClient';
import { Building2, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { RegisterInstitutionDto, RegisterInstitutionResponseData } from '@internos/types';

export const RegisterInstitutionPage: React.FC = () => {
  const navigate = useNavigate();

  // Institution details
  const [institutionName, setInstitutionName] = useState('');
  const [institutionCode, setInstitutionCode] = useState('');
  const [officialEmail, setOfficialEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [institutionType, setInstitutionType] = useState('Autonomous Engineering College');
  const [accreditation, setAccreditation] = useState('NAAC A++ & NBA Accredited');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('India');

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
      setErrorMessage('Institution name, code, and official institutional email are required.');
      return;
    }

    // Indian PIN Code validation: 6 digits
    const cleanedPin = postalCode.trim();
    if (cleanedPin && !/^\d{6}$/.test(cleanedPin)) {
      setErrorMessage('Please enter a valid 6-digit Indian PIN code (e.g. 411038).');
      return;
    }

    // Indian Phone validation: 10 digits starting with 6-9
    const cleanedPhone = phoneNumber.trim().replace(/^(\+91|0)/, '');
    if (cleanedPhone && !/^[6-9]\d{9}$/.test(cleanedPhone)) {
      setErrorMessage('Please enter a valid 10-digit Indian phone number (e.g. 9823012345).');
      return;
    }

    if (!adminEmail.trim() || !adminFirstName.trim() || !adminLastName.trim()) {
      setErrorMessage('Primary university administrator name and email are required.');
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
      setErrorMessage('You must accept institutional governance and data isolation terms.');
      return;
    }

    setLoading(true);
    try {
      const payload: RegisterInstitutionDto = {
        institutionName: institutionName.trim(),
        institutionCode: institutionCode.trim().toUpperCase(),
        officialEmail: officialEmail.trim().toLowerCase(),
        website: website.trim() || undefined,
        institutionType,
        accreditationDetails: accreditation,
        phoneNumber: cleanedPhone ? `+91${cleanedPhone}` : undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        pincode: cleanedPin || undefined,
        country: country.trim() || 'India',
        adminFirstName: adminFirstName.trim(),
        adminLastName: adminLastName.trim(),
        adminEmail: adminEmail.trim().toLowerCase(),
        password: adminPassword,
      };

      const res = await apiClient.post<RegisterInstitutionResponseData>('/api/v1/auth/register-institution', payload);

      if (res.success && res.data) {
        localStorage.setItem('internos_token', res.data.token);
        localStorage.setItem('internos_user', JSON.stringify(res.data.user));
        
        const tenantName = res.data.organization?.name || res.data.user?.organizationName || institutionName;
        setSuccessMessage(`Tenant "${tenantName}" provisioned successfully! Redirecting to your Admin Dashboard...`);

        setTimeout(() => {
          navigate('/app/dashboard');
        }, 1200);
      } else {
        const errorDetails = Array.isArray(res.error?.details)
          ? res.error.details.map((d: any) => `${d.path?.join('.') || ''}: ${d.message || d}`).join(' | ')
          : (typeof res.error?.details === 'string' ? res.error.details : '');
        setErrorMessage(errorDetails || res.error?.message || 'Institution onboarding failed.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Network error during institution registration.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6 max-w-2xl w-full mx-auto my-3 sm:my-6">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Login</span>
        </Link>
        <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
          UGC & AICTE Compliant
        </span>
      </div>

      <div className="space-y-1 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-1">
          <Building2 className="w-3.5 h-3.5" />
          <span>Real Indian College & University Onboarding</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Register Your Institution</h2>
        <p className="text-xs text-slate-500">
          Set up an isolated multi-tenant internship governance platform for your university, autonomous college, or institute.
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
            1. Institution Profile & Recognition
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormInput
              label="Institution Full Name"
              value={institutionName}
              onChange={(e) => setInstitutionName(e.target.value)}
              placeholder="e.g. Pune Institute of Computer Technology"
              required
            />
            <FormInput
              label="Institution / Tenant Code"
              value={institutionCode}
              onChange={(e) => setInstitutionCode(e.target.value.toUpperCase())}
              placeholder="e.g. PICT_PUNE"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Institution Type</label>
              <select
                value={institutionType}
                onChange={(e) => setInstitutionType(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Autonomous Engineering College">Autonomous Engineering College</option>
                <option value="State University">State University</option>
                <option value="Central University">Central University</option>
                <option value="Deemed-to-be University">Deemed-to-be University</option>
                <option value="Institute of National Importance (IIT/NIT/IIIT)">Institute of National Importance (IIT/NIT/IIIT)</option>
                <option value="Private University">Private University</option>
                <option value="Affiliated Engineering College">Affiliated Engineering College</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Accreditation & Approval</label>
              <select
                value={accreditation}
                onChange={(e) => setAccreditation(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="NAAC A++ & NBA Accredited">NAAC A++ & NBA Accredited</option>
                <option value="NAAC A+ Accredited">NAAC A+ Accredited</option>
                <option value="NAAC A Accredited">NAAC A Accredited</option>
                <option value="NBA Accredited (All Branches)">NBA Accredited (All Branches)</option>
                <option value="AICTE Approved & UGC Recognized">AICTE Approved & UGC Recognized</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormInput
              label="Official Institutional Email"
              type="email"
              value={officialEmail}
              onChange={(e) => setOfficialEmail(e.target.value)}
              placeholder="registrar@pict.edu.in"
              required
            />
            <FormInput
              label="Official Website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://www.pict.edu"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormInput
              label="Campus Phone Number (10 Digits)"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g. 9822012345"
            />
            <FormInput
              label="PIN Code (6 Digits)"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="e.g. 411043"
            />
          </div>

          <FormInput
            label="Campus Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Survey No. 27, Near Trimurti Chowk, Dhankawadi"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormInput
              label="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Pune"
            />
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Maharashtra">Maharashtra</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Delhi NCR">Delhi NCR</option>
                <option value="Telangana">Telangana</option>
                <option value="Gujarat">Gujarat</option>
                <option value="Uttar Pradesh">Uttar Pradesh</option>
                <option value="West Bengal">West Bengal</option>
                <option value="Madhya Pradesh">Madhya Pradesh</option>
                <option value="Kerala">Kerala</option>
                <option value="Rajasthan">Rajasthan</option>
                <option value="Punjab">Punjab</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <FormInput
              label="Country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="India"
              disabled
            />
          </div>
        </div>

        {/* Section 2: Primary Administrator */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            2. Primary University Administrator Account
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormInput
              label="First Name"
              value={adminFirstName}
              onChange={(e) => setAdminFirstName(e.target.value)}
              placeholder="e.g. Ramesh"
              required
            />
            <FormInput
              label="Last Name"
              value={adminLastName}
              onChange={(e) => setAdminLastName(e.target.value)}
              placeholder="e.g. Joshi"
              required
            />
          </div>

          <FormInput
            label="Administrator Email (Login)"
            type="email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            placeholder="dean.academics@pict.edu.in"
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
              I confirm that I am an authorized administrative representative of this educational institution, and agree to isolated tenant data governance under InternOS policies.
            </span>
          </label>
        </div>

        <div className="space-y-3 pt-2">
          <Button type="submit" variant="primary" size="lg" className="w-full gap-2 text-sm bg-indigo-600 hover:bg-indigo-700" isLoading={loading}>
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
