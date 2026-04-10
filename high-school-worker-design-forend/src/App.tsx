import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Landing from './pages/Home/Landing';
import HomePage from './pages/Home';
import PlanPage from './pages/Plan';
import ResumePage from './pages/Resume';
import ProfilePage from './pages/Profile';
import SettingsPage from './pages/Settings';
import StudentPage from './pages/Student';
import JobsPage from './pages/Jobs';
import AuthPage from './pages/Auth';
import HollandTestPage from './pages/Holland';
import HollandResultPage from './pages/Holland/Result';
import HollandHistoryPage from './pages/Holland/History';
import InterviewPage from './pages/Interview';
import ProtectedRoute from './components/ProtectedRoute';
import GlobalBackground from './components/GlobalBackground';

export default function App() {
  return (
    <>
      <GlobalBackground />
      <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/welcome" element={<Landing />} />
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/welcome" replace />} />
        <Route path="start" element={<HomePage />} />
        <Route path="plan" element={
          <ProtectedRoute>
            <PlanPage />
          </ProtectedRoute>
        } />
        <Route path="resume" element={
          <ProtectedRoute>
            <ResumePage />
          </ProtectedRoute>
        } />
        <Route path="profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
        <Route path="settings" element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        } />
        <Route path="student" element={
          <ProtectedRoute>
            <StudentPage />
          </ProtectedRoute>
        } />
        <Route path="jobs" element={
          <ProtectedRoute>
            <JobsPage />
          </ProtectedRoute>
        } />
      </Route>
      <Route path="/holland" element={
        <ProtectedRoute>
          <HollandTestPage />
        </ProtectedRoute>
      } />
      <Route path="/holland/result/:id" element={
        <ProtectedRoute>
          <HollandResultPage />
        </ProtectedRoute>
      } />
      <Route path="/holland/history" element={
        <ProtectedRoute>
          <HollandHistoryPage />
        </ProtectedRoute>
      } />
      <Route path="/interview" element={
        <ProtectedRoute>
          <InterviewPage />
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}
