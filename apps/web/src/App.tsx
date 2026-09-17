import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import { AppLayout } from './layouts/AppLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { MarketingLayout } from './layouts/MarketingLayout';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { ActivateAccountPage } from './pages/ActivateAccountPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminDepartmentsPage } from './pages/AdminDepartmentsPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminStudentImportPage } from './pages/AdminStudentImportPage';
import { AdminAuditLogsPage } from './pages/AdminAuditLogsPage';
import { AdminSettingsPage } from './pages/AdminSettingsPage';
import { AdminWorkflowsPage } from './pages/AdminWorkflowsPage';
import { TasksPage } from './pages/TasksPage';
import { InternshipsPage } from './pages/InternshipsPage';
import { InternshipRegistrationPage } from './pages/InternshipRegistrationPage';
import { MonitoringPage } from './pages/MonitoringPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { CompletionPage } from './pages/CompletionPage';
import { LoadingPage } from './pages/LoadingPage';
import { ErrorPage } from './pages/ErrorPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Marketing Route */}
            <Route element={<MarketingLayout />}>
              <Route path="/" element={<LandingPage />} />
            </Route>

            {/* Authentication Routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/activate" element={<ActivateAccountPage />} />
            </Route>

            {/* Dedicated Loading & Error Screens */}
            <Route path="/loading" element={<LoadingPage />} />
            <Route path="/error" element={<ErrorPage />} />

            {/* Protected Application Workspace */}
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<Navigate to="/app/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              
              {/* Admin Dedicated Pages */}
              <Route path="admin" element={<DashboardPage />} />
              <Route path="admin/departments" element={<AdminDepartmentsPage />} />
              <Route path="admin/users" element={<AdminUsersPage />} />
              <Route path="admin/students/import" element={<AdminStudentImportPage />} />
              <Route path="admin/audit" element={<AdminAuditLogsPage />} />
              <Route path="admin/workflows" element={<AdminWorkflowsPage />} />
              <Route path="admin/settings" element={<AdminSettingsPage />} />
              <Route path="admin/monitoring" element={<MonitoringPage />} />
              <Route path="admin/analytics" element={<AnalyticsPage />} />
              <Route path="admin/*" element={<DashboardPage />} />

              <Route path="hod/approvals" element={<InternshipsPage />} />
              <Route path="hod/mentors" element={<InternshipsPage />} />
              <Route path="hod/monitoring" element={<MonitoringPage />} />
              <Route path="hod/analytics" element={<AnalyticsPage />} />
              <Route path="hod" element={<DashboardPage />} />
              <Route path="hod/*" element={<DashboardPage />} />

              <Route path="faculty" element={<InternshipsPage />} />
              <Route path="faculty/reviews" element={<InternshipsPage />} />
              <Route path="faculty/evaluations" element={<TasksPage />} />
              <Route path="faculty/monitoring" element={<MonitoringPage />} />
              <Route path="faculty/*" element={<DashboardPage />} />

              <Route path="student/*" element={<DashboardPage />} />

              <Route path="mentor" element={<InternshipsPage />} />
              <Route path="mentor/reviews" element={<TasksPage />} />
              <Route path="mentor/*" element={<DashboardPage />} />

              <Route path="monitoring" element={<MonitoringPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="internships" element={<InternshipsPage />} />
              <Route path="internships/new" element={<InternshipRegistrationPage />} />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="submissions" element={<TasksPage />} />
              <Route path="documents" element={<DashboardPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />

              {/* Phase 8: Completion, Evaluation & Termination */}
              <Route path="completion" element={<CompletionPage />} />
              <Route path="mentor/evaluation" element={<CompletionPage />} />
              <Route path="faculty/completion" element={<CompletionPage />} />
              <Route path="student/completion" element={<CompletionPage />} />
              <Route path="hod/completion" element={<CompletionPage />} />
              <Route path="admin/completion" element={<CompletionPage />} />
            </Route>

            {/* 404 Fallback */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
