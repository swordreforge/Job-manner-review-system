import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isAuthChecked, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    // 只有在认证状态已检查后才决定是否跳转
    if (isAuthChecked && !isAuthenticated) {
      navigate('/auth', { replace: true, state: { from: location } });
    }
  }, [isAuthenticated, isAuthChecked, navigate, location]);

  // 如果还没有检查认证状态，显示加载状态
  if (!isAuthChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  // 如果已检查但未认证，返回null（等待跳转）
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}