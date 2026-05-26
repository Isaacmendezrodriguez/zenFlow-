import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { ArchivePage } from "../features/archive/ArchivePage";
import { ProtectedRoute, PublicOnlyRoute } from "../features/auth/AuthProvider";
import { LoginPage } from "../features/auth/LoginPage";
import { OnboardingPage } from "../features/auth/OnboardingPage";
import { BacklogPage } from "../features/backlog/BacklogPage";
import { TodoWeeklyPage } from "../features/calendar/TodoWeeklyPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { OrganizationsPage } from "../features/organizations/OrganizationsPage";
import { ProjectsPage } from "../features/projects/ProjectsPage";
import { SettingsPage } from "../features/settings/SettingsPage";
import { TaskDetailPage } from "../features/tasks/TaskDetailPage";
import { TrashPage } from "../features/trash/TrashPage";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
      <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
      <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/backlog" element={<BacklogPage />} />
        <Route path="/todo-weekly" element={<TodoWeeklyPage />} />
        <Route path="/organizations" element={<OrganizationsPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/archive" element={<ArchivePage />} />
        <Route path="/trash" element={<TrashPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/tasks/:taskId" element={<TaskDetailPage />} />
      </Route>
    </Routes>
  );
}
