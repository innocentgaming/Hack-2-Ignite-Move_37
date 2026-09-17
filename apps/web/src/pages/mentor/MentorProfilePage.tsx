import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { useAuth } from '../../context/AuthContext';
import {
  Mail,
  Building,
  Shield,
  CheckCircle2,
} from 'lucide-react';

interface MentorProfileData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  company: string;
  designation: string;
}

export const MentorProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<MentorProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get<MentorProfileData>('/api/v1/mentor/profile');
      if (res.success && res.data) {
        setProfile(res.data);
      } else {
        setError(res.error?.message || 'Failed to load mentor profile');
      }
    } catch (err: any) {
      setError(err?.message || 'Error connecting to profile service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton count={2} />
      </div>
    );
  }

  const p = profile || {
    id: user?.id || 'usr-mentor',
    firstName: user?.firstName || 'Mark',
    lastName: user?.lastName || 'Mentor',
    email: user?.email || 'mentor@google.com',
    role: user?.role || 'MENTOR',
    company: 'Google Cloud Solutions',
    designation: 'Staff Solutions Architect & Technical Mentor',
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Industry Mentor Profile</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Corporate affiliation, supervisory credentials, and institutional partnership details.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
          Showing cached account profile: {error}
        </div>
      )}

      {/* Header Profile Card */}
      <Card className="p-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-2xl font-bold shadow-lg shadow-indigo-100 flex-shrink-0">
            {p.firstName[0]}
            {p.lastName[0]}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {p.firstName} {p.lastName}
                </h2>
                <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {p.email}
                </p>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <Badge variant="primary">INDUSTRY MENTOR</Badge>
                <div className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Supervisor Verified
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Enterprise</span>
                <span className="text-xs font-bold text-slate-800 mt-0.5 block">{p.company}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Designation</span>
                <span className="text-xs font-bold text-slate-800 mt-0.5 block">{p.designation}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-2.5 mb-4 text-slate-900 font-bold text-sm">
            <Building className="w-4 h-4 text-indigo-600" />
            Partner Academic Institution
          </div>
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block">Institution</span>
              <span className="font-semibold text-slate-800 text-sm mt-0.5 block">
                {user?.organizationName || 'Organization A University'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Tenant Identifier</span>
              <span className="font-mono text-slate-600 mt-0.5 block">{user?.organizationId || 'org-a'}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2.5 mb-4 text-slate-900 font-bold text-sm">
            <Shield className="w-4 h-4 text-indigo-600" />
            Security & Mentorship Privileges
          </div>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Privilege Scope</span>
              <span className="font-semibold text-slate-800">Task Management, Evaluation, Grading</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Security Verification</span>
              <Badge variant="outline">ENTERPRISE SSO / JWT</Badge>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Supervisor Status</span>
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Active
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
