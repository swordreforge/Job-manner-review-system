import { useEffect } from 'react';
import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme as antdTheme, type ThemeConfig } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import GlobalBackground from './components/GlobalBackground';
import { useAuthStore, useThemeStore } from './stores';

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

const TeacherDashboard = lazy(() => import('./pages/Teacher/Dashboard'));
const TeacherStudents = lazy(() => import('./pages/Teacher/Students'));
const TeacherInviteCodes = lazy(() => import('./pages/Teacher/InviteCodes'));
const TeacherAlerts = lazy(() => import('./pages/Teacher/Alerts'));
const TeacherProfilePage = lazy(() => import('./pages/Teacher/Profile'));
const TeacherMessagesPage = lazy(() => import('./pages/Teacher/Messages'));
const StudentMessagesPage = lazy(() => import('./pages/Messages'));

type ThemePalette = {
  primary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  surface: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  onSurface: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
};

const lightPalette: ThemePalette = {
  primary: '#0B57D0',
  primaryContainer: '#D3E4FF',
  onPrimaryContainer: '#001B3D',
  success: '#1B8C3B',
  warning: '#8F5900',
  error: '#BA1A1A',
  info: '#0B57D0',
  surface: '#FDFCFF',
  surfaceContainerLow: '#F7F2F8',
  surfaceContainer: '#F0EDF2',
  surfaceContainerHigh: '#EBE7ED',
  onSurface: '#1B1B1F',
  onSurfaceVariant: '#44474F',
  outline: '#74777F',
  outlineVariant: '#C4C6D0',
};

const darkPalette: ThemePalette = {
  primary: '#A9C7FF',
  primaryContainer: '#0B57D0',
  onPrimaryContainer: '#EAF1FF',
  success: '#89D394',
  warning: '#F2C04D',
  error: '#F2B8B5',
  info: '#A9C7FF',
  surface: '#1B1B1F',
  surfaceContainerLow: '#1D1B20',
  surfaceContainer: '#211F26',
  surfaceContainerHigh: '#2B2930',
  onSurface: '#E4E1E6',
  onSurfaceVariant: '#C4C6D0',
  outline: '#8E9099',
  outlineVariant: '#44474F',
};

function createAntdThemeConfig(isDark: boolean): ThemeConfig {
  const palette = isDark ? darkPalette : lightPalette;

  return {
    algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: palette.primary,
      colorSuccess: palette.success,
      colorWarning: palette.warning,
      colorError: palette.error,
      colorInfo: palette.info,
      colorText: palette.onSurface,
      colorTextSecondary: palette.onSurfaceVariant,
      colorTextTertiary: palette.onSurfaceVariant,
      colorTextQuaternary: palette.onSurfaceVariant,
      colorBgBase: palette.surface,
      colorBgContainer: palette.surfaceContainer,
      colorBgElevated: palette.surfaceContainerHigh,
      colorFillAlter: palette.surfaceContainerLow,
      colorBorder: palette.outlineVariant,
      colorBorderSecondary: palette.outlineVariant,
      colorSplit: palette.outlineVariant,
      borderRadius: 12,
      wireframe: false,
    },
    components: {
      Card: {
        colorBgContainer: palette.surfaceContainerLow,
        colorBorderSecondary: palette.outlineVariant,
        headerBg: palette.surfaceContainerLow,
      },
      Collapse: {
        headerBg: palette.surfaceContainerLow,
        contentBg: palette.surfaceContainer,
        colorBorder: palette.outlineVariant,
      },
      Descriptions: {
        colorBgContainer: palette.surfaceContainerLow,
        labelBg: palette.surfaceContainerHigh,
        colorText: palette.onSurface,
        colorTextLabel: palette.onSurfaceVariant,
      },
      Drawer: {
        colorBgElevated: palette.surface,
        colorText: palette.onSurface,
      },
      Empty: {
        colorText: palette.onSurfaceVariant,
        colorTextDescription: palette.onSurfaceVariant,
      },
      Form: {
        labelColor: palette.onSurface,
      },
      Input: {
        colorBgContainer: palette.surfaceContainerLow,
        colorBorder: palette.outline,
        colorText: palette.onSurface,
        colorTextPlaceholder: palette.onSurfaceVariant,
        activeBorderColor: palette.primary,
        hoverBorderColor: palette.primary,
      },
      List: {
        colorText: palette.onSurface,
        colorTextDescription: palette.onSurfaceVariant,
      },
      Modal: {
        contentBg: palette.surfaceContainer,
        headerBg: palette.surfaceContainer,
      },
      Popover: {
        colorBgElevated: palette.surfaceContainer,
      },
      Segmented: {
        trackBg: palette.surfaceContainerHigh,
        itemColor: palette.onSurfaceVariant,
        itemHoverColor: palette.onSurface,
        itemSelectedBg: palette.surfaceContainerLow,
        itemSelectedColor: palette.onSurface,
      },
      Select: {
        colorBgContainer: palette.surfaceContainerLow,
        colorBorder: palette.outline,
        colorText: palette.onSurface,
        colorTextPlaceholder: palette.onSurfaceVariant,
        optionActiveBg: palette.surfaceContainerHigh,
        optionSelectedBg: palette.primaryContainer,
        optionSelectedColor: palette.onPrimaryContainer,
        selectorBg: palette.surfaceContainerLow,
      },
      Table: {
        colorBgContainer: palette.surfaceContainerLow,
        headerBg: palette.surfaceContainerHigh,
        headerColor: palette.onSurface,
        borderColor: palette.outlineVariant,
        rowHoverBg: palette.surfaceContainerHigh,
        colorText: palette.onSurface,
      },
      Tabs: {
        itemColor: palette.onSurfaceVariant,
        itemHoverColor: palette.primary,
        itemSelectedColor: palette.primary,
        inkBarColor: palette.primary,
        cardBg: palette.surfaceContainer,
      },
      Tag: {
        defaultBg: palette.surfaceContainerHigh,
        defaultColor: palette.onSurface,
      },
      Upload: {
        colorText: palette.onSurface,
        colorTextDescription: palette.onSurfaceVariant,
      },
    },
  };
}

function RouteLoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center text-gray-400">
      椤甸潰鍔犺浇涓?..
    </div>
  );
}

function RootRedirect() {
  const { isAuthenticated, isAuthChecked, initialize, role } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!isAuthChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-400">
        鍔犺浇涓?..
      </div>
    );
  }

  const targetPath = isAuthenticated ? (role === 'teacher' ? '/teacher/index' : '/start') : '/welcome';
  return <Navigate to={targetPath} replace />;
}

export default function App() {
  const { initialize } = useAuthStore();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') {
      document.documentElement.setAttribute('data-theme', stored);
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  return (
    <>
      <GlobalBackground />
      <ConfigProvider locale={zhCN} theme={createAntdThemeConfig(isDark)}>
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
              <Route
                path="messages"
                element={
                  <ProtectedRoute>
                    <StudentMessagesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="teacher/index"
                element={
                  <ProtectedRoute>
                    <TeacherDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="teacher/students"
                element={
                  <ProtectedRoute>
                    <TeacherStudents />
                  </ProtectedRoute>
                }
              />
              <Route
                path="teacher/invite-codes"
                element={
                  <ProtectedRoute>
                    <TeacherInviteCodes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="teacher/alerts"
                element={
                  <ProtectedRoute>
                    <TeacherAlerts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="teacher/messages"
                element={
                  <ProtectedRoute>
                    <TeacherMessagesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="teacher/settings"
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="teacher/profile"
                element={
                  <ProtectedRoute>
                    <TeacherProfilePage />
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
      </ConfigProvider>
    </>
  );
}
