import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '../components/Card';
import { Button } from '../components/Button';
import { FormInput } from '../components/FormInput';
import { apiClient } from '../services/apiClient';
import { InstitutionProfileDto, InstitutionSettingsDto } from '@internos/types';
import { Settings, Save, CheckCircle2, ShieldAlert, School } from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const [profile, setProfile] = useState<InstitutionProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [institutionName, setInstitutionName] = useState('');
  const [domain, setDomain] = useState('');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [semester, setSemester] = useState('Fall');
  const [durationWeeks, setDurationWeeks] = useState(12);
  const [contactEmail, setContactEmail] = useState('');

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      try {
        const res = await apiClient.get<InstitutionProfileDto>('/api/v1/admin/institution');
        if (res.success && res.data) {
          setProfile(res.data);
          setInstitutionName(res.data.name);
          setDomain(res.data.domain || '');
          const s = res.data.settings || {};
          setAcademicYear(s.academicYear || '2026-2027');
          setSemester(s.semester || 'Fall');
          setDurationWeeks(s.defaultInternshipDurationWeeks || 12);
          setContactEmail(s.contactEmail || '');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);

    try {
      const updatedSettings: InstitutionSettingsDto = {
        academicYear,
        semester,
        defaultInternshipDurationWeeks: durationWeeks,
        contactEmail,
      };

      const res = await apiClient.put<InstitutionProfileDto>('/api/v1/admin/institution', {
        name: institutionName,
        domain,
        settings: updatedSettings,
      });

      if (res.success && res.data) {
        setProfile(res.data);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        throw new Error(res.error?.message || 'Failed to save settings');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading institution configuration...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-7 h-7 text-indigo-600" />
          Institution Profile & Configuration
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure institutional identity, academic calendars, and internship lifecycle parameters.
        </p>
      </div>

      {success && (
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>Institution parameters and settings successfully updated.</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <School className="w-5 h-5 text-indigo-600" />
              Institutional Identity
            </h3>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                label="Institution Name"
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                required
              />
              <FormInput
                label="Tenant Domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="university.edu"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Unique Identifier Code</label>
              <input
                readOnly
                value={profile?.code || ''}
                className="w-full font-mono text-xs p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 select-all"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Organization codes are immutable to ensure complete tenant boundary integrity.
              </p>
            </div>
          </CardBody>
        </Card>

        {/* Academic Calendar Settings */}
        <Card>
          <CardHeader>
            <h3 className="text-base font-semibold text-slate-900">Academic & Internship Workflow Settings</h3>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormInput
                label="Current Academic Year"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="2026-2027"
              />
              <FormInput
                label="Semester"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                placeholder="Fall"
              />
              <FormInput
                label="Default Duration (Weeks)"
                type="number"
                value={durationWeeks}
                onChange={(e) => setDurationWeeks(parseInt(e.target.value, 10) || 12)}
              />
            </div>

            <FormInput
              label="Administrative Contact Email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="internships-office@university.edu"
            />
          </CardBody>
        </Card>

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={saving} className="flex items-center gap-2">
            <Save className="w-4 h-4" />
            {saving ? 'Saving Settings...' : 'Save Configuration'}
          </Button>
        </div>
      </form>
    </div>
  );
};
