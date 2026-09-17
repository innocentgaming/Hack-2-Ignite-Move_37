import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '../Card';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { apiClient } from '../../services/apiClient';
import { FacultyWorkspaceDto } from '@internos/types';
import {
  GraduationCap,
  Briefcase,
  AlertTriangle,
  Clock,
  Activity,
  ChevronRight,
  Search,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const FacultyWorkspace: React.FC = () => {
  const [data, setData] = useState<FacultyWorkspaceDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterQuery, setFilterQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchWorkspace = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get<FacultyWorkspaceDto>('/api/v1/workspaces/faculty/dashboard');
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.error?.message || 'Failed to load faculty workspace');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading faculty workspace');
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
          <span className="text-sm font-medium text-slate-500">Loading faculty supervision workspace...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800">
        <p className="font-semibold text-base mb-1">Supervision Telemetry Unavailable</p>
        <p className="text-sm text-rose-600 mb-4">{error || 'Unable to access supervised records.'}</p>
        <Button size="sm" variant="outline" onClick={fetchWorkspace}>
          Retry
        </Button>
      </div>
    );
  }

  const { assignedInternships, activeInternshipsCount, overdueTasks, pendingReviews, attentionCases, recentActivity } = data;

  const filteredInternships = assignedInternships.filter((intern) => {
    const matchesSearch =
      intern.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
      (intern.company?.name && intern.company.name.toLowerCase().includes(filterQuery.toLowerCase())) ||
      (intern.mentor?.name && intern.mentor.name.toLowerCase().includes(filterQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || intern.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hoverable>
          <CardBody className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase">Assigned Interns</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{assignedInternships.length}</div>
              <p className="text-[11px] text-slate-500 mt-0.5">Authorized records</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
          </CardBody>
        </Card>

        <Card hoverable>
          <CardBody className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase">Active Placements</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">{activeInternshipsCount}</div>
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
              <span className="text-xs font-semibold text-slate-500 uppercase">Pending Reviews</span>
              <div className="text-2xl font-black text-indigo-600 mt-1">{pendingReviews.length}</div>
              <p className="text-[11px] text-slate-500 mt-0.5">Submissions awaiting audit</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </CardBody>
        </Card>

        <Card hoverable className={attentionCases.length > 0 ? 'border-amber-300 bg-amber-50/20' : ''}>
          <CardBody className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-amber-700 uppercase">Attention Cases</span>
              <div className="text-2xl font-black text-amber-600 mt-1">{attentionCases.length}</div>
              <p className="text-[11px] text-amber-600 mt-0.5">Overdue & mentor flags</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Attention Cases Alert Section */}
      {attentionCases.length > 0 && (
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50/40 via-white to-amber-50/20">
          <CardHeader
            title="Attention Cases Requiring Faculty Intervention"
            subtitle="Flagged by industry mentors or overdue critical workflow milestones."
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
                      <span className="text-[10px] text-slate-400">Flagged on {new Date(c.timestamp).toLocaleString()}</span>
                    </div>
                  </div>

                  <Link to={`/app/internships/${c.internshipId}`}>
                    <Button size="sm" variant="outline" className="text-xs flex items-center gap-1">
                      Inspect Case
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Assigned Internships Table & Filters */}
      <Card>
        <CardHeader
          title="Supervised Internship Cohort"
          subtitle="All students authorized under your faculty supervision scope."
          action={
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search intern or company..."
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 w-44"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                />
              </div>

              <select
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="APPROVED">APPROVED</option>
                <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>
            </div>
          }
        />
        <CardBody className="p-0">
          {filteredInternships.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">No matching supervised internships found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Internship & Role</th>
                    <th className="px-5 py-3">Company Host</th>
                    <th className="px-5 py-3">Mentor</th>
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
                        {intern.company?.name || 'Company Host'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {intern.mentor?.name || 'Pending assignment'}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge
                          variant={
                            intern.status === 'ACTIVE'
                              ? 'emerald'
                              : intern.status === 'APPROVED'
                              ? 'indigo'
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
                          <Button size="sm" variant="ghost" className="text-xs">
                            View
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

      {/* Supervised Overdue Tasks & Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supervised Overdue Tasks */}
        <Card>
          <CardHeader title="Supervised Overdue Tasks" subtitle="Tasks requiring follow-up with intern." />
          <CardBody className="p-0">
            {overdueTasks.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">All students are current on milestone deadlines!</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {overdueTasks.slice(0, 5).map((t) => (
                  <div key={t.id} className="p-4 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-900 text-xs">{t.title}</span>
                      <p className="text-[11px] text-rose-600">
                        Due: {new Date(t.currentDueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="rose" size="sm">
                      OVERDUE
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Activity Stream */}
        <Card>
          <CardHeader title="Supervision Activity Stream" subtitle="Recent department audit events." />
          <CardBody className="p-0">
            <div className="divide-y divide-slate-100">
              {recentActivity.map((act) => (
                <div key={act.id} className="p-4 flex items-start gap-3">
                  <div className="mt-0.5 w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-slate-800">{act.description}</p>
                    <span className="text-[10px] text-slate-400">{new Date(act.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
