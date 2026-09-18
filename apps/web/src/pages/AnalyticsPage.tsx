import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardBody } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { apiClient } from '../services/apiClient';
import {
  InstitutionalAnalyticsDto,
  DepartmentDto,
  StudentRosterItemDto,
  StudentProgressAssessmentResult,
} from '@internos/types';
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
  ArrowLeft,
  Sparkles,
  Brain,
  Check,
  Copy,
  X,
  Target,
  Activity,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AnalyticsPage: React.FC = () => {
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
  const [activeTab, setActiveTab] = useState<'overview' | 'ai-progress' | 'departments' | 'companies' | 'mentors' | 'evaluations' | 'outcomes'>('overview');

  // AI Student Progress State
  const [studentRoster, setStudentRoster] = useState<StudentRosterItemDto[]>([]);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<StudentProgressAssessmentResult | null>(null);
  const [assessingStudentId, setAssessingStudentId] = useState<string | null>(null);
  const [copiedReport, setCopiedReport] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

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

  const fetchStudentRoster = useCallback(async () => {
    try {
      setLoadingRoster(true);
      const params = new URLSearchParams();
      if (departmentFilter) params.append('departmentId', departmentFilter);
      const queryString = params.toString() ? `?${params.toString()}` : '';
      const res = await apiClient.get<StudentRosterItemDto[]>(`/api/v1/analytics/students-roster${queryString}`);
      if (res.success && res.data) {
        setStudentRoster(res.data);
      }
    } catch {
      // Non-critical fallback
    } finally {
      setLoadingRoster(false);
    }
  }, [departmentFilter]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  useEffect(() => {
    fetchStudentRoster();
  }, [fetchStudentRoster]);

  const handleAssessStudent = async (student: StudentRosterItemDto) => {
    try {
      setAssessingStudentId(student.studentId);
      setAiError(null);
      const res = await apiClient.post<StudentProgressAssessmentResult>('/api/v1/analytics/ai-assess', {
        studentId: student.studentId,
        internshipId: student.id,
      });
      if (res.success && res.data) {
        setSelectedAssessment(res.data);
      } else {
        throw new Error(res.error?.message || 'Failed to assess student progress with AI');
      }
    } catch (err: any) {
      setAiError(err?.message || 'Error running AI assessment');
    } finally {
      setAssessingStudentId(null);
    }
  };

  const handleCopyReport = () => {
    if (!selectedAssessment) return;
    const text = `INTERNOS AI STUDENT PROGRESS ASSESSMENT
Student: ${selectedAssessment.studentName} (${selectedAssessment.departmentName})
Host Company: ${selectedAssessment.companyName} | Role: ${selectedAssessment.roleTitle}
Velocity Score: ${selectedAssessment.velocityScore}/100 | Status: ${selectedAssessment.status}
Generated: ${new Date(selectedAssessment.assessedAt).toLocaleString()} (${selectedAssessment.source})

EXECUTIVE SUMMARY:
${selectedAssessment.summary}

KEY STRENGTHS:
${selectedAssessment.strengths.map((s) => `• ${s}`).join('\n')}

RISK FACTORS & BOTTLENECKS:
${selectedAssessment.riskFactors.map((r) => `• ${r}`).join('\n')}

RECOMMENDATIONS:
For Student:
${selectedAssessment.recommendations.forStudent.map((r) => `  - ${r}`).join('\n')}
For Industry Mentor:
${selectedAssessment.recommendations.forMentor.map((r) => `  - ${r}`).join('\n')}
For Institution / Academic Dean:
${selectedAssessment.recommendations.forInstitution.map((r) => `  - ${r}`).join('\n')}

PREDICTED OUTCOME:
${selectedAssessment.predictedOutcome}

ACADEMIC CREDIT READINESS:
${selectedAssessment.academicCreditReadiness}
`;
    navigator.clipboard.writeText(text);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

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
      {/* Back Button */}
      <Link
        to="/app/admin"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Dashboard</span>
      </Link>

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
            { id: 'ai-progress', label: 'AI Student Progress', icon: Sparkles, badge: 'Groq AI' },
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
                onClick={() => {
                  setActiveTab(tab.id as any);
                  if (tab.id === 'ai-progress' && studentRoster.length > 0 && !selectedAssessment) {
                    handleAssessStudent(studentRoster[0]);
                  }
                }}
                className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap transition-colors ${
                  active
                    ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${tab.id === 'ai-progress' ? 'text-amber-500' : ''}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700">
                    {tab.badge}
                  </span>
                )}
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

      {/* TAB CONTENT: AI Student Progress Evaluator */}
      {activeTab === 'ai-progress' && (
        <div className="space-y-6">
          {/* AI Banner */}
          <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl border border-indigo-700/50 shadow-xl text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>Groq AI Neural Evaluator Active</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[10px] text-indigo-200">groq/compound-mini</span>
                </div>
                <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
                  <Brain className="w-6 h-6 text-indigo-400" />
                  AI Student Progress & Outcome Assessment
                </h3>
                <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                  Real-time cognitive evaluation assessing milestone completion velocity, deliverable quality, mentor feedback sentiment, and graduation credit clearance trajectory.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="dark"
                  size="sm"
                  onClick={fetchStudentRoster}
                  disabled={loadingRoster}
                  className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingRoster ? 'animate-spin' : ''}`} />
                  <span>Refresh Roster</span>
                </Button>
              </div>
            </div>
          </div>

          {/* AI Error Alert */}
          {aiError && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center justify-between text-rose-700 dark:text-rose-300 text-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{aiError}</span>
              </div>
              <button onClick={() => setAiError(null)} className="text-rose-500 hover:text-rose-700">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Main Grid: Roster (Left/Top) + AI Dossier (Right/Bottom) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Student Telemetry Roster */}
            <div className={`space-y-4 ${selectedAssessment ? 'lg:col-span-5' : 'lg:col-span-12'}`}>
              <Card>
                <CardHeader className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                      Internship Cohort Telemetry
                    </h3>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {studentRoster.length} Students Active
                  </span>
                </CardHeader>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-gray-700 dark:text-gray-300">
                    <thead className="bg-gray-50 dark:bg-gray-900/60 font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 dark:border-gray-800">
                      <tr>
                        <th className="px-4 py-3">Student & Dept</th>
                        <th className="px-4 py-3">Host Organization</th>
                        <th className="px-4 py-3">Progress</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                      {studentRoster.map((s) => {
                        const isAssessing = assessingStudentId === s.studentId;
                        const isSelected = selectedAssessment?.studentId === s.studentId;

                        return (
                          <tr
                            key={s.id}
                            className={`transition-colors ${
                              isSelected
                                ? 'bg-indigo-50/60 dark:bg-indigo-950/40 border-l-4 border-l-indigo-600'
                                : 'hover:bg-gray-50/50 dark:hover:bg-gray-800/50'
                            }`}
                          >
                            <td className="px-4 py-3">
                              <div className="font-semibold text-gray-900 dark:text-white">
                                {s.studentName}
                              </div>
                              <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
                                <span className="font-mono text-indigo-600 dark:text-indigo-400">
                                  {s.departmentCode}
                                </span>
                                <span>•</span>
                                <span>{s.roleTitle}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-800 dark:text-gray-200">
                                {s.companyName}
                              </div>
                              <div className="text-[10px] text-gray-400">
                                Tasks: {s.tasksCompleted}/{s.tasksTotal}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-900 dark:text-white">
                                  {s.progressPercentage}%
                                </span>
                                <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                  <div
                                    className={`h-1.5 rounded-full ${
                                      s.progressPercentage >= 75
                                        ? 'bg-emerald-500'
                                        : s.progressPercentage >= 40
                                        ? 'bg-indigo-500'
                                        : 'bg-amber-500'
                                    }`}
                                    style={{ width: `${s.progressPercentage}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button
                                size="sm"
                                disabled={isAssessing}
                                onClick={() => handleAssessStudent(s)}
                                className={`text-[11px] px-2.5 py-1 gap-1 shadow-xs transition-all ${
                                  isSelected
                                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                    : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50'
                                }`}
                              >
                                {isAssessing ? (
                                  <>
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                    <span>Assessing...</span>
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-3 h-3 text-amber-500" />
                                    <span>{isSelected ? 'Re-Evaluate' : 'AI Assess'}</span>
                                  </>
                                )}
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                      {studentRoster.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                            No students found in this department filter.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            {/* Right: AI Assessment Dossier */}
            {selectedAssessment && (
              <div className="lg:col-span-7 space-y-4 animate-in fade-in duration-200">
                <Card className="border-indigo-200 dark:border-indigo-800 shadow-xl overflow-hidden">
                  {/* Header */}
                  <div className="p-6 bg-gradient-to-r from-indigo-50 via-white to-purple-50 dark:from-indigo-950/40 dark:via-gray-900 dark:to-purple-950/30 border-b border-indigo-100 dark:border-indigo-900/50">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                            {selectedAssessment.departmentName}
                          </span>
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                            {selectedAssessment.companyName}
                          </span>
                        </div>
                        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">
                          {selectedAssessment.studentName}
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          Role: <span className="font-semibold text-gray-700 dark:text-gray-300">{selectedAssessment.roleTitle}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <Activity className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{selectedAssessment.source === 'GROQ_AI' ? 'Groq LLaMA Engine' : 'Deterministic Evaluator'}</span>
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedAssessment(null)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 h-8 w-8"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Quick Metric Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                      <div className="p-3 bg-white dark:bg-gray-800/80 rounded-xl border border-indigo-100 dark:border-indigo-900/40 shadow-xs space-y-1">
                        <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                          Velocity Score
                        </div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                            {selectedAssessment.velocityScore}
                          </span>
                          <span className="text-xs text-gray-400">/ 100</span>
                        </div>
                      </div>

                      <div className="p-3 bg-white dark:bg-gray-800/80 rounded-xl border border-indigo-100 dark:border-indigo-900/40 shadow-xs space-y-1">
                        <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                          Status
                        </div>
                        <div>
                          <Badge
                            variant={
                              selectedAssessment.status === 'EXCELLING'
                                ? 'success'
                                : selectedAssessment.status === 'ON_TRACK'
                                ? 'indigo'
                                : selectedAssessment.status === 'NEEDS_ATTENTION'
                                ? 'warning'
                                : 'destructive'
                            }
                            className="font-bold text-xs"
                          >
                            {selectedAssessment.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>

                      <div className="p-3 bg-white dark:bg-gray-800/80 rounded-xl border border-indigo-100 dark:border-indigo-900/40 shadow-xs space-y-1 sm:col-span-2">
                        <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                          Academic Credit Readiness
                        </div>
                        <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 truncate">
                          {selectedAssessment.academicCreditReadiness}
                        </div>
                      </div>
                    </div>
                  </div>

                  <CardBody className="p-6 space-y-6">
                    {/* Executive Summary */}
                    <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border-l-4 border-l-indigo-600 rounded-r-xl space-y-1.5">
                      <div className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Executive AI Evaluation</span>
                      </div>
                      <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                        {selectedAssessment.summary}
                      </p>
                    </div>

                    {/* Strengths & Risk Factors */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Strengths */}
                      <div className="p-4 bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/60 rounded-xl space-y-2">
                        <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 uppercase tracking-wider">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Key Strengths & Mastery</span>
                        </div>
                        <ul className="space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
                          {selectedAssessment.strengths.map((st, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                              <span>{st}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Risk Factors */}
                      <div className="p-4 bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/60 rounded-xl space-y-2">
                        <div className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          <span>Areas of Focus & Risks</span>
                        </div>
                        <ul className="space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
                          {selectedAssessment.riskFactors.length > 0 ? (
                            selectedAssessment.riskFactors.map((rf, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                                <span>{rf}</span>
                              </li>
                            ))
                          ) : (
                            <li className="text-xs text-gray-500 italic">No significant risks flagged.</li>
                          )}
                        </ul>
                      </div>
                    </div>

                    {/* 360 Recommendations */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <Target className="w-4 h-4 text-indigo-600" />
                        <span>360° Actionable Recommendations</span>
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* Student */}
                        <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 space-y-1.5">
                          <div className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
                            🎓 For Student
                          </div>
                          <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                            {selectedAssessment.recommendations.forStudent.map((r, i) => (
                              <li key={i} className="leading-snug">• {r}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Mentor */}
                        <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 space-y-1.5">
                          <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                            💼 For Industry Mentor
                          </div>
                          <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                            {selectedAssessment.recommendations.forMentor.map((r, i) => (
                              <li key={i} className="leading-snug">• {r}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Institution */}
                        <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 space-y-1.5">
                          <div className="text-[11px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">
                            🏛️ For Academic Dean
                          </div>
                          <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                            {selectedAssessment.recommendations.forInstitution.map((r, i) => (
                              <li key={i} className="leading-snug">• {r}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Predicted Placement / PPO Outcome */}
                    <div className="p-3.5 bg-slate-900 text-white rounded-xl flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-indigo-300">
                          Predicted Placement & PPO Trajectory
                        </div>
                        <div className="text-xs font-medium text-slate-200">
                          {selectedAssessment.predictedOutcome}
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-indigo-950 text-indigo-300 border-indigo-700 whitespace-nowrap text-xs">
                        High Confidence
                      </Badge>
                    </div>

                    {/* Actions Footer */}
                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-100 dark:border-gray-800">
                      <div className="text-[11px] text-gray-400">
                        Evaluated on {new Date(selectedAssessment.assessedAt).toLocaleTimeString()}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopyReport}
                          className="text-xs gap-1.5"
                        >
                          {copiedReport ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-gray-500" />
                              <span>Copy Evaluation Report</span>
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          disabled={assessingStudentId === selectedAssessment.studentId}
                          onClick={() => {
                            const st = studentRoster.find((s) => s.studentId === selectedAssessment.studentId);
                            if (st) handleAssessStudent(st);
                          }}
                          className="text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${assessingStudentId === selectedAssessment.studentId ? 'animate-spin' : ''}`} />
                          <span>Re-Evaluate</span>
                        </Button>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>
            )}
          </div>
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
