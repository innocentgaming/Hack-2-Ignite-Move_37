import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardBody } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { apiClient } from '../services/apiClient';
import {
  MonitoringOverviewDto,
  MonitoredInternshipDto,
  AttentionQueueItemDto,
  LifecycleTimelineEventDto,
  InternshipHealthStatus,
  UserRole,
  DepartmentDto,
  CompanyDto,
} from '@internos/types';
import { normalizeRole } from '@internos/shared';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  Building2,
  RefreshCw,
  X,
  FileCheck,
  Calendar,
  Layers,
  ChevronRight,
} from 'lucide-react';

export const MonitoringPage: React.FC = () => {
  const { user } = useAuth();
  const rawRole = user?.role || UserRole.STUDENT;
  const role = normalizeRole(rawRole);

  const [activeTab, setActiveTab] = useState<'all' | 'attention'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data State
  const [overview, setOverview] = useState<MonitoringOverviewDto | null>(null);
  const [internships, setInternships] = useState<MonitoredInternshipDto[]>([]);
  const [attentionQueue, setAttentionQueue] = useState<AttentionQueueItemDto[]>([]);
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [companies, setCompanies] = useState<CompanyDto[]>([]);

  // Filter State
  const [healthFilter, setHealthFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [companyFilter, setCompanyFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals / Inspectors
  const [selectedCase, setSelectedCase] = useState<AttentionQueueItemDto | null>(null);
  const [timelineInternshipId, setTimelineInternshipId] = useState<string | null>(null);
  const [timelineInternshipTitle, setTimelineInternshipTitle] = useState<string>('');
  const [timelineEvents, setTimelineEvents] = useState<LifecycleTimelineEventDto[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

  // Fetch initial datasets
  const fetchOverview = async () => {
    try {
      const res = await apiClient.get<MonitoringOverviewDto>('/api/v1/monitoring/overview');
      if (res.success && res.data) setOverview(res.data);
    } catch {
      // ignore
    }
  };

  const fetchInternships = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (healthFilter !== 'ALL') queryParams.append('health', healthFilter);
      if (statusFilter !== 'ALL') queryParams.append('status', statusFilter);
      if (deptFilter !== 'ALL') queryParams.append('departmentId', deptFilter);
      if (companyFilter !== 'ALL') queryParams.append('companyId', companyFilter);
      if (searchQuery.trim()) queryParams.append('search', searchQuery.trim());

      const url = `/api/v1/monitoring/internships?${queryParams.toString()}`;
      const res = await apiClient.get<MonitoredInternshipDto[]>(url);
      if (res.success && res.data) {
        setInternships(res.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load monitored internships');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttentionQueue = async () => {
    try {
      const res = await apiClient.get<AttentionQueueItemDto[]>('/api/v1/monitoring/attention-queue');
      if (res.success && res.data) {
        setAttentionQueue(res.data);
      }
    } catch {
      // ignore
    }
  };

  const fetchMetadata = async () => {
    try {
      const [deptRes, compRes] = await Promise.all([
        apiClient.get<DepartmentDto[]>('/api/v1/tenants/departments'),
        apiClient.get<CompanyDto[]>('/api/v1/companies'),
      ]);
      if (deptRes.success && deptRes.data) setDepartments(deptRes.data);
      if (compRes.success && compRes.data) setCompanies(compRes.data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchOverview();
    fetchMetadata();
    fetchAttentionQueue();
  }, [user?.organizationId]);

  useEffect(() => {
    fetchInternships();
  }, [healthFilter, statusFilter, deptFilter, companyFilter, user?.organizationId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInternships();
  };

  const openTimeline = async (internshipId: string, title: string) => {
    setTimelineInternshipId(internshipId);
    setTimelineInternshipTitle(title);
    setTimelineLoading(true);
    try {
      const res = await apiClient.get<LifecycleTimelineEventDto[]>(`/api/v1/monitoring/internships/${internshipId}/timeline`);
      if (res.success && res.data) {
        setTimelineEvents(res.data);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load timeline');
    } finally {
      setTimelineLoading(false);
    }
  };

  const getHealthBadge = (status: InternshipHealthStatus) => {
    switch (status) {
      case 'ON_TRACK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            ON TRACK
          </span>
        );
      case 'ATTENTION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            ATTENTION
          </span>
        );
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-900 border border-rose-300">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            CRITICAL
          </span>
        );
    }
  };

  const getScopeTitle = () => {
    if (role === UserRole.ADMIN) return 'Institution-Level Health Monitoring';
    if (role === UserRole.HOD) return 'Department Health Monitoring';
    return 'Supervised Internships Health Monitoring';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{getScopeTitle()}</h1>
            <Badge variant="indigo">Deterministic Engine (Phase 7)</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Deterministic rule-based monitoring with visible, explainable reasons & zero AI inference.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              fetchOverview();
              fetchInternships();
              fetchAttentionQueue();
            }}
            className="gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Metrics</span>
          </Button>
        </div>
      </div>

      {/* Top Metrics Cards (Strictly Calculated from DB) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-medium text-slate-500 truncate">Total Internships</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{overview?.totalInternships ?? 0}</div>
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-medium text-slate-500 truncate">Active Cohort</div>
          <div className="text-xl font-bold text-indigo-600 mt-1">{overview?.active ?? 0}</div>
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-medium text-slate-500 truncate">Completed</div>
          <div className="text-xl font-bold text-slate-700 mt-1">{overview?.completed ?? 0}</div>
        </div>
        <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200 shadow-sm">
          <div className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> On Track
          </div>
          <div className="text-xl font-bold text-emerald-700 mt-1">{overview?.onTrack ?? 0}</div>
        </div>
        <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200 shadow-sm">
          <div className="text-[11px] font-semibold text-amber-800 flex items-center gap-1 truncate">
            <AlertTriangle className="w-3 h-3 text-amber-600" /> Attention
          </div>
          <div className="text-xl font-bold text-amber-700 mt-1">{overview?.attention ?? 0}</div>
        </div>
        <div className="p-3.5 bg-rose-50/70 rounded-xl border border-rose-200 shadow-sm">
          <div className="text-[11px] font-semibold text-rose-800 flex items-center gap-1 truncate">
            <AlertCircle className="w-3 h-3 text-rose-600" /> Critical
          </div>
          <div className="text-xl font-bold text-rose-700 mt-1">{overview?.critical ?? 0}</div>
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-medium text-slate-500 truncate">Overdue Tasks</div>
          <div className="text-xl font-bold text-rose-600 mt-1">{overview?.overdue ?? 0}</div>
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-medium text-slate-500 truncate">Pending Reviews</div>
          <div className="text-xl font-bold text-amber-600 mt-1">{overview?.pendingReviews ?? 0}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-sm font-medium">
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'all'
              ? 'border-indigo-600 text-indigo-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>All Monitored Internships</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
            {internships.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('attention')}
          className={`pb-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'attention'
              ? 'border-rose-600 text-rose-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>Dedicated Attention Queue</span>
          {attentionQueue.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold animate-pulse">
              {attentionQueue.length}
            </span>
          )}
        </button>
      </div>

      {/* Filters Bar */}
      <Card>
        <CardBody className="p-4">
          <div className="space-y-3">
            {/* Top row: Health Status Quick Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Health:
              </span>
              {[
                { id: 'ALL', label: 'All Statuses' },
                { id: 'ON_TRACK', label: '🟢 On Track' },
                { id: 'ATTENTION', label: '🟡 Attention' },
                { id: 'CRITICAL', label: '🔴 Critical' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setHealthFilter(pill.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    healthFilter === pill.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Bottom row: Multi-dimensional Selects */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Department</label>
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Company</label>
                <select
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">All Companies</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Internship Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">All Stages</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="PENDING_APPROVAL">PENDING APPROVAL</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Search Keyword</label>
                <form onSubmit={handleSearchSubmit} className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Candidate, title, company..."
                    className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </form>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Main Tab Views */}
      {activeTab === 'all' && (
        <Card>
          <CardHeader
            title="Monitored Internships Directory"
            subtitle="Every health status contains deterministic, visible reasons"
            action={<Badge variant="slate">{internships.length} Results</Badge>}
          />
          <CardBody className="p-0">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-500">Loading monitored records...</div>
            ) : error ? (
              <div className="p-6 text-center text-xs text-rose-600">{error}</div>
            ) : internships.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No matching internships found for this filter.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Internship & Candidate</th>
                      <th className="py-3 px-4">Company & Supervisors</th>
                      <th className="py-3 px-4">Health Status</th>
                      <th className="py-3 px-4">Deterministic Reasons</th>
                      <th className="py-3 px-4">Signals & Metrics</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {internships.map((row) => (
                      <tr key={row.internship.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{row.internship.title}</div>
                          <div className="text-[11px] text-slate-500">
                            {row.studentName} &bull; {row.departmentName || 'General Dept'}
                          </div>
                          <div className="mt-1">
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                              {row.internship.status}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-600">
                          <div className="flex items-center gap-1 font-medium text-slate-800">
                            <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                            {row.companyName}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Fac: {row.facultyName || 'Unassigned'} &bull; Men: {row.mentorName || 'Unassigned'}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">{getHealthBadge(row.health.status)}</td>

                        <td className="py-3.5 px-4 max-w-xs">
                          <ul className="space-y-1">
                            {row.health.reasons.map((r, idx) => (
                              <li
                                key={idx}
                                className={`text-[11px] leading-tight flex items-start gap-1.5 ${
                                  row.health.status === 'CRITICAL'
                                    ? 'text-rose-700 font-medium'
                                    : row.health.status === 'ATTENTION'
                                    ? 'text-amber-800 font-medium'
                                    : 'text-slate-600'
                                }`}
                              >
                                <span className="mt-0.5">&bull;</span>
                                <span>{r}</span>
                              </li>
                            ))}
                          </ul>
                        </td>

                        <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                          <div>Overdue: <span className={row.health.metrics.overdueTasks > 0 ? 'font-bold text-rose-600' : 'text-slate-700'}>{row.health.metrics.overdueTasks}</span></div>
                          <div>Reviews Pending: <span className={row.health.metrics.pendingReviews > 0 ? 'font-bold text-amber-600' : 'text-slate-700'}>{row.health.metrics.pendingReviews}</span></div>
                          <div>Outcome Coverage: <span className="font-medium text-indigo-600">{row.health.metrics.outcomeCoveragePercentage}%</span></div>
                        </td>

                        <td className="py-3.5 px-4 text-right space-y-1">
                          <button
                            type="button"
                            onClick={() => openTimeline(row.internship.id, row.internship.title)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100"
                          >
                            <Calendar className="w-3 h-3 text-indigo-600" />
                            <span>Timeline</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Attention Queue Tab */}
      {activeTab === 'attention' && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900">
              <span className="font-semibold">Deterministic Triage Queue:</span> The items below have been flagged
              by the health engine as either <span className="font-bold text-rose-700">CRITICAL</span> or{' '}
              <span className="font-bold text-amber-700">ATTENTION</span>. Click any card to inspect the exact
              deterministic reasons and metrics breakdown.
            </div>
          </div>

          {attentionQueue.length === 0 ? (
            <Card>
              <CardBody className="p-12 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <div className="font-semibold text-slate-700">Zero Attention Cases</div>
                <div>All monitored internships in your scope are currently on track!</div>
              </CardBody>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {attentionQueue.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedCase(item)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md ${
                    item.status === 'CRITICAL'
                      ? 'bg-rose-50/40 border-rose-300'
                      : 'bg-amber-50/40 border-amber-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        {getHealthBadge(item.status)}
                        <span className="text-[11px] text-slate-400 font-mono">#{item.internshipId.slice(0, 8)}</span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm mt-1">{item.studentName}</h3>
                      <div className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.companyName}</span>
                        <span>&bull;</span>
                        <span>{item.departmentName || 'Department'}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>

                  {/* Explicit Reasons Box */}
                  <div className="mt-3 p-2.5 rounded-lg bg-white border border-slate-200">
                    <div className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Flagged Reasons:
                    </div>
                    <ul className="space-y-1 text-xs">
                      {item.reasons.map((reason, idx) => (
                        <li
                          key={idx}
                          className={`flex items-start gap-1.5 ${
                            item.status === 'CRITICAL' ? 'text-rose-700 font-medium' : 'text-amber-800'
                          }`}
                        >
                          <span className="text-rose-500 font-bold">&bull;</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Quick Signals */}
                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-rose-500" />
                      Overdue: <strong className="text-slate-800">{item.metrics.overdueTasks}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <FileCheck className="w-3 h-3 text-amber-500" />
                      Pending Reviews: <strong className="text-slate-800">{item.metrics.pendingReviews}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openTimeline(item.internshipId, item.studentName);
                      }}
                      className="text-indigo-600 hover:underline font-semibold"
                    >
                      View Timeline &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Case Details Drawer / Modal */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  {getHealthBadge(selectedCase.status)}
                  <h3 className="font-bold text-slate-900 text-base">Attention Case Diagnostic</h3>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Evaluated at: {new Date(selectedCase.calculatedAt).toLocaleString()}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCase(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Student & Host Info */}
              <div className="p-3 bg-slate-50 rounded-xl space-y-1 border border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-500">Candidate:</span>
                  <span className="font-semibold text-slate-800">{selectedCase.studentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Email:</span>
                  <span className="font-mono text-slate-700">{selectedCase.studentEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Host Partner:</span>
                  <span className="font-semibold text-slate-800">{selectedCase.companyName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Department:</span>
                  <span className="text-slate-800">{selectedCase.departmentName || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Faculty Supervisor:</span>
                  <span className="text-slate-800">{selectedCase.facultyName || 'Unassigned'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Industry Mentor:</span>
                  <span className="text-slate-800">{selectedCase.mentorName || 'Unassigned'}</span>
                </div>
              </div>

              {/* Exact Deterministic Reasons */}
              <div>
                <div className="font-bold text-slate-900 text-xs mb-2">Deterministic Signals & Explanations:</div>
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2 text-rose-900">
                  {selectedCase.reasons.map((r, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                      <span className="font-medium">{r}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Metrics Breakdown Grid */}
              <div>
                <div className="font-bold text-slate-900 text-xs mb-2">Telemetry Snapshot:</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">Overdue Tasks</span>
                    <strong className="text-base text-rose-600">{selectedCase.metrics.overdueTasks}</strong>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">Pending Reviews</span>
                    <strong className="text-base text-amber-600">{selectedCase.metrics.pendingReviews}</strong>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">Days Since Activity</span>
                    <strong className="text-base text-slate-800">{selectedCase.metrics.daysSinceLastActivity} days</strong>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">Outcome Verified</span>
                    <strong className="text-base text-indigo-600">{selectedCase.metrics.outcomeCoveragePercentage}%</strong>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openTimeline(selectedCase.internshipId, selectedCase.studentName)}
                >
                  View Full Audit Timeline
                </Button>
                <Button size="sm" onClick={() => setSelectedCase(null)}>
                  Done
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Lifecycle Timeline Modal */}
      {timelineInternshipId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Full Lifecycle Audit Timeline</h3>
                <div className="text-xs text-slate-500 mt-0.5">
                  Internship: {timelineInternshipTitle} (ID: {timelineInternshipId.slice(0, 10)})
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTimelineInternshipId(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {timelineLoading ? (
                <div className="py-12 text-center text-xs text-slate-400">Assembling chronological audit trail...</div>
              ) : timelineEvents.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">No events recorded yet.</div>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {timelineEvents.map((evt) => (
                    <div key={evt.id} className="relative group">
                      {/* Timeline dot */}
                      <span
                        className={`absolute -left-6 top-1 w-2.5 h-2.5 rounded-full ring-4 ring-white ${
                          evt.severity === 'critical'
                            ? 'bg-rose-600'
                            : evt.severity === 'warning'
                            ? 'bg-amber-500'
                            : evt.severity === 'success'
                            ? 'bg-emerald-500'
                            : 'bg-indigo-600'
                        }`}
                      ></span>

                      <div className="bg-slate-50/80 border border-slate-200 p-3 rounded-xl space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-slate-900">{evt.title}</span>
                          <span className="text-slate-400">{new Date(evt.timestamp).toLocaleString()}</span>
                        </div>
                        <div className="text-xs text-slate-600">{evt.description}</div>
                        <div className="text-[10px] text-slate-400 pt-1 flex items-center gap-1.5">
                          <span>By {evt.actorName}</span>
                          {evt.actorRole && (
                            <span className="px-1 py-0.2 rounded bg-slate-200 text-slate-700 font-mono">
                              {evt.actorRole}
                            </span>
                          )}
                          <span className="px-1 py-0.2 rounded bg-indigo-50 text-indigo-700 font-mono">
                            {evt.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 flex justify-end">
              <Button size="sm" onClick={() => setTimelineInternshipId(null)}>
                Close Timeline
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
