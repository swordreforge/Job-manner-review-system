import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import GlobalBackground from './components/GlobalBackground';
import { useAuthStore } from './stores';

const Landing = lazy(() => import('./pages/Home/Landing'));
const HomePage = lazy(() => import('./pages/Home'));
const PlanPage = lazy(() => import('./pages/Plan'));
const ResumePage = lazy(() => import('./pages/Resume'));
const ProfilePage = lazy(() => import('./pages/Profile'));
const SettingsPage = lazy(() => import('./pages/Settings'));
const StudentPage = lazy(() => import('./pages/Student'));
const JobsPage = lazy(() => import('./pages/Jobs'));
const AuthPage = lazy(() => import('./pages/Auth'));
const HollandTestPage = lazy(() => import('./pages/Holland'));
const HollandResultPage = lazy(() => import('./pages/Holland/Result'));
const HollandHistoryPage = lazy(() => import('./pages/Holland/History'));
const InterviewPage = lazy(() => import('./pages/Interview'));
const DocPage = lazy(() => import('./pages/Doc'));

function RouteLoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center text-gray-400">
      页面加载中...
    </div>
  );
}

function RootRedirect() {
  const { isAuthenticated, isAuthChecked, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!isAuthChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-400">
        加载中...
      </div>
    );
  }

  return <Navigate to={isAuthenticated ? '/start' : '/welcome'} replace />;
}

import { useEffect } from 'react';

export default function App() {
  return (
    <>
      <GlobalBackground />
      <Suspense fallback={<RouteLoadingFallback />}>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/welcome" element={<Landing />} />
          <Route path="/" element={<MainLayout />}>
            <Route index element={<RootRedirect />} />
            <Route path="start" element={<HomePage />} />
            <Route
              path="plan"
              element={
                <ProtectedRoute>
                  <PlanPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="resume"
              element={
                <ProtectedRoute>
                  <ResumePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="student"
              element={
                <ProtectedRoute>
                  <StudentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="jobs"
              element={
                <ProtectedRoute>
                  <JobsPage />
                </ProtectedRoute>
              }
            />
          </Route>
          <Route
            path="/holland"
            element={
              <ProtectedRoute>
                <HollandTestPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/holland/result/:id"
            element={
              <ProtectedRoute>
                <HollandResultPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/holland/history"
            element={
              <ProtectedRoute>
                <HollandHistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview"
            element={
              <ProtectedRoute>
                <InterviewPage />
              </ProtectedRoute>
            }
          />
          <Route path="/doc" element={<DocPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}
