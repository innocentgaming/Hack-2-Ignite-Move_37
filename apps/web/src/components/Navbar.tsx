import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Badge } from './Badge';
import { Button } from './Button';
import { UserRole } from '@internos/types';
import { normalizeRole } from '@internos/shared';
import { Building2, LogOut, User, GraduationCap, Menu, X } from 'lucide-react';
import { NotificationCenter } from './NotificationCenter';

export interface NavbarProps {
  onToggleMobileSidebar?: () => void;
  isMobileSidebarOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleMobileSidebar,
  isMobileSidebarOpen = false,
}) => {
  const { user, logout } = useAuth();
  const normalizedRole = user?.role ? normalizeRole(user.role) : UserRole.STUDENT;

  const roleLabels: Record<string, { label: string; variant: 'slate' | 'indigo' | 'emerald' | 'amber' | 'purple' }> = {
    [UserRole.ADMIN]: { label: 'ADMINISTRATOR', variant: 'indigo' },
    [UserRole.MENTOR]: { label: 'MENTOR', variant: 'amber' },
    [UserRole.STUDENT]: { label: 'STUDENT', variant: 'slate' },
  };

  const currentRoleInfo = roleLabels[normalizedRole] || { label: normalizedRole, variant: 'slate' as const };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left: Hamburger button, Organization & Department Context */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {onToggleMobileSidebar && (
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg md:hidden transition-colors shrink-0"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileSidebarOpen ? <X className="w-5 h-5 text-indigo-600" /> : <Menu className="w-5 h-5" />}
          </button>
        )}

        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-700 to-indigo-500 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
          <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-sm font-bold text-slate-900 tracking-tight shrink-0">
              InternOS
            </span>
            <span className="text-slate-300 hidden sm:inline">/</span>
            <span className="text-xs sm:text-sm font-semibold text-slate-700 truncate max-w-[130px] sm:max-w-[240px] md:max-w-[340px] lg:max-w-none">
              {user?.organizationName || 'Educational Institution'}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold shrink-0 hidden sm:inline-block">
              {user?.organizationCode || 'ORG'}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
            <span>Enterprise Internship Governance</span>
            <span>•</span>
            <span className="text-slate-600 font-medium">Pune, Maharashtra</span>
            {user?.departmentId && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-600 font-medium truncate">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  Academic Department
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right: Notifications, User Identity & Logout */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <NotificationCenter />

        <div className="h-5 sm:h-6 w-px bg-slate-200" />

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div className="text-right hidden md:block">
            <div className="text-xs font-semibold text-slate-900 leading-tight">
              {user ? `${user.firstName} ${user.lastName}` : 'Authenticated User'}
            </div>
            <div className="text-[11px] text-slate-500">{user?.email}</div>
          </div>

          <div className="hidden sm:block">
            <Badge variant={currentRoleInfo.variant} size="sm">
              {currentRoleInfo.label}
            </Badge>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            title="Sign out of InternOS"
            className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 sm:px-2 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
