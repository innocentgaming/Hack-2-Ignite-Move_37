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
  X,
} from 'lucide-react';

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];
  section?: string;
}

export interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen = false,
  onCloseMobile,
}) => {
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
      section: 'SUPERVISION',
      label: 'My Interns',
      to: '/app/mentor/interns',
      icon: Users,
      roles: [UserRole.MENTOR],
    },
    {
      label: 'Internship Registrations',
      to: '/app/mentor/internship-registrations',
      icon: Briefcase,
      roles: [UserRole.MENTOR],
    },
    {
      section: 'WORK MANAGEMENT',
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
      section: 'EVALUATION',
      label: 'Learning Outcomes',
      to: '/app/mentor/outcomes',
      icon: Target,
      roles: [UserRole.MENTOR],
    },
    {
      label: 'Final Evaluation',
      to: '/app/mentor/evaluation',
      icon: ScrollText,
      roles: [UserRole.MENTOR],
    },
    {
      label: 'Feedback',
      to: '/app/mentor/feedback',
      icon: MessageSquare,
      roles: [UserRole.MENTOR],
    },
    {
      section: 'DOCUMENTS',
      label: 'Documents',
      to: '/app/mentor/documents',
      icon: FolderArchive,
      roles: [UserRole.MENTOR],
    },
    {
      section: 'ACCOUNT',
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
      label: 'Institution Overview',
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
      label: 'Mentor CSV Import',
      to: '/app/admin/mentors/import',
      icon: Users,
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

  const renderNavContent = (onItemClick?: () => void) => (
    <>
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => (
          <React.Fragment key={item.to}>
            {item.section && (
              <div className="pt-3 pb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {item.section}
              </div>
            )}
            <NavLink
              to={item.to}
              end={item.to === '/app/student' || item.to === '/app/mentor' || item.to === '/app/admin'}
              onClick={onItemClick}
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
          </React.Fragment>
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
    </>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300 h-[calc(100vh-4rem)] sticky top-16 border-r border-slate-800 select-none shrink-0">
        <div className="p-4 border-b border-slate-800/60">
          <div className="flex items-center gap-2 px-2 py-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Compass className="w-4 h-4 text-indigo-400" />
            <span>{portalTitle}</span>
          </div>
        </div>
        {renderNavContent()}
      </aside>

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 md:hidden transition-opacity duration-200"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Mobile Off-canvas Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-slate-900 text-slate-300 flex flex-col shadow-2xl md:hidden transform transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Compass className="w-4 h-4 text-indigo-400" />
            <span>{portalTitle}</span>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {renderNavContent(onCloseMobile)}
      </aside>
    </>
  );
};

export default Sidebar;
