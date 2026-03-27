import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/Home';
import PlanPage from './pages/Plan';
import ResumePage from './pages/Resume';
import ProfilePage from './pages/Profile';
import StudentPage from './pages/Student';
import AuthPage from './pages/Auth';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}