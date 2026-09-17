import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '../Card';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { apiClient } from '../../services/apiClient';
import { HODWorkspaceDto } from '@internos/types';
import {
  Users,
  Briefcase,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Search,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const HODWorkspace: React.FC = () => {
  const [data, setData] = useState<HODWorkspaceDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchWorkspace = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get<HODWorkspaceDto>('/api/v1/workspaces/hod/dashboard');
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.error?.message || 'Failed to load HOD department workspace');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading HOD workspace');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspace();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium text-slate-500">Loading department telemetry...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800">
        <p className="font-semibold text-base mb-1">Department Telemetry Unavailable</p>
        <p className="text-sm text-rose-600 mb-4">{error || 'Unable to access department records.'}</p>
        <Button size="sm" variant="outline" onClick={fetchWorkspace}>
          Retry
        </Button>
      </div>
    );
  }

  const { departmentInternships, facultyAssignments, departmentMonitoring, attentionCases } = data;

  const filteredInternships = departmentInternships.filter((intern) => {
    const matchesSearch =
      intern.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (intern.company?.name && intern.company.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (intern.facultyName && intern.facultyName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || intern.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Department Telemetry Header Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card hoverable>
          <CardBody className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase">Department Total</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{departmentMonitoring.totalStudents}</div>
              <p className="text-[11px] text-slate-500 mt-0.5">Enrolled candidates</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </CardBody>
        </Card>

        <Card hoverable>
          <CardBody className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-700 uppercase">Active Placements</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">{departmentMonitoring.active}</div>
              <p className="text-[11px] text-emerald-700 mt-0.5">Currently working</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
          </CardBody>
        </Card>

        <Card hoverable>
          <CardBody className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase">Pending Approval</span>
              <div className="text-2xl font-black text-amber-600 mt-1">{departmentMonitoring.pendingApproval}</div>
              <p className="text-[11px] text-slate-500 mt-0.5">Requires HOD review</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </CardBody>
        </Card>

        <Card hoverable>
          <CardBody className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase">Completed</span>
              <div className="text-2xl font-black text-indigo-600 mt-1">{departmentMonitoring.completed}</div>
              <p className="text-[11px] text-slate-500 mt-0.5">Graduated interns</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardBody>
        </Card>

        <Card hoverable className={departmentMonitoring.overdueCount > 0 ? 'border-rose-300 bg-rose-50/20' : ''}>
          <CardBody className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-rose-600 uppercase">Overdue Tasks</span>
              <div className="text-2xl font-black text-rose-600 mt-1">{departmentMonitoring.overdueCount}</div>
              <p className="text-[11px] text-rose-500 mt-0.5">Across department</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Attention Cases / Escalations */}
      {attentionCases.length > 0 && (
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50/30 via-white to-amber-50/10">
          <CardHeader
            title="Escalated Mentor Concerns & Department Cases"
            subtitle="Immediate attention required from HOD or department coordinators."
          />
          <CardBody className="p-0">
            <div className="divide-y divide-amber-100">
              {attentionCases.map((c) => (
                <div key={c.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{c.companyName}</span>
                        <Badge variant={c.severity === 'critical' ? 'rose' : 'amber'} size="sm">
                          {c.severity.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-700 font-medium mt-0.5">{c.reason}</p>
                      <span className="text-[10px] text-slate-400">Recorded on {new Date(c.timestamp).toLocaleString()}</span>
                    </div>
                  </div>

                  <Link to={`/app/internships/${c.internshipId}`}>
                    <Button size="sm" variant="outline" className="text-xs flex items-center gap-1">
                      Action Case
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Faculty Assignment Load Distribution Matrix */}
      <Card>
        <CardHeader
          title="Faculty Supervision Distribution Matrix"
          subtitle="Real-time supervision load and student allocation across departmental professors."
        />
        <CardBody className="p-0">
          {facultyAssignments.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">No faculty members currently registered in department.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Faculty Coordinator</th>
                    <th className="px-5 py-3">Assigned Students</th>
                    <th className="px-5 py-3">Active Underway</th>
                    <th className="px-5 py-3">Supervision Load Meter</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {facultyAssignments.map((f) => {
                    const loadPercentage = Math.min(Math.round((f.assignedCount / 10) * 100), 100);

                    return (
                      <tr key={f.facultyId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-slate-900">
                          {f.facultyName || 'Professor'}
                          <div className="text-[11px] text-slate-400 font-normal">ID: {f.facultyId}</div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-800 font-semibold">{f.assignedCount}</td>
                        <td className="px-5 py-3.5 text-emerald-600 font-bold">{f.activeCount}</td>
                        <td className="px-5 py-3.5 w-64">
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  loadPercentage > 80 ? 'bg-rose-500' : loadPercentage > 50 ? 'bg-amber-500' : 'bg-indigo-600'
                                }`}
                                style={{ width: `${loadPercentage}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-medium text-slate-500">{loadPercentage}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Link to="/app/internships">
                            <Button size="sm" variant="ghost" className="text-xs">
                              Manage Assignments
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Department Internships Registry */}
      <Card>
        <CardHeader
          title="Department Internship Cohort"
          subtitle="Complete registry of student placements under this department."
          action={
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search intern or company..."
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 w-44"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <select
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
                <option value="APPROVED">APPROVED</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>
            </div>
          }
        />
        <CardBody className="p-0">
          {filteredInternships.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">No departmental internships found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Role & Title</th>
                    <th className="px-5 py-3">Company Host</th>
                    <th className="px-5 py-3">Faculty Coordinator</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Dates</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInternships.map((intern) => (
                    <tr key={intern.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        {intern.title}
                        <div className="text-[11px] text-slate-400 font-normal">ID: {intern.id}</div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-700 font-medium">
                        {intern.company?.name || 'Partner Host'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {intern.facultyName || 'Unassigned'}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge
                          variant={
                            intern.status === 'ACTIVE'
                              ? 'emerald'
                              : intern.status === 'PENDING_APPROVAL'
                              ? 'amber'
                              : 'slate'
                          }
                          size="sm"
                        >
                          {intern.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 text-[11px]">
                        {new Date(intern.startDate).toLocaleDateString()} — {new Date(intern.endDate).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link to={`/app/internships/${intern.id}`}>
                          <Button size="sm" variant="outline" className="text-xs">
                            Inspect
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};
