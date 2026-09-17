import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardBody } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { apiClient } from '../services/apiClient';
import {
  InstitutionalAnalyticsDto,
  DepartmentDto,
  UserRole,
} from '@internos/types';
import { normalizeRole } from '@internos/shared';
import {
  BarChart3,
  Download,
  Building2,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Clock,
  Users,
  Award,
  BookOpen,
  Briefcase,
  RefreshCw,
  PieChart,
} from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const rawRole = user?.role || UserRole.STUDENT;
  const role = normalizeRole(rawRole);

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Analytics & Reference Data
  const [analytics, setAnalytics] = useState<InstitutionalAnalyticsDto | null>(null);
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);

  // Filter State
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');

  // Active View Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'departments' | 'companies' | 'mentors' | 'evaluations' | 'outcomes'>('overview');

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (departmentFilter) params.append('departmentId', departmentFilter);
      if (startDateFilter) params.append('startDate', startDateFilter);
      if (endDateFilter) params.append('endDate', endDateFilter);

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const res = await apiClient.get<InstitutionalAnalyticsDto>(`/api/v1/analytics${queryString}`);
      if (res.success && res.data) {
        setAnalytics(res.data);
      } else if (res.error) {
        setError(res.error.message);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load institutional analytics');
    } finally {
      setLoading(false);
    }
  }, [departmentFilter, startDateFilter, endDateFilter]);

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await apiClient.get<DepartmentDto[]>('/api/v1/tenants/departments');
      if (res.success && res.data) {
        setDepartments(res.data);
      }
    } catch {
      // Non-critical fallback
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const params = new URLSearchParams();
      if (departmentFilter) params.append('departmentId', departmentFilter);
      if (startDateFilter) params.append('startDate', startDateFilter);
      if (endDateFilter) params.append('endDate', endDateFilter);
      params.append('format', 'csv');

      const url = `/api/v1/analytics/export?${params.toString()}`;
      const token = localStorage.getItem('internos_token') || sessionStorage.getItem('internos_token');

      const response = await fetch(url, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });

      if (!response.ok) throw new Error('Failed to export CSV analytics');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `internos-analytics-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      alert(err.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const overview = analytics?.overview;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
              Institutional & Department Analytics
            </h1>
            <Badge variant="indigo">Real-Time Aggregates</Badge>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Aggregated institutional performance, partner distribution, outcome coverage, and mentor workloads.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAnalytics()}
            disabled={loading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleExportCsv}
            disabled={exporting || loading || !analytics}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Exporting...' : 'Export CSV Report'}
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur border-gray-200/80 dark:border-gray-700/80">
        <CardBody className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            {/* Department Filter */}
            {role !== UserRole.HOD && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  Department Filter
                </label>
                <div className="relative">
                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="w-full text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">All Departments</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.code} - {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Start Date */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                Start Date (From)
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={startDateFilter}
                  onChange={(e) => setStartDateFilter(e.target.value)}
                  className="w-full text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* End Date */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                End Date (To)
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={endDateFilter}
                  onChange={(e) => setEndDateFilter(e.target.value)}
                  className="w-full text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Reset Filters */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  setDepartmentFilter('');
                  setStartDateFilter('');
                  setEndDateFilter('');
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* KPI Overview Grid */}
      {overview && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <Card className="bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 border-indigo-200/60 dark:border-indigo-800/60">
            <CardBody className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                  Active Interns
                </span>
                <Briefcase className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                {overview.activeInternships}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                out of {overview.totalInternships} total
              </p>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-200/60 dark:border-emerald-800/60">
            <CardBody className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                  Completion Rate
                </span>
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {overview.completionRate}%
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {overview.completedInternships} completed
              </p>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-200/60 dark:border-blue-800/60">
            <CardBody className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                  Review Progress
                </span>
                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
                {overview.reviewCompletionRate}%
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {overview.reviewsPending} pending review
              </p>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-200/60 dark:border-amber-800/60">
            <CardBody className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                  Submissions
                </span>
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                {analytics?.submissionCompliance.onTimeRate}%
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {overview.overdueSubmissions} overdue tasks
              </p>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-200/60 dark:border-purple-800/60">
            <CardBody className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                  Outcome Evidence
                </span>
                <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="mt-2 text-2xl font-bold text-purple-600 dark:text-purple-400">
                {overview.outcomeEvidenceCoverageRate}%
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {analytics?.outcomeEvidenceCoverage.coveredOutcomes} / {analytics?.outcomeEvidenceCoverage.totalOutcomes} verified
              </p>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-rose-500/10 to-rose-500/5 border-rose-200/60 dark:border-rose-800/60">
            <CardBody className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
                  Avg Evaluation
                </span>
                <Award className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                {overview.averageEvaluationScore > 0 ? `${overview.averageEvaluationScore}/100` : 'N/A'}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {analytics?.evaluationDistribution.totalEvaluations} evaluated
              </p>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-6 overflow-x-auto">
          {[
            { id: 'overview', label: 'Status & Compliance', icon: PieChart },
            { id: 'departments', label: 'Department Completion', icon: Building2 },
            { id: 'companies', label: 'Company Distribution', icon: Briefcase },
            { id: 'mentors', label: 'Mentor Workload', icon: Users },
            { id: 'evaluations', label: 'Grades & Evaluation', icon: Award },
            { id: 'outcomes', label: 'Outcome Evidence', icon: BookOpen },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap transition-colors ${
                  active
                    ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* TAB CONTENT: 1. Status & Compliance */}
      {activeTab === 'overview' && analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Internship Lifecycle Status Distribution
              </h3>
            </CardHeader>
            <CardBody className="p-4 space-y-3">
              {analytics.statusDistribution.map((item) => (
                <div key={item.status} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-gray-700 dark:text-gray-300">{item.status}</span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {item.count} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        item.status === 'COMPLETED'
                          ? 'bg-emerald-500'
                          : item.status === 'ACTIVE'
                          ? 'bg-indigo-500'
                          : item.status === 'PENDING_APPROVAL'
                          ? 'bg-amber-500'
                          : 'bg-gray-400'
                      }`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>

          {/* Submission Compliance */}
          <Card>
            <CardHeader>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Deliverable Submission Compliance
              </h3>
            </CardHeader>
            <CardBody className="p-4 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {analytics.submissionCompliance.totalSubmissions}
                  </div>
                  <div className="text-xs text-gray-500">Total Submissions</div>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl">
                  <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {analytics.submissionCompliance.onTimeSubmissions}
                  </div>
                  <div className="text-xs text-emerald-600">On Time</div>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl">
                  <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
                    {analytics.submissionCompliance.lateSubmissions}
                  </div>
                  <div className="text-xs text-amber-600">Late</div>
                </div>
                <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl">
                  <div className="text-xl font-bold text-rose-600 dark:text-rose-400">
                    {analytics.submissionCompliance.overdueSubmissions}
                  </div>
                  <div className="text-xs text-rose-600">Overdue</div>
                </div>
              </div>

              <div className="space-y-1 pt-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-gray-700 dark:text-gray-300">Punctuality Score</span>
                  <span className="text-emerald-600">{analytics.submissionCompliance.onTimeRate}%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5">
                  <div
                    className="h-2.5 rounded-full bg-emerald-500"
                    style={{ width: `${analytics.submissionCompliance.onTimeRate}%` }}
                  />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* TAB CONTENT: 2. Department Completion */}
      {activeTab === 'departments' && analytics && (
        <Card>
          <CardHeader>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Department Internship Completion Breakdown
            </h3>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-900/60 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-3">Code</th>
                  <th className="px-6 py-3">Department Name</th>
                  <th className="px-6 py-3">Students</th>
                  <th className="px-6 py-3">Total Internships</th>
                  <th className="px-6 py-3">Active</th>
                  <th className="px-6 py-3">Completed</th>
                  <th className="px-6 py-3">Completion Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {analytics.departmentCompletion.map((dept) => (
                  <tr key={dept.departmentId} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4 font-mono font-medium text-indigo-600 dark:text-indigo-400">
                      {dept.departmentCode}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {dept.departmentName}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{dept.studentCount}</td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{dept.totalInternships}</td>
                    <td className="px-6 py-4 text-indigo-600 dark:text-indigo-400">{dept.activeInternships}</td>
                    <td className="px-6 py-4 text-emerald-600 dark:text-emerald-400">{dept.completedInternships}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-white">{dept.completionRate}%</span>
                        <div className="w-20 bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                          <div
                            className="bg-emerald-500 h-2 rounded-full"
                            style={{ width: `${dept.completionRate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
                {analytics.departmentCompletion.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No department data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB CONTENT: 3. Partner Company Distribution */}
      {activeTab === 'companies' && analytics && (
        <Card>
          <CardHeader>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Partner Industry & Company Distribution
            </h3>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-900/60 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-3">Company Name</th>
                  <th className="px-6 py-3">Industry Domain</th>
                  <th className="px-6 py-3">Internships Hosted</th>
                  <th className="px-6 py-3">Cohort Share (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {analytics.companyDistribution.map((comp) => (
                  <tr key={comp.companyId} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      {comp.companyName}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{comp.industry}</td>
                    <td className="px-6 py-4 font-semibold text-indigo-600 dark:text-indigo-400">
                      {comp.internshipCount}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-white">{comp.percentage}%</span>
                        <div className="w-24 bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full"
                            style={{ width: `${comp.percentage}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
                {analytics.companyDistribution.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No corporate partners recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB CONTENT: 4. Mentor Workload */}
      {activeTab === 'mentors' && analytics && (
        <Card>
          <CardHeader>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Industry Mentor Workload & Review Queue
            </h3>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-900/60 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-3">Mentor Name</th>
                  <th className="px-6 py-3">Company</th>
                  <th className="px-6 py-3">Assigned Mentees</th>
                  <th className="px-6 py-3">Active</th>
                  <th className="px-6 py-3">Completed</th>
                  <th className="px-6 py-3">Pending Reviews</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {analytics.mentorWorkload.map((m) => (
                  <tr key={m.mentorId} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">{m.mentorName}</div>
                      <div className="text-xs text-gray-500">{m.mentorEmail}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{m.companyName}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                      {m.assignedInternships}
                    </td>
                    <td className="px-6 py-4 text-indigo-600 dark:text-indigo-400">{m.activeInternships}</td>
                    <td className="px-6 py-4 text-emerald-600 dark:text-emerald-400">{m.completedInternships}</td>
                    <td className="px-6 py-4">
                      {m.pendingReviews > 0 ? (
                        <Badge variant="amber">{m.pendingReviews} pending</Badge>
                      ) : (
                        <Badge variant="emerald">All caught up</Badge>
                      )}
                    </td>
                  </tr>
                ))}
                {analytics.mentorWorkload.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No mentors currently assigned.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB CONTENT: 5. Grades & Final Evaluations */}
      {activeTab === 'evaluations' && analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Final Letter Grade Distribution
              </h3>
            </CardHeader>
            <CardBody className="p-4 space-y-3">
              {analytics.evaluationDistribution.gradeBreakdown.map((item) => (
                <div key={item.grade} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-gray-800 dark:text-gray-200">Grade {item.grade}</span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {item.count} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${
                        item.grade === 'A+' || item.grade === 'A'
                          ? 'bg-emerald-500'
                          : item.grade === 'B'
                          ? 'bg-blue-500'
                          : item.grade === 'C'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Score Range Breakdown (/100)
              </h3>
            </CardHeader>
            <CardBody className="p-4 space-y-3">
              {analytics.evaluationDistribution.scoreBands.map((band) => (
                <div key={band.band} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-gray-700 dark:text-gray-300">{band.band} Marks</span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {band.count} ({band.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                    <div
                      className="bg-indigo-500 h-2 rounded-full"
                      style={{ width: `${band.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      )}

      {/* TAB CONTENT: 6. Outcome Evidence Attainment */}
      {activeTab === 'outcomes' && analytics && (
        <Card>
          <CardHeader>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Program Outcome (PO) Evidence Attainment
            </h3>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-900/60 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-3">Outcome Code</th>
                  <th className="px-6 py-3">Outcome Title / Description</th>
                  <th className="px-6 py-3">Verified Evidence Matches</th>
                  <th className="px-6 py-3">Coverage Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {analytics.outcomeEvidenceCoverage.outcomes.map((o) => (
                  <tr key={o.outcomeId} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {o.code}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{o.name}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{o.evidenceCount} submissions</td>
                    <td className="px-6 py-4">
                      {o.hasEvidence ? (
                        <Badge variant="emerald">Evidence Verified</Badge>
                      ) : (
                        <Badge variant="amber">No Evidence Found</Badge>
                      )}
                    </td>
                  </tr>
                ))}
                {analytics.outcomeEvidenceCoverage.outcomes.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No Program Outcomes recorded for the filtered cohort.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
