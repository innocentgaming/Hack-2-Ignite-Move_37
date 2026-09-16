import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '@internos/types';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  Briefcase,
  GitBranch,
  FileCheck,
  Award,
  BookOpen,
  Settings,
  ShieldCheck,
  FolderArchive,
  Compass,
} from 'lucide-react';

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];
}

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role || UserRole.STUDENT;

  const navItems: NavItem[] = [
    { label: 'Overview', to: '/app/dashboard', icon: LayoutDashboard },

    // Student Navigation
    {
      label: 'My Internship',
      to: '/app/internships',
      icon: Briefcase,
      roles: [UserRole.STUDENT],
    },
    {
      label: 'Milestones & Tasks',
      to: '/app/tasks',
      icon: GitBranch,
      roles: [UserRole.STUDENT],
    },
    {
      label: 'Submissions',
      to: '/app/submissions',
      icon: FileCheck,
      roles: [UserRole.STUDENT],
    },

    // Faculty Navigation
    {
      label: 'Supervised Interns',
      to: '/app/faculty/students',
      icon: GraduationCap,
      roles: [UserRole.FACULTY_SUPERVISOR],
    },
    {
      label: 'Review Submissions',
      to: '/app/faculty/reviews',
      icon: FileCheck,
      roles: [UserRole.FACULTY_SUPERVISOR],
    },
    {
      label: 'Outcome Evaluations',
      to: '/app/faculty/evaluations',
      icon: Award,
      roles: [UserRole.FACULTY_SUPERVISOR],
    },

    // Industry Mentor Navigation
    {
      label: 'Mentored Cohort',
      to: '/app/mentor/cohort',
      icon: Users,
      roles: [UserRole.INDUSTRY_MENTOR],
    },
    {
      label: 'Performance Reviews',
      to: '/app/mentor/reviews',
      icon: Award,
      roles: [UserRole.INDUSTRY_MENTOR],
    },

    // Institutional Admin Navigation
    {
      label: 'Department Registry',
      to: '/app/admin/departments',
      icon: BookOpen,
      roles: [UserRole.INSTITUTION_ADMIN, UserRole.SUPER_ADMIN],
    },
    {
      label: 'Students & Faculty',
      to: '/app/admin/users',
      icon: Users,
      roles: [UserRole.INSTITUTION_ADMIN, UserRole.SUPER_ADMIN],
    },
    {
      label: 'Industry Partners',
      to: '/app/admin/companies',
      icon: Briefcase,
      roles: [UserRole.INSTITUTION_ADMIN, UserRole.SUPER_ADMIN],
    },
    {
      label: 'Workflow Blueprints',
      to: '/app/admin/workflows',
      icon: GitBranch,
      roles: [UserRole.INSTITUTION_ADMIN, UserRole.SUPER_ADMIN],
    },
    {
      label: 'Audit Security Log',
      to: '/app/admin/audit',
      icon: ShieldCheck,
      roles: [UserRole.INSTITUTION_ADMIN, UserRole.SUPER_ADMIN],
    },

    // Universal
    { label: 'Document Vault', to: '/app/documents', icon: FolderArchive },
    { label: 'System Settings', to: '/app/settings', icon: Settings, roles: [UserRole.INSTITUTION_ADMIN, UserRole.SUPER_ADMIN] },
  ];

  const visibleItems = navItems.filter((item) => {
    if (!item.roles) return true;
    if (role === UserRole.SUPER_ADMIN) return true;
    return item.roles.includes(role);
  });

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-[calc(100vh-4rem)] sticky top-16 border-r border-slate-800">
      <div className="p-4">
        <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <Compass className="w-4 h-4 text-indigo-400" />
          <span>Workspace Navigation</span>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Tenant Status Footer */}
      <div className="p-4 border-t border-slate-800">
        <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/60 text-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span>Isolation Mode</span>
            <span className="text-emerald-400 font-mono text-[10px] font-bold">STRICT_ORG</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Server-side tenant security active
          </p>
        </div>
      </div>
    </aside>
  );
};
