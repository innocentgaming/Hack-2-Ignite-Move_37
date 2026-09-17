import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { FormInput } from '../components/FormInput';
import { apiClient } from '../services/apiClient';
import { DepartmentDto, DepartmentStatsDto, UserListItemDto } from '@internos/types';
import { BookOpen, Plus, ToggleLeft, ToggleRight, X, BarChart3 } from 'lucide-react';

export const AdminDepartmentsPage: React.FC = () => {
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [users, setUsers] = useState<UserListItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Department Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedDept, setSelectedDept] = useState<DepartmentDto | null>(null);
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formHodId, setFormHodId] = useState('');
  const [saving, setSaving] = useState(false);

  // Department Stats Drawer / Modal
  const [selectedStats, setSelectedStats] = useState<DepartmentStatsDto | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [deptRes, userRes] = await Promise.all([
        apiClient.get<DepartmentDto[]>('/api/v1/admin/departments'),
        apiClient.get<{ users: UserListItemDto[]; total: number }>('/api/v1/admin/users'),
      ]);

      if (deptRes.success && deptRes.data) {
        setDepartments(deptRes.data);
      }
      if (userRes.success && userRes.data) {
        setUsers(userRes.data.users);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load department registry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedDept(null);
    setFormCode('');
    setFormName('');
    setFormDesc('');
    setFormHodId('');
    setIsModalOpen(true);
  };

  const openEditModal = (dept: DepartmentDto) => {
    setModalMode('edit');
    setSelectedDept(dept);
    setFormCode(dept.code);
    setFormName(dept.name);
    setFormDesc(dept.description || '');
    setFormHodId(dept.hodId || '');
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
          hodId: formHodId || undefined,
        });
        if (!res.success) throw new Error(res.error?.message || 'Failed to create department');
      } else if (selectedDept) {
        const res = await apiClient.put<DepartmentDto>(`/api/v1/admin/departments/${selectedDept.id}`, {
          code: formCode,
          name: formName,
          description: formDesc,
          hodId: formHodId || null,
        });
        if (!res.success) throw new Error(res.error?.message || 'Failed to update department');
      }

      setIsModalOpen(false);
      await loadData();
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
      if (res.success) {
        await loadData();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error toggling department status');
    }
  };

  const handleViewStats = async (deptId: string) => {
    setLoadingStats(true);
    setSelectedStats(null);
    try {
      const res = await apiClient.get<DepartmentStatsDto>(`/api/v1/admin/departments/${deptId}/stats`);
      if (res.success && res.data) {
        setSelectedStats(res.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load department statistics');
    } finally {
      setLoadingStats(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-indigo-600" />
            Department Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure academic departments, assign Heads of Department (HOD), and inspect real telemetry.
          </p>
        </div>
        <Button onClick={openCreateModal} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Department
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Department Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-44 bg-slate-200 rounded-xl" />
          ))}
        </div>
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
          {departments.map((dept) => {
            const assignedHod = users.find((u) => u.id === dept.hodId);
            return (
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
                      <ToggleRight className="w-6 h-6 text-emerald-600" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-slate-400" />
                    )}
                  </button>
                </CardHeader>
                <CardBody className="pt-0 space-y-4">
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {dept.description || 'No description provided.'}
                  </p>

                  <div className="text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Head of Department:</span>
                    <span className="font-semibold text-slate-800">
                      {assignedHod ? `${assignedHod.firstName} ${assignedHod.lastName}` : 'Unassigned'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewStats(dept.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs"
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      Live Metrics
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(dept)}
                      className="flex-1 text-xs"
                    >
                      Edit Details
                    </Button>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* Live Metrics Modal */}
      {(selectedStats || loadingStats) && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                {selectedStats ? selectedStats.departmentName : 'Loading Statistics...'}
              </h3>
              <button onClick={() => setSelectedStats(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingStats ? (
              <div className="py-8 text-center text-slate-500 text-sm">Computing dynamic telemetry...</div>
            ) : selectedStats ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-center">
                    <span className="text-2xl font-black text-indigo-600">{selectedStats.totalStudents}</span>
                    <p className="text-xs text-indigo-800 font-medium mt-0.5">Enrolled Students</p>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-center">
                    <span className="text-2xl font-black text-emerald-600">{selectedStats.activeInternships}</span>
                    <p className="text-xs text-emerald-800 font-medium mt-0.5">Active Internships</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-center">
                    <span className="text-2xl font-black text-amber-600">{selectedStats.totalFaculty}</span>
                    <p className="text-xs text-amber-800 font-medium mt-0.5">Assigned Faculty</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                    <span className="text-xs font-mono font-bold text-slate-700 block truncate mt-2">
                      {selectedStats.hodName || 'None'}
                    </span>
                    <p className="text-xs text-slate-500 font-medium mt-1">Designated HOD</p>
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
                {modalMode === 'create' ? 'Create New Department' : `Edit Department (${formCode})`}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDepartment} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <FormInput
                    label="Code (e.g. CS)"
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
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  placeholder="Department focus areas and details..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assign Head of Department (HOD)
                </label>
                <select
                  value={formHodId}
                  onChange={(e) => setFormHodId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
                >
                  <option value="">-- No HOD Assigned --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName} ({u.role} - {u.email})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Selecting a user will automatically grant them HOD role permissions within this department.
                </p>
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
