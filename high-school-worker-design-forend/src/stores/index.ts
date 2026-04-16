import { create } from 'zustand';
import { userApi } from '../api';
import type { User, Student, Job, MatchResult, Report } from '../types';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isAuthChecked: boolean;
  role: 'student' | 'teacher' | 'admin';
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  clearAuth: () => void;
  initialize: () => void;
  setAuthChecked: (checked: boolean) => void;
  setRole: (role: 'student' | 'teacher' | 'admin') => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isAuthChecked: false,
  role: 'student',

  setToken: (token) => {
    localStorage.setItem('token', token);
    set({ token, isAuthenticated: true, isAuthChecked: true });
  },

  setUser: (user) => set({ user, role: (user?.role as 'student' | 'teacher' | 'admin') || 'student' }),

  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null, isAuthenticated: false, isAuthChecked: true, role: 'student' });
  },

  clearAuth: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null, isAuthenticated: false, isAuthChecked: true, role: 'student' });
  },

  setRole: (role) => set({ role }),

  initialize: async () => {
    const token = localStorage.getItem('token');
    if (token) {
      set({ token, isAuthenticated: true });
      try {
        const res = await userApi.getInfo();
        if (res?.data) {
          set({ 
            user: res.data, 
            role: (res.data.role as 'student' | 'teacher' | 'admin') || 'student' 
          });
        }
      } catch (e) {
        localStorage.removeItem('token');
        set({ token: null, user: null, isAuthenticated: false, role: 'student' });
      }
    } else {
      set({ isAuthenticated: false });
    }
    set({ isAuthChecked: true });
  },

  setAuthChecked: (checked) => set({ isAuthChecked: checked }),
}));

interface StudentState {
  currentStudent: Student | null;
  students: Student[];
  setCurrentStudent: (student: Student | null) => void;
  setStudents: (students: Student[]) => void;
}

export const useStudentStore = create<StudentState>((set) => ({
  currentStudent: null,
  students: [],
  setCurrentStudent: (student) => set({ currentStudent: student }),
  setStudents: (students) => set({ students }),
}));

interface JobState {
  jobs: Job[];
  currentJob: Job | null;
  recommendations: Job[];
  matchResults: MatchResult[];
  setJobs: (jobs: Job[]) => void;
  setCurrentJob: (job: Job | null) => void;
  setRecommendations: (jobs: Job[]) => void;
  setMatchResults: (results: MatchResult[]) => void;
}

export const useJobStore = create<JobState>((set) => ({
  jobs: [],
  currentJob: null,
  recommendations: [],
  matchResults: [],
  setJobs: (jobs) => set({ jobs }),
  setCurrentJob: (job) => set({ currentJob: job }),
  setRecommendations: (jobs) => set({ recommendations: jobs }),
  setMatchResults: (results) => set({ matchResults: results }),
}));

interface ReportState {
  reports: Report[];
  currentReport: Report | null;
  setReports: (reports: Report[]) => void;
  setCurrentReport: (report: Report | null) => void;
}

export const useReportStore = create<ReportState>((set) => ({
  reports: [],
  currentReport: null,
  setReports: (reports) => set({ reports }),
  setCurrentReport: (report) => set({ currentReport: report }),
}));

interface UIState {
  loading: boolean;
  activeTab: string;
  track: 'bigtech' | 'gov';
  setLoading: (loading: boolean) => void;
  setActiveTab: (tab: string) => void;
  setTrack: (track: 'bigtech' | 'gov') => void;
}

export const useUIStore = create<UIState>((set) => ({
  loading: false,
  activeTab: 'home',
  track: 'bigtech',
  setLoading: (loading) => set({ loading }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setTrack: (track) => set({ track }),
}));

interface TaskState {
  hasActiveTask: boolean;
  taskDescription: string;
  setActiveTask: (active: boolean, description?: string) => void;
}

export const useTaskStore = create<TaskState>((set) => ({
  hasActiveTask: false,
  taskDescription: '',
  setActiveTask: (active, description = '') => set({ hasActiveTask: active, taskDescription: description }),
}));

interface ThemeState {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
}

const getInitialTheme = (): 'light' | 'dark' => {
  const stored = localStorage.getItem('theme');
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const useThemeStore = create<ThemeState>((set) => ({
  theme: getInitialTheme(),

  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    set({ theme });
  },

  toggleTheme: () => {
    set((state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
      return { theme: newTheme };
    });
  },
}));