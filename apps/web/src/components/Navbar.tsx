import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Badge } from './Badge';
import { Button } from './Button';
import { UserRole } from '@internos/types';
import { Bell, Building2, LogOut, UserCheck } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, switchDemoRole } = useAuth();

  const roleLabels: Record<UserRole, { label: string; variant: 'slate' | 'indigo' | 'emerald' | 'amber' | 'purple' }> = {
    [UserRole.SUPER_ADMIN]: { label: 'Super Admin', variant: 'purple' },
    [UserRole.INSTITUTION_ADMIN]: { label: 'Admin', variant: 'indigo' },
    [UserRole.FACULTY_SUPERVISOR]: { label: 'Faculty', variant: 'emerald' },
    [UserRole.INDUSTRY_MENTOR]: { label: 'Mentor', variant: 'amber' },
    [UserRole.STUDENT]: { label: 'Student', variant: 'slate' },
  };

  const currentRoleInfo = user?.role
    ? roleLabels[user.role]
    : { label: 'Guest', variant: 'slate' as const };

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
              {user?.organizationName || 'Apex Institute of Technology'}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
              {user?.organizationCode || 'apex-inst'}
            </span>
          </div>
          <span className="text-xs text-slate-500">Internship Management System</span>
        </div>
      </div>

      {/* Center: Demo Quick Role Switcher */}
      <div className="hidden lg:flex items-center gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200 text-xs">
        <span className="text-[11px] font-medium text-slate-500 px-2 flex items-center gap-1">
          <UserCheck className="w-3.5 h-3.5 text-indigo-500" /> Switch Role:
        </span>
        <button
          onClick={() => switchDemoRole(UserRole.INSTITUTION_ADMIN)}
          className={`px-2 py-1 rounded font-medium transition-colors ${
            user?.role === UserRole.INSTITUTION_ADMIN
              ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Admin
        </button>
        <button
          onClick={() => switchDemoRole(UserRole.FACULTY_SUPERVISOR)}
          className={`px-2 py-1 rounded font-medium transition-colors ${
            user?.role === UserRole.FACULTY_SUPERVISOR
              ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Faculty
        </button>
        <button
          onClick={() => switchDemoRole(UserRole.INDUSTRY_MENTOR)}
          className={`px-2 py-1 rounded font-medium transition-colors ${
            user?.role === UserRole.INDUSTRY_MENTOR
              ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Mentor
        </button>
        <button
          onClick={() => switchDemoRole(UserRole.STUDENT)}
          className={`px-2 py-1 rounded font-medium transition-colors ${
            user?.role === UserRole.STUDENT
              ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Student
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
