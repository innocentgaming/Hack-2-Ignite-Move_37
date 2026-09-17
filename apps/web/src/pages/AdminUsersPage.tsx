import React, { useState, useEffect } from 'react';
import { Card, CardBody } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { FormInput } from '../components/FormInput';
import { apiClient } from '../services/apiClient';
import { UserRole, UserStatus, UserListItemDto, DepartmentDto } from '@internos/types';
import {
  Users,
  UserPlus,
  Mail,
  Search,
  CheckCircle2,
  ToggleLeft,
  ToggleRight,
  Copy,
  Check,
  X,
} from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserListItemDto[]>([]);
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter State
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');

  // Create Direct User Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createEmail, setCreateEmail] = useState('');
  const [createFirstName, setCreateFirstName] = useState('');
  const [createLastName, setCreateLastName] = useState('');
  const [createRole, setCreateRole] = useState<UserRole>(UserRole.STUDENT);
  const [createDeptId, setCreateDeptId] = useState('');
  const [createPassword, setCreatePassword] = useState('Password123!');
  const [createSaving, setCreateSaving] = useState(false);

  // Invite User Modal State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFirstName, setInviteFirstName] = useState('');
  const [inviteLastName, setInviteLastName] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>(UserRole.FACULTY);
  const [inviteDeptId, setInviteDeptId] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState<{ activationUrl: string; email: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Edit User Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserListItemDto | null>(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>(UserRole.STUDENT);
  const [editDeptId, setEditDeptId] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, deptRes] = await Promise.all([
        apiClient.get<{ users: UserListItemDto[]; total: number }>('/api/v1/admin/users'),
        apiClient.get<DepartmentDto[]>('/api/v1/admin/departments'),
      ]);

      if (usersRes.success && usersRes.data) {
        setUsers(usersRes.data.users);
      }
      if (deptRes.success && deptRes.data) {
        setDepartments(deptRes.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredUsers = users.filter((u) => {
    if (selectedRole !== 'ALL' && u.role !== selectedRole) return false;
    if (selectedDept !== 'ALL' && u.departmentId !== selectedDept) return false;
    if (search.trim()) {
      const s = search.toLowerCase();
      const matchName = `${u.firstName} ${u.lastName}`.toLowerCase().includes(s);
      const matchEmail = u.email.toLowerCase().includes(s);
      if (!matchName && !matchEmail) return false;
    }
    return true;
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateSaving(true);
    setError(null);

    try {
      const res = await apiClient.post<UserListItemDto>('/api/v1/admin/users', {
        email: createEmail,
        firstName: createFirstName,
        lastName: createLastName,
        role: createRole,
        departmentId: createDeptId || undefined,
        password: createPassword,
      });

      if (!res.success) throw new Error(res.error?.message || 'Failed to create user');

      setIsCreateModalOpen(false);
      setCreateEmail('');
      setCreateFirstName('');
      setCreateLastName('');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating user');
    } finally {
      setCreateSaving(false);
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    setError(null);
    setInviteSuccess(null);
    setCopied(false);

    try {
      const res = await apiClient.post<{
        userId: string;
        email: string;
        role: UserRole;
        activationUrl: string;
      }>('/api/v1/admin/users/invite', {
        email: inviteEmail,
        firstName: inviteFirstName,
        lastName: inviteLastName,
        role: inviteRole,
        departmentId: inviteDeptId || undefined,
      });

      if (res.success && res.data) {
        setInviteSuccess({
          activationUrl: res.data.activationUrl,
          email: res.data.email,
        });
        setInviteEmail('');
        setInviteFirstName('');
        setInviteLastName('');
        await loadData();
      } else {
        throw new Error(res.error?.message || 'Failed to generate invitation');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error sending invitation');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleToggleStatus = async (user: UserListItemDto) => {
    try {
      const isActive = user.status === UserStatus.ACTIVE;
      const res = await apiClient.patch<UserListItemDto>(`/api/v1/admin/users/${user.id}/status`, {
        isActive: !isActive,
      });
      if (res.success) {
        await loadData();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error changing user status');
    }
  };

  const openEditModal = (user: UserListItemDto) => {
    setSelectedUser(user);
    setEditFirstName(user.firstName);
    setEditLastName(user.lastName);
    setEditRole(user.role);
    setEditDeptId(user.departmentId || '');
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setEditSaving(true);
    setError(null);

    try {
      const res = await apiClient.put<UserListItemDto>(`/api/v1/admin/users/${selectedUser.id}`, {
        firstName: editFirstName,
        lastName: editLastName,
        role: editRole,
        departmentId: editDeptId || null,
      });

      if (!res.success) throw new Error(res.error?.message || 'Failed to update user');

      setIsEditModalOpen(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating user');
    } finally {
      setEditSaving(false);
    }
  };

  const copyInviteLink = () => {
    if (inviteSuccess) {
      navigator.clipboard.writeText(inviteSuccess.activationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-indigo-600" />
            User Management & Directory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Provision, invite, activate/deactivate, and assign roles to Students, Faculty, HODs, and Industry Mentors.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setIsInviteModalOpen(true)} className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-indigo-600" />
            Invite User
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Create User
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <Card>
        <CardBody className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <div className="sm:col-span-5 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users by name or email..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="sm:col-span-3">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full py-2 px-3 text-sm border border-slate-300 rounded-lg outline-none focus:border-indigo-500 bg-white"
              >
                <option value="ALL">All Roles</option>
                <option value={UserRole.STUDENT}>Students</option>
                <option value={UserRole.FACULTY}>Faculty Supervisors</option>
                <option value={UserRole.HOD}>Department Heads (HOD)</option>
                <option value={UserRole.MENTOR}>Industry Mentors</option>
                <option value={UserRole.ADMIN}>Administrators</option>
              </select>
            </div>

            <div className="sm:col-span-4">
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full py-2 px-3 text-sm border border-slate-300 rounded-lg outline-none focus:border-indigo-500 bg-white"
              >
                <option value="ALL">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code} - {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* User Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">User</th>
                <th className="px-6 py-3.5">Role</th>
                <th className="px-6 py-3.5">Department</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    Loading users list...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isActive = u.status === UserStatus.ACTIVE;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/75 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">
                          {u.firstName} {u.lastName}
                        </div>
                        <div className="text-xs text-slate-500">{u.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200 font-mono">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-slate-700">
                          {u.departmentName || 'Not Assigned'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={isActive ? 'emerald' : 'slate'}>
                          {u.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className="inline-flex items-center text-xs font-medium text-slate-600 hover:text-slate-900 p-1"
                          title={isActive ? 'Deactivate user' : 'Activate user'}
                        >
                          {isActive ? (
                            <ToggleRight className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <ToggleLeft className="w-5 h-5 text-slate-400" />
                          )}
                        </button>
                        <Button variant="outline" size="sm" onClick={() => openEditModal(u)} className="text-xs">
                          Edit
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Direct Create User Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                Create New User
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FormInput
                  label="First Name"
                  value={createFirstName}
                  onChange={(e) => setCreateFirstName(e.target.value)}
                  placeholder="Jane"
                  required
                />
                <FormInput
                  label="Last Name"
                  value={createLastName}
                  onChange={(e) => setCreateLastName(e.target.value)}
                  placeholder="Doe"
                  required
                />
              </div>

              <FormInput
                label="Institutional Email"
                type="email"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                placeholder="user@university.edu"
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
                  <select
                    value={createRole}
                    onChange={(e) => setCreateRole(e.target.value as UserRole)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 bg-white"
                  >
                    <option value={UserRole.STUDENT}>Student</option>
                    <option value={UserRole.FACULTY}>Faculty</option>
                    <option value={UserRole.HOD}>HOD</option>
                    <option value={UserRole.MENTOR}>Mentor</option>
                    <option value={UserRole.ADMIN}>Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={createDeptId}
                    onChange={(e) => setCreateDeptId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 bg-white"
                  >
                    <option value="">-- None --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.code} - {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <FormInput
                label="Initial Password"
                type="password"
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                required
              />

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createSaving}>
                  {createSaving ? 'Creating...' : 'Create User'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite User Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Mail className="w-5 h-5 text-indigo-600" />
                Send Secure Invitation
              </h3>
              <button onClick={() => setIsInviteModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {inviteSuccess ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm space-y-2">
                  <div className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    Invitation Link Generated!
                  </div>
                  <p className="text-xs text-emerald-700">
                    An activation invitation has been generated for <strong>{inviteSuccess.email}</strong>.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Activation Link</label>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={inviteSuccess.activationUrl}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 select-all"
                    />
                    <Button variant="outline" size="sm" onClick={copyInviteLink} className="shrink-0">
                      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button variant="primary" onClick={() => setIsInviteModalOpen(false)}>
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleInviteUser} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <FormInput
                    label="First Name"
                    value={inviteFirstName}
                    onChange={(e) => setInviteFirstName(e.target.value)}
                    placeholder="Harold"
                    required
                  />
                  <FormInput
                    label="Last Name"
                    value={inviteLastName}
                    onChange={(e) => setInviteLastName(e.target.value)}
                    placeholder="Lecturer"
                    required
                  />
                </div>

                <FormInput
                  label="Email Address"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="faculty@university.edu"
                  required
                />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Role</label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as UserRole)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 bg-white"
                    >
                      <option value={UserRole.STUDENT}>Student</option>
                      <option value={UserRole.MENTOR}>Industry Mentor</option>
                      <option value={UserRole.FACULTY}>Faculty</option>
                      <option value={UserRole.HOD}>HOD</option>
                      <option value={UserRole.ADMIN}>Administrator</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                    <select
                      value={inviteDeptId}
                      onChange={(e) => setInviteDeptId(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 bg-white"
                    >
                      <option value="">-- Optional --</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.code} - {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <Button type="button" variant="outline" onClick={() => setIsInviteModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={inviteLoading}>
                    {inviteLoading ? 'Generating...' : 'Send Invitation'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                Edit User ({selectedUser.email})
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FormInput
                  label="First Name"
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  required
                />
                <FormInput
                  label="Last Name"
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 bg-white"
                >
                  <option value={UserRole.STUDENT}>Student</option>
                  <option value={UserRole.FACULTY}>Faculty</option>
                  <option value={UserRole.HOD}>HOD</option>
                  <option value={UserRole.MENTOR}>Mentor</option>
                  <option value={UserRole.ADMIN}>Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                <select
                  value={editDeptId}
                  onChange={(e) => setEditDeptId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 bg-white"
                >
                  <option value="">-- None / Unassigned --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={editSaving}>
                  {editSaving ? 'Saving...' : 'Update User'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
