import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Badge } from './Badge';
import { Button } from './Button';
import { UserRole } from '@internos/types';
import { normalizeRole } from '@internos/shared';
import { Bell, Building2, LogOut, UserCheck } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, switchDemoRole } = useAuth();
  const normalizedRole = user?.role ? normalizeRole(user.role) : UserRole.STUDENT;

  const roleLabels: Record<UserRole, { label: string; variant: 'slate' | 'indigo' | 'emerald' | 'amber' | 'purple' }> = {
    [UserRole.ADMIN]: { label: 'ADMIN', variant: 'indigo' },
    [UserRole.HOD]: { label: 'HOD', variant: 'purple' },
    [UserRole.FACULTY]: { label: 'FACULTY', variant: 'emerald' },
    [UserRole.STUDENT]: { label: 'STUDENT', variant: 'slate' },
    [UserRole.MENTOR]: { label: 'MENTOR', variant: 'amber' },
    // Legacy aliases
    [UserRole.SUPER_ADMIN]: { label: 'ADMIN', variant: 'indigo' },
    [UserRole.INSTITUTION_ADMIN]: { label: 'ADMIN', variant: 'indigo' },
    [UserRole.FACULTY_SUPERVISOR]: { label: 'FACULTY', variant: 'emerald' },
    [UserRole.INDUSTRY_MENTOR]: { label: 'MENTOR', variant: 'amber' },
  };

  const currentRoleInfo = roleLabels[normalizedRole] || { label: normalizedRole, variant: 'slate' as const };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Organization Context */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900 leading-tight">
              {user?.organizationName || 'InternOS Educational Tenant'}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
              {user?.organizationCode || 'ORG_A'}
            </span>
          </div>
          <span className="text-xs text-slate-500">Multi-Tenant Internship Operating System (Phase 1)</span>
        </div>
      </div>

      {/* Center: Demo Quick Role Switcher */}
      <div className="hidden lg:flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200 text-xs">
        <span className="text-[11px] font-medium text-slate-500 px-1.5 flex items-center gap-1">
          <UserCheck className="w-3.5 h-3.5 text-indigo-500" /> Switch:
        </span>
        <button
          onClick={() => switchDemoRole(UserRole.ADMIN, user?.organizationCode || 'ORG_A')}
          className={`px-2 py-1 rounded font-medium transition-colors ${
            normalizedRole === UserRole.ADMIN
              ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Admin
        </button>
        <button
          onClick={() => switchDemoRole(UserRole.HOD, user?.organizationCode || 'ORG_A')}
          className={`px-2 py-1 rounded font-medium transition-colors ${
            normalizedRole === UserRole.HOD
              ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          HOD
        </button>
        <button
          onClick={() => switchDemoRole(UserRole.FACULTY, user?.organizationCode || 'ORG_A')}
          className={`px-2 py-1 rounded font-medium transition-colors ${
            normalizedRole === UserRole.FACULTY
              ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Faculty
        </button>
        <button
          onClick={() => switchDemoRole(UserRole.STUDENT, user?.organizationCode || 'ORG_A')}
          className={`px-2 py-1 rounded font-medium transition-colors ${
            normalizedRole === UserRole.STUDENT
              ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Student
        </button>
        <button
          onClick={() => switchDemoRole(UserRole.MENTOR, user?.organizationCode || 'ORG_A')}
          className={`px-2 py-1 rounded font-medium transition-colors ${
            normalizedRole === UserRole.MENTOR
              ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Mentor
        </button>
      </div>

      {/* Right: Notifications & User Profile */}
      <div className="flex items-center gap-4">
        <button
          aria-label="Notifications"
          className="w-8 h-8 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center transition-colors relative"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1.5 right-1.5" />
        </button>

        <div className="h-6 w-px bg-slate-200" />

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs font-semibold text-slate-900 leading-tight">
              {user ? `${user.firstName} ${user.lastName}` : 'Guest User'}
            </div>
            <div className="text-[11px] text-slate-500">{user?.email}</div>
          </div>

          <Badge variant={currentRoleInfo.variant} size="sm">
            {currentRoleInfo.label}
          </Badge>

          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            title="Sign out"
            className="text-slate-500 hover:text-rose-600 px-2"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};
