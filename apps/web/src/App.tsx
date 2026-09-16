import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './layouts/AppLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { MarketingLayout } from './layouts/MarketingLayout';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Marketing Route */}
          <Route element={<MarketingLayout />}>
            <Route path="/" element={<LandingPage />} />
          </Route>

          {/* Authentication Route */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

          {/* Protected Application Workspace */}
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="internships" element={<DashboardPage />} />
            <Route path="tasks" element={<DashboardPage />} />
            <Route path="submissions" element={<DashboardPage />} />
            <Route path="faculty/*" element={<DashboardPage />} />
            <Route path="mentor/*" element={<DashboardPage />} />
            <Route path="admin/*" element={<DashboardPage />} />
            <Route path="documents" element={<DashboardPage />} />
            <Route path="settings" element={<DashboardPage />} />
          </Route>

          {/* 404 Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
