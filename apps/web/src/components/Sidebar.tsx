import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '@internos/types';
import { normalizeRole } from '@internos/shared';
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
  UserPlus,
  Activity,
  FileSpreadsheet,
  ClipboardList,
} from 'lucide-react';

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];
}

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const rawRole = user?.role || UserRole.STUDENT;
  const role = normalizeRole(rawRole);

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
      to: '/app/faculty',
      icon: GraduationCap,
      roles: [UserRole.FACULTY],
    },
    {
      label: 'Cohort Monitoring',
      to: '/app/faculty/monitoring',
      icon: Activity,
      roles: [UserRole.FACULTY],
    },
    {
      label: 'Review Submissions',
      to: '/app/faculty/reviews',
      icon: FileCheck,
      roles: [UserRole.FACULTY],
    },
    {
      label: 'Outcome Evaluations',
      to: '/app/faculty/evaluations',
      icon: Award,
      roles: [UserRole.FACULTY],
    },

    // HOD Navigation
    {
      label: 'Department Oversight',
      to: '/app/hod',
      icon: BookOpen,
      roles: [UserRole.HOD],
    },
    {
      label: 'Mentor Assignment',
      to: '/app/hod/mentors',
      icon: Users,
      roles: [UserRole.HOD],
    },
    {
      label: 'Internship Approvals',
      to: '/app/hod/approvals',
      icon: FileCheck,
      roles: [UserRole.HOD],
    },
    {
      label: 'Department Monitoring',
      to: '/app/hod/monitoring',
      icon: Activity,
      roles: [UserRole.HOD],
    },

    // Industry Mentor Navigation
    {
      label: 'Mentored Cohort',
      to: '/app/mentor',
      icon: Users,
      roles: [UserRole.MENTOR],
    },
    {
      label: 'Performance Reviews',
      to: '/app/mentor/reviews',
      icon: Award,
      roles: [UserRole.MENTOR],
    },

    // Institutional Admin Navigation
    {
      label: 'Tenant Governance',
      to: '/app/admin',
      icon: ShieldCheck,
      roles: [UserRole.ADMIN],
    },
    {
      label: 'Institution Health',
      to: '/app/admin/monitoring',
      icon: Activity,
      roles: [UserRole.ADMIN],
    },
    {
      label: 'Department Registry',
      to: '/app/admin/departments',
      icon: BookOpen,
      roles: [UserRole.ADMIN],
    },
    {
      label: 'Users & Invites',
      to: '/app/admin/users',
      icon: UserPlus,
      roles: [UserRole.ADMIN, UserRole.HOD],
    },
    {
      label: 'Student CSV Import',
      to: '/app/admin/students/import',
      icon: FileSpreadsheet,
      roles: [UserRole.ADMIN],
    },
    {
      label: 'Audit Trail',
      to: '/app/admin/audit',
      icon: ClipboardList,
      roles: [UserRole.ADMIN],
    },
    {
      label: 'Workflow Blueprints',
      to: '/app/admin/workflows',
      icon: GitBranch,
      roles: [UserRole.ADMIN],
    },

    // Universal
    { label: 'Document Vault', to: '/app/documents', icon: FolderArchive },
    { label: 'System Settings', to: '/app/admin/settings', icon: Settings, roles: [UserRole.ADMIN] },
  ];

  const visibleItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(role);
  });

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-[calc(100vh-4rem)] sticky top-16 border-r border-slate-800">
      <div className="p-4">
        <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <Compass className="w-4 h-4 text-indigo-400" />
          <span>{role} Portal</span>
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
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            {user?.organizationName || user?.organizationCode || 'Organization'}
          </p>
        </div>
      </div>
    </aside>
  );
};
