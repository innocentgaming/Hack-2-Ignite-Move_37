import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '@internos/types';
import { normalizeRole } from '@internos/shared';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  GitBranch,
  CheckSquare,
  FileCheck,
  Target,
  MessageSquare,
  FolderArchive,
  User,
  ShieldCheck,
  Activity,
  BarChart3,
  BookOpen,
  UserPlus,
  FileSpreadsheet,
  ClipboardList,
  ScrollText,
  Settings,
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
  const rawRole = user?.role || UserRole.STUDENT;
  const role = normalizeRole(rawRole);

  const navItems: NavItem[] = [
    // ---------------------------------------------------------
    // STUDENT WORKSPACE NAVIGATION
    // ---------------------------------------------------------
    {
      label: 'Overview',
      to: '/app/student',
      icon: LayoutDashboard,
      roles: [UserRole.STUDENT],
    },
    {
      label: 'My Internship',
      to: '/app/student/internship',
      icon: Briefcase,
      roles: [UserRole.STUDENT],
    },
    {
      label: 'Milestones',
      to: '/app/student/milestones',
      icon: GitBranch,
      roles: [UserRole.STUDENT],
    },
    {
      label: 'Tasks',
      to: '/app/student/tasks',
      icon: CheckSquare,
      roles: [UserRole.STUDENT],
    },
    {
      label: 'Submissions',
      to: '/app/student/submissions',
      icon: FileCheck,
      roles: [UserRole.STUDENT],
    },
    {
      label: 'Learning Outcomes',
      to: '/app/student/outcomes',
      icon: Target,
      roles: [UserRole.STUDENT],
    },
    {
      label: 'Feedback',
      to: '/app/student/feedback',
      icon: MessageSquare,
      roles: [UserRole.STUDENT],
    },
    {
      label: 'Documents',
      to: '/app/student/documents',
      icon: FolderArchive,
      roles: [UserRole.STUDENT],
    },
    {
      label: 'Profile',
      to: '/app/student/profile',
      icon: User,
      roles: [UserRole.STUDENT],
    },

    // ---------------------------------------------------------
    // MENTOR WORKSPACE NAVIGATION
    // ---------------------------------------------------------
    {
      label: 'Overview',
      to: '/app/mentor',
      icon: LayoutDashboard,
      roles: [UserRole.MENTOR],
    },
    {
      label: 'My Interns',
      to: '/app/mentor/interns',
      icon: Users,
      roles: [UserRole.MENTOR],
    },
    {
      label: 'Internships',
      to: '/app/mentor/internships',
      icon: Briefcase,
      roles: [UserRole.MENTOR],
    },
    {
      label: 'Milestones',
      to: '/app/mentor/milestones',
      icon: GitBranch,
      roles: [UserRole.MENTOR],
    },
    {
      label: 'Tasks',
      to: '/app/mentor/tasks',
      icon: CheckSquare,
      roles: [UserRole.MENTOR],
    },
    {
      label: 'Submissions',
      to: '/app/mentor/submissions',
      icon: FileCheck,
      roles: [UserRole.MENTOR],
    },
    {
      label: 'Feedback',
      to: '/app/mentor/feedback',
      icon: MessageSquare,
      roles: [UserRole.MENTOR],
    },
    {
      label: 'Learning Outcomes',
      to: '/app/mentor/outcomes',
      icon: Target,
      roles: [UserRole.MENTOR],
    },
    {
      label: 'Documents',
      to: '/app/mentor/documents',
      icon: FolderArchive,
      roles: [UserRole.MENTOR],
    },
    {
      label: 'Profile',
      to: '/app/mentor/profile',
      icon: User,
      roles: [UserRole.MENTOR],
    },

    // ---------------------------------------------------------
    // ADMIN WORKSPACE NAVIGATION (Preserved untouched)
    // ---------------------------------------------------------
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
      label: 'Institutional Analytics',
      to: '/app/admin/analytics',
      icon: BarChart3,
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
      roles: [UserRole.ADMIN],
    },
    {
      label: 'Student CSV Import',
      to: '/app/admin/students/import',
      icon: FileSpreadsheet,
      roles: [UserRole.ADMIN],
    },
    {
      label: 'Workflow Blueprints',
      to: '/app/admin/workflows',
      icon: GitBranch,
      roles: [UserRole.ADMIN],
    },
    {
      label: 'Audit Trail',
      to: '/app/admin/audit',
      icon: ClipboardList,
      roles: [UserRole.ADMIN],
    },
    {
      label: 'Completion Admin',
      to: '/app/admin/completion',
      icon: ScrollText,
      roles: [UserRole.ADMIN],
    },
    {
      label: 'System Settings',
      to: '/app/admin/settings',
      icon: Settings,
      roles: [UserRole.ADMIN],
    },
  ];

  const visibleItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(role);
  });

  const portalTitle =
    role === UserRole.STUDENT
      ? 'Student Workspace'
      : role === UserRole.MENTOR
      ? 'Mentor Workspace'
      : 'Admin Console';

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-[calc(100vh-4rem)] sticky top-16 border-r border-slate-800 select-none">
      <div className="p-4 border-b border-slate-800/60">
        <div className="flex items-center gap-2 px-2 py-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <Compass className="w-4 h-4 text-indigo-400" />
          <span>{portalTitle}</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/app/student' || item.to === '/app/mentor' || item.to === '/app/admin'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Tenant Context Badge */}
      <div className="p-4 border-t border-slate-800/80">
        <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/60 text-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span>Tenant Root</span>
            <span className="text-emerald-400 font-mono text-[10px] font-bold">ISOLATED</span>
          </div>
          <p className="text-[11px] text-slate-300 font-medium truncate">
            {user?.organizationName || user?.organizationCode || 'Organization A'}
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
