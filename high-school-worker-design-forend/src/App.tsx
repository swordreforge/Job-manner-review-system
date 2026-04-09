import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/Home';
import PlanPage from './pages/Plan';
import ResumePage from './pages/Resume';
import ProfilePage from './pages/Profile';
import StudentPage from './pages/Student';
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
      <Route path="/" element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route index element={<HomePage />} />
        <Route path="plan" element={<PlanPage />} />
        <Route path="resume" element={<ResumePage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="student" element={<StudentPage />} />
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