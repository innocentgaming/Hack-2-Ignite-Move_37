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
              
              {/* Admin Phase 2 Dedicated Pages */}
              <Route path="admin" element={<DashboardPage />} />
              <Route path="admin/departments" element={<AdminDepartmentsPage />} />
              <Route path="admin/users" element={<AdminUsersPage />} />
              <Route path="admin/students/import" element={<AdminStudentImportPage />} />
              <Route path="admin/audit" element={<AdminAuditLogsPage />} />
              <Route path="admin/settings" element={<AdminSettingsPage />} />
              <Route path="admin/*" element={<DashboardPage />} />

              <Route path="hod/*" element={<DashboardPage />} />
              <Route path="faculty/*" element={<DashboardPage />} />
              <Route path="student/*" element={<DashboardPage />} />
              <Route path="mentor/*" element={<DashboardPage />} />
              <Route path="internships" element={<DashboardPage />} />
              <Route path="tasks" element={<DashboardPage />} />
              <Route path="submissions" element={<DashboardPage />} />
              <Route path="documents" element={<DashboardPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
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
