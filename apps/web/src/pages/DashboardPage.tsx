import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardBody } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { FormInput } from '../components/FormInput';
import {
  UserRole,
  InternshipDto,
  AdminDashboardMetrics,
} from '@internos/types';
import { normalizeRole } from '@internos/shared';
import { apiClient } from '../services/apiClient';
import { Link, Navigate } from 'react-router-dom';
import {
  Briefcase,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  UserPlus,
  BookOpen,
  Copy,
  Check,
  FileSpreadsheet,
  GraduationCap,
  Award,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const rawRole = user?.role || UserRole.STUDENT;
  const role = normalizeRole(rawRole);

  // Authenticated user's role directly determines their workspace
  if (role === UserRole.STUDENT) {
    return <Navigate to="/app/student" replace />;
  }
  if (role === UserRole.MENTOR) {
    return <Navigate to="/app/mentor" replace />;
  }

  const [internships, setInternships] = useState<InternshipDto[]>([]);
  const [adminMetrics, setAdminMetrics] = useState<AdminDashboardMetrics | null>(null);

  // User Invite Form State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFirstName, setInviteFirstName] = useState('');
  const [inviteLastName, setInviteLastName] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>(UserRole.STUDENT);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState<{ activationUrl: string; email: string } | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadTenantData() {
      try {
        const internRes = await apiClient.get<InternshipDto[]>('/api/v1/tenants/internships');
        if (internRes.success && internRes.data) {
          setInternships(internRes.data);
        }
      } catch {
        // ignore
      }

      // Fetch Real Metrics if Admin
      if (role === UserRole.ADMIN) {
        try {
          const res = await apiClient.get<AdminDashboardMetrics>('/api/v1/admin/dashboards/admin');
          if (res.success && res.data) setAdminMetrics(res.data);
        } catch {
          // ignore
        }
      }
    }

    loadTenantData();
  }, [user?.organizationId, role]);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    setInviteError(null);
    setInviteSuccess(null);
    setCopied(false);

    try {
      const res = await apiClient.post<{
        userId: string;
        email: string;
        role: UserRole;
        activationUrl: string;
      }>('/api/v1/auth/invite', {
        email: inviteEmail,
        firstName: inviteFirstName,
        lastName: inviteLastName,
        role: inviteRole,
      });

      if (res.success && res.data) {
        setInviteSuccess({
          activationUrl: res.data.activationUrl,
          email: res.data.email,
        });
        setInviteEmail('');
        setInviteFirstName('');
        setInviteLastName('');
      } else {
        setInviteError(res.error?.message || 'Failed to send invite');
      }
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Error sending invite');
    } finally {
      setInviteLoading(false);
    }
  };

  const copyActivationLink = () => {
    if (inviteSuccess?.activationUrl) {
      navigator.clipboard.writeText(inviteSuccess.activationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 md:p-8 text-white border border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Workspace Active • {user?.organizationName} ({user?.organizationCode})</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Hello, {user?.firstName} {user?.lastName} ({role})
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl">
            Institutional Administrator: Manage institution profile, department registry, student CSV bulk imports, and user roles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="indigo" size="md">
            Role: {role}
          </Badge>
        </div>
      </div>

      {/* Real Dynamic Metrics: ADMIN DASHBOARD */}
      {adminMetrics && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Institutional Telemetry (Real Backend Data)
            </h2>
            <div className="flex items-center gap-2">
              <Link to="/app/admin/students/import">
                <Button size="sm" variant="outline" className="text-xs flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
                  CSV Ingestion
                </Button>
              </Link>
              <Link to="/app/admin/departments">
                <Button size="sm" variant="outline" className="text-xs flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                  Departments
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card hoverable>
              <CardBody className="p-5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase">Total Students</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">{adminMetrics.totalStudents}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Enrolled</div>
                </div>
                <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5" />
                </div>
              </CardBody>
            </Card>

            <Card hoverable>
              <CardBody className="p-5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase">Departments</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">{adminMetrics.totalDepartments}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Academic Units</div>
                </div>
                <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
              </CardBody>
            </Card>

            <Card hoverable>
              <CardBody className="p-5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase">Total Mentors</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">{adminMetrics.totalMentors}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Industry Partners</div>
                </div>
                <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
              </CardBody>
            </Card>

            <Card hoverable>
              <CardBody className="p-5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase">Departments</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">{adminMetrics.totalDepartments}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Active Academic</div>
                </div>
                <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
              </CardBody>
            </Card>

            <Card hoverable>
              <CardBody className="p-5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase">Active Internships</span>
                  <div className="text-2xl font-black text-emerald-600 mt-1">{adminMetrics.activeInternships}</div>
                  <div className="text-[11px] text-emerald-700 mt-0.5">Underway</div>
                </div>
                <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Briefcase className="w-5 h-5" />
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {/* Admin Shell */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Admin & HOD: User Invite & Provisioning Module */}
          {hasPermission('users:invite') && (
            <Card>
              <CardHeader
                title="Tenant User Provisioning & Invites"
                subtitle="Invite new members to your institution with secure activation tokens"
                action={<Badge variant="indigo">Permission: users:invite</Badge>}
              />
              <CardBody className="space-y-4">
                {inviteSuccess && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-emerald-800 text-xs">
                    <div className="font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Invitation generated for {inviteSuccess.email}!
                    </div>
                    <div className="flex items-center gap-2 bg-white p-2 rounded border border-emerald-200 font-mono text-[11px]">
                      <span className="truncate flex-1">{inviteSuccess.activationUrl}</span>
                      <button
                        type="button"
                        onClick={copyActivationLink}
                        className="px-2 py-1 bg-emerald-600 text-white rounded text-xs flex items-center gap-1 hover:bg-emerald-700"
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                )}

                {inviteError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
                    {inviteError}
                  </div>
                )}

                <form onSubmit={handleInviteSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    label="User Email Address"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@institution.edu"
                    required
                  />

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Target Role</label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value={UserRole.STUDENT}>STUDENT (Intern)</option>
                      <option value={UserRole.MENTOR}>MENTOR (Industry / Academic Mentor)</option>
                      <option value={UserRole.ADMIN}>ADMIN (University Administrator)</option>
                    </select>
                  </div>

                  <FormInput
                    label="First Name"
                    type="text"
                    value={inviteFirstName}
                    onChange={(e) => setInviteFirstName(e.target.value)}
                    placeholder="e.g. John"
                    required
                  />

                  <FormInput
                    label="Last Name"
                    type="text"
                    value={inviteLastName}
                    onChange={(e) => setInviteLastName(e.target.value)}
                    placeholder="e.g. Doe"
                    required
                  />

                  <div className="md:col-span-2 pt-2">
                    <Button type="submit" size="md" className="gap-2" isLoading={inviteLoading}>
                      <UserPlus className="w-4 h-4" />
                      <span>Issue Organization Invite</span>
                    </Button>
                  </div>
                </form>
              </CardBody>
            </Card>
          )}

          {/* Active Internships List Scoped to Tenant */}
          <Card>
            <CardHeader
              title={`Tenant Internships (${user?.organizationCode})`}
              subtitle="All records are strictly constrained by organizationId"
              action={<Badge variant="slate">{internships.length} Registered</Badge>}
            />
            <CardBody className="space-y-3">
              {internships.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">No internships active for this tenant.</div>
              ) : (
                internships.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                        <div className="text-xs text-slate-500">
                          Type: {item.type} &bull; Tenant: {item.organizationId}
                        </div>
                      </div>
                    </div>
                    <Badge variant={item.status === 'ACTIVE' ? 'emerald' : 'indigo'}>
                      {item.status}
                    </Badge>
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </div>

        {/* Right Column (1 Col) */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Tenant Isolation Engine" subtitle="Phase 2 Architectural Guarantee" />
            <CardBody className="space-y-4 text-xs">
              <div className="space-y-2">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Tenant Name:</span>
                  <span className="font-semibold text-slate-800">{user?.organizationName}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Tenant Code:</span>
                  <span className="font-mono text-slate-800">{user?.organizationCode}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Active Role:</span>
                  <Badge variant="indigo" size="sm">{role}</Badge>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Cross-Tenant SELECT:</span>
                  <span className="text-rose-600 font-semibold">Blocked (403)</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Cross-Tenant CSV Ingest:</span>
                  <span className="text-rose-600 font-semibold">Blocked (403)</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Cross-Tenant Admin:</span>
                  <span className="text-rose-600 font-semibold">Blocked (403)</span>
                </div>
              </div>

              <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 text-slate-600">
                <p className="font-semibold text-indigo-900 mb-1">Zero-Trust Multi-Tenancy:</p>
                Inbound organizationId from URL, query, or body is rejected. The API derives organizationId strictly from the cryptographically verified JWT.
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};
