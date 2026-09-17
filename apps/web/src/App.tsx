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

// Student Workspace Pages
import { StudentOverviewPage } from './pages/student/StudentOverviewPage';
import { StudentInternshipPage } from './pages/student/StudentInternshipPage';
import { StudentMilestonesPage } from './pages/student/StudentMilestonesPage';
import { StudentMilestoneDetailPage } from './pages/student/StudentMilestoneDetailPage';
import { StudentTasksPage } from './pages/student/StudentTasksPage';
import { StudentTaskDetailPage } from './pages/student/StudentTaskDetailPage';
import { StudentSubmissionsPage } from './pages/student/StudentSubmissionsPage';
import { StudentSubmissionDetailPage } from './pages/student/StudentSubmissionDetailPage';
import { StudentOutcomesPage } from './pages/student/StudentOutcomesPage';
import { StudentFeedbackPage } from './pages/student/StudentFeedbackPage';
import { StudentSubmitEvidencePage } from './pages/student/StudentSubmitEvidencePage';
import { StudentDocumentsPage } from './pages/student/StudentDocumentsPage';
import { StudentDocumentViewerPage } from './pages/student/StudentDocumentViewerPage';
import { StudentProfilePage } from './pages/student/StudentProfilePage';

// Mentor Workspace Pages
import { MentorOverviewPage } from './pages/mentor/MentorOverviewPage';
import { MentorInternsPage } from './pages/mentor/MentorInternsPage';
import { MentorInternDetailPage } from './pages/mentor/MentorInternDetailPage';
import { MentorRegistrationsPage } from './pages/mentor/MentorRegistrationsPage';
import { MentorMilestonesPage } from './pages/mentor/MentorMilestonesPage';
import { MentorMilestoneDetailPage } from './pages/mentor/MentorMilestoneDetailPage';
import { MentorTasksPage } from './pages/mentor/MentorTasksPage';
import { MentorSubmissionsPage } from './pages/mentor/MentorSubmissionsPage';
import { MentorOutcomesPage } from './pages/mentor/MentorOutcomesPage';
import { MentorFeedbackPage } from './pages/mentor/MentorFeedbackPage';
import { MentorDocumentsPage } from './pages/mentor/MentorDocumentsPage';
import { MentorProfilePage } from './pages/mentor/MentorProfilePage';

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

              {/* Student Dedicated Routes */}
              <Route path="student" element={<StudentOverviewPage />} />
              <Route path="student/internship" element={<StudentInternshipPage />} />
              <Route path="student/milestones" element={<StudentMilestonesPage />} />
              <Route path="student/milestones/:id" element={<StudentMilestoneDetailPage />} />
              <Route path="student/tasks" element={<StudentTasksPage />} />
              <Route path="student/tasks/:taskId" element={<StudentTaskDetailPage />} />
              <Route path="student/tasks/:taskId/submit" element={<StudentSubmitEvidencePage />} />
              <Route path="student/tasks/:id" element={<StudentTaskDetailPage />} />
              <Route path="student/submissions" element={<StudentSubmissionsPage />} />
              <Route path="student/submissions/:submissionId" element={<StudentSubmissionDetailPage />} />
              <Route path="student/submissions/:id" element={<StudentSubmissionDetailPage />} />
              <Route path="student/outcomes" element={<StudentOutcomesPage />} />
              <Route path="student/feedback" element={<StudentFeedbackPage />} />
              <Route path="student/documents" element={<StudentDocumentsPage />} />
              <Route path="student/documents/:documentId/view" element={<StudentDocumentViewerPage />} />
              <Route path="student/documents/:id/view" element={<StudentDocumentViewerPage />} />
              <Route path="student/profile" element={<StudentProfilePage />} />

              {/* Mentor Dedicated Routes */}
              <Route path="mentor" element={<MentorOverviewPage />} />
              <Route path="mentor/interns" element={<MentorInternsPage />} />
              <Route path="mentor/interns/:studentId" element={<MentorInternDetailPage />} />
              <Route path="mentor/internship-registrations" element={<MentorRegistrationsPage />} />
              <Route path="mentor/internships" element={<Navigate to="/app/mentor/internship-registrations" replace />} />
              <Route path="mentor/milestones" element={<MentorMilestonesPage />} />
              <Route path="mentor/milestones/:milestoneId" element={<MentorMilestoneDetailPage />} />
              <Route path="mentor/milestones/:id" element={<MentorMilestoneDetailPage />} />
              <Route path="mentor/tasks" element={<MentorTasksPage />} />
              <Route path="mentor/tasks/:taskId" element={<MentorTasksPage />} />
              <Route path="mentor/tasks/:id" element={<MentorTasksPage />} />
              <Route path="mentor/submissions" element={<MentorSubmissionsPage />} />
              <Route path="mentor/submissions/:submissionId" element={<MentorSubmissionsPage />} />
              <Route path="mentor/submissions/:id" element={<MentorSubmissionsPage />} />
              <Route path="mentor/outcomes" element={<MentorOutcomesPage />} />
              <Route path="mentor/outcomes/:outcomeId" element={<MentorOutcomesPage />} />
              <Route path="mentor/outcomes/:id" element={<MentorOutcomesPage />} />
              <Route path="mentor/feedback" element={<MentorFeedbackPage />} />
              <Route path="mentor/documents" element={<MentorDocumentsPage />} />
              <Route path="mentor/profile" element={<MentorProfilePage />} />

              {/* Common Routes */}
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
              <Route path="student/completion" element={<CompletionPage />} />
              <Route path="admin/completion" element={<CompletionPage />} />
            </Route>

            {/* Direct convenience redirects */}
            <Route path="/student/*" element={<Navigate to="/app/student" replace />} />
            <Route path="/mentor/*" element={<Navigate to="/app/mentor" replace />} />

            {/* 404 Fallback */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
