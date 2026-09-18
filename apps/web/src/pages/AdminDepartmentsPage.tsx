import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardBody } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { FormInput } from '../components/FormInput';
import { apiClient } from '../services/apiClient';
import { DepartmentDto, DepartmentStatsDto } from '@internos/types';
import {
  BookOpen,
  Plus,
  Edit2,
  CheckCircle,
  XCircle,
  BarChart2,
  X,
  ArrowLeft,
  Users,
  Briefcase,
  Award,
  CheckSquare,
  Sparkles,
} from 'lucide-react';

export const AdminDepartmentsPage: React.FC = () => {
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedDept, setSelectedDept] = useState<DepartmentDto | null>(null);

  // Form Fields
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [saving, setSaving] = useState(false);

  // Department Stats Drawer
  const [selectedStats, setSelectedStats] = useState<DepartmentStatsDto | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<DepartmentDto[]>('/api/v1/admin/departments');
      if (res.success && res.data) {
        setDepartments(res.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedDept(null);
    setFormCode('');
    setFormName('');
    setFormDesc('');
    setIsModalOpen(true);
  };

  const openEditModal = (dept: DepartmentDto) => {
    setModalMode('edit');
    setSelectedDept(dept);
    setFormCode(dept.code);
    setFormName(dept.name);
    setFormDesc(dept.description || '');
    setIsModalOpen(true);
  };

  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (modalMode === 'create') {
        const res = await apiClient.post<DepartmentDto>('/api/v1/admin/departments', {
          code: formCode,
          name: formName,
          description: formDesc,
        });
        if (res.success && res.data) {
          setDepartments((prev) => [...prev, res.data!]);
          setIsModalOpen(false);
        }
      } else if (selectedDept) {
        const res = await apiClient.patch<DepartmentDto>(`/api/v1/admin/departments/${selectedDept.id}`, {
          code: formCode,
          name: formName,
          description: formDesc,
        });
        if (res.success && res.data) {
          setDepartments((prev) => prev.map((d) => (d.id === selectedDept.id ? res.data! : d)));
          setIsModalOpen(false);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving department');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (dept: DepartmentDto) => {
    try {
      const res = await apiClient.patch<DepartmentDto>(`/api/v1/admin/departments/${dept.id}/status`, {
        isActive: !dept.isActive,
      });
      if (res.success && res.data) {
        setDepartments((prev) => prev.map((d) => (d.id === dept.id ? res.data! : d)));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating status');
    }
  };

  const handleViewStats = async (deptId: string) => {
    try {
      setLoadingStats(true);
      const res = await apiClient.get<DepartmentStatsDto>(`/api/v1/admin/departments/${deptId}/stats`);
      if (res.success && res.data) {
        setSelectedStats(res.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading department metrics');
    } finally {
      setLoadingStats(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation & Header */}
      <div>
        <Link
          to="/app/admin"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Academic Department Registry</h1>
            <p className="text-xs text-slate-500 mt-1">
              Configure and govern academic departments, evaluate live telemetry, and supervise student cohorts.
            </p>
          </div>
          <Button onClick={openCreateModal} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4" />
            <span>Create Department</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading department registry...</div>
      ) : departments.length === 0 ? (
        <Card>
          <CardBody className="py-12 text-center">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-700">No departments configured</h3>
            <p className="text-sm text-slate-500 mt-1">Create your institution's first department above.</p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => (
            <Card key={dept.id} className="relative flex flex-col justify-between hover:shadow-md transition-shadow">
              <CardHeader className="flex items-start justify-between pb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {dept.code}
                    </span>
                    <Badge variant={dept.isActive ? 'emerald' : 'slate'}>
                      {dept.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mt-2">{dept.name}</h3>
                </div>
                <button
                  onClick={() => handleToggleStatus(dept)}
                  title={dept.isActive ? 'Deactivate Department' : 'Activate Department'}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  {dept.isActive ? (
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-slate-300" />
                  )}
                </button>
              </CardHeader>

              <CardBody className="py-2 flex-1">
                <p className="text-xs text-slate-500 line-clamp-2">
                  {dept.description || 'No description provided.'}
                </p>
              </CardBody>

              <div className="p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-xl flex items-center justify-between gap-2">
                <button
                  onClick={() => handleViewStats(dept.id)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span>Live Telemetry</span>
                </button>

                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" onClick={() => openEditModal(dept)}>
                    <Edit2 className="w-3.5 h-3.5 mr-1" />
                    <span>Edit</span>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Live Metrics Telemetry Drawer / Modal */}
      {(selectedStats || loadingStats) && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  {selectedStats?.departmentCode || 'DEPT'}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {selectedStats?.departmentName || 'Department Telemetry'}
                </h3>
              </div>
              <button onClick={() => setSelectedStats(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingStats ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading department live metrics...</div>
            ) : selectedStats ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 bg-indigo-50 border border-indigo-100 rounded-xl text-center">
                    <Users className="w-4 h-4 text-indigo-500 mx-auto mb-1" />
                    <span className="text-2xl font-black text-indigo-700">{selectedStats.totalStudents}</span>
                    <p className="text-xs text-indigo-800 font-medium mt-0.5">Enrolled Students</p>
                  </div>
                  <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl text-center">
                    <Briefcase className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                    <span className="text-2xl font-black text-emerald-700">{selectedStats.activeInternships}</span>
                    <p className="text-xs text-emerald-800 font-medium mt-0.5">Active Internships</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div className="p-2.5 bg-amber-50 border border-amber-100 rounded-xl text-center">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 mx-auto mb-1" />
                    <span className="text-lg font-black text-amber-700">{selectedStats.totalMentors}</span>
                    <p className="text-[11px] text-amber-800 font-medium mt-0.5">Mentors</p>
                  </div>
                  <div className="p-2.5 bg-purple-50 border border-purple-100 rounded-xl text-center">
                    <CheckSquare className="w-3.5 h-3.5 text-purple-500 mx-auto mb-1" />
                    <span className="text-lg font-black text-purple-700">{selectedStats.pendingTasks}</span>
                    <p className="text-[11px] text-purple-800 font-medium mt-0.5">Tasks</p>
                  </div>
                  <div className="p-2.5 bg-sky-50 border border-sky-100 rounded-xl text-center">
                    <Award className="w-3.5 h-3.5 text-sky-500 mx-auto mb-1" />
                    <span className="text-lg font-black text-sky-700">{selectedStats.completedOutcomes}</span>
                    <p className="text-[11px] text-sky-800 font-medium mt-0.5">Outcomes</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end">
                  <Button variant="primary" size="sm" onClick={() => setSelectedStats(null)}>
                    Close Telemetry
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Create / Edit Department Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {modalMode === 'create' ? 'Create New Academic Department' : `Edit Department (${formCode})`}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDepartment} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <FormInput
                    label="Code"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    placeholder="CSE"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <FormInput
                    label="Department Name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Computer Science & Engineering"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  placeholder="Department academic focus areas, syllabus links, and internship prerequisites..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : modalMode === 'create' ? 'Create Department' : 'Update Department'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDepartmentsPage;
