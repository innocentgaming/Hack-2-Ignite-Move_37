import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Badge } from './Badge';
import { Button } from './Button';
import { UserRole } from '@internos/types';
import { normalizeRole } from '@internos/shared';
import { Building2, LogOut, User, GraduationCap } from 'lucide-react';
import { NotificationCenter } from './NotificationCenter';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const normalizedRole = user?.role ? normalizeRole(user.role) : UserRole.STUDENT;

  const roleLabels: Record<UserRole, { label: string; variant: 'slate' | 'indigo' | 'emerald' | 'amber' | 'purple' }> = {
    [UserRole.ADMIN]: { label: 'ADMIN', variant: 'indigo' },
    [UserRole.HOD]: { label: 'ADMIN', variant: 'indigo' },
    [UserRole.FACULTY]: { label: 'ADMIN', variant: 'indigo' },
    [UserRole.STUDENT]: { label: 'STUDENT', variant: 'slate' },
    [UserRole.MENTOR]: { label: 'MENTOR', variant: 'amber' },
    [UserRole.SUPER_ADMIN]: { label: 'ADMIN', variant: 'indigo' },
    [UserRole.INSTITUTION_ADMIN]: { label: 'ADMIN', variant: 'indigo' },
    [UserRole.FACULTY_SUPERVISOR]: { label: 'ADMIN', variant: 'indigo' },
    [UserRole.INDUSTRY_MENTOR]: { label: 'MENTOR', variant: 'amber' },
  };

  const currentRoleInfo = roleLabels[normalizedRole] || { label: normalizedRole, variant: 'slate' as const };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left: Organization & Department Context */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-700 to-indigo-500 text-white flex items-center justify-center font-bold text-base shadow-sm">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900 tracking-tight">
              InternOS
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-sm font-semibold text-slate-700">
              {user?.organizationName || 'Educational Institution'}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
              {user?.organizationCode || 'ORG_A'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Enterprise Internship Governance</span>
            {user?.departmentId && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-600 font-medium">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                  Computer Engineering
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right: Notifications, User Identity & Logout */}
      <div className="flex items-center gap-4">
        <NotificationCenter />

        <div className="h-6 w-px bg-slate-200" />

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
            <User className="w-4 h-4" />
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-xs font-semibold text-slate-900 leading-tight">
              {user ? `${user.firstName} ${user.lastName}` : 'Authenticated User'}
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
            title="Sign out of InternOS"
            className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 px-2 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
