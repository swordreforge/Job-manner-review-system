import { create } from 'zustand';
import { userApi } from '../api';
import type { User, Student, Job, MatchResult, Report, AIConversation, AIMessage } from '../types';
import { aiApi, interviewApi } from '../api';

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

const _clearAuthState = { token: null, user: null, isAuthenticated: false, isAuthChecked: true, role: 'student' as const };

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
    set(_clearAuthState);
  },

  clearAuth: () => {
    localStorage.removeItem('token');
    set(_clearAuthState);
  },

  setRole: (role) => set({ role }),

  initialize: async () => {
    const token = localStorage.getItem('token');
    if (token) {
      set({ token, isAuthenticated: true });
      try {
        const res = await userApi.getInfo();
        if (res?.data) {
          console.log('[Store] user loaded:', res.data);
          set({ 
            user: res.data, 
            role: (res.data.role as 'student' | 'teacher' | 'admin') || 'student' 
          });
        }
      } catch {
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

interface AIChatState {
  conversations: AIConversation[];
  currentConversationId: number | null;
  messages: AIMessage[];
  isStreaming: boolean;
  mode: 'normal' | 'interview';
  currentScore: number | null;
  currentFeedback: string;
  averageScore: number;
  loadConversations: () => Promise<void>;
  createConversation: (name?: string, chatType?: 'ai_assistant' | 'interview_review', mode?: 'practice' | 'assessment') => Promise<AIConversation | null>;
  renameConversation: (id: number, name: string) => Promise<void>;
  deleteConversation: (id: number) => Promise<void>;
  selectConversation: (id: number) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  setMode: (mode: 'normal' | 'interview') => void;
  clearCurrentConversation: () => void;
  endInterview: (sessionId: number) => Promise<void>;
}

export const useAIChatStore = create<AIChatState>((set, get) => ({
  conversations: [],
  currentConversationId: null,
  messages: [],
  isStreaming: false,
  mode: 'normal',
  currentScore: null,
  currentFeedback: '',
  averageScore: 0,

  loadConversations: async () => {
    try {
      const res = await aiApi.listConversations();
      if (res?.data) {
        const conversations = Array.isArray(res.data) ? res.data : [];
        set({ conversations });

        const { currentConversationId } = get();
        if (currentConversationId) {
          const current = conversations.find((c: AIConversation) => c.id === currentConversationId);
          if (current?.chatType === 'interview_review' && current?.interviewSessionId) {
            try {
              const detail = await interviewApi.getDetail(current.interviewSessionId);
              if (detail?.data) {
                set({ averageScore: detail.data.averageScore || 0 });
              }
            } catch {
              // ignore
            }
          }
        }
      }
    } catch (e) {
      console.error('Failed to load AI conversations:', e);
    }
  },

  createConversation: async (name?: string, chatType?: 'ai_assistant' | 'interview_review', mode?: 'practice' | 'assessment') => {
    try {
      const data: { name?: string; chatType?: 'ai_assistant' | 'interview_review'; mode?: 'practice' | 'assessment' } = {};
      if (name) data.name = name;
      if (chatType) data.chatType = chatType;
      if (mode) data.mode = mode;
      if (!data.name) {
        data.name = chatType === 'interview_review'
          ? (mode === 'assessment' ? '国企综合面' : '大厂技术面')
          : '新对话';
      }
      const res = await aiApi.createConversation(data);
      if (res?.data) {
        const newConv = res.data;
        set((state) => ({
          conversations: [newConv, ...state.conversations],
          currentConversationId: newConv.id,
          messages: [],
          currentScore: null,
          currentFeedback: '',
          averageScore: 0,
        }));
        await get().loadConversations();
        return newConv;
      }
    } catch (e) {
      console.error('Failed to create AI conversation:', e);
    }
    return null;
  },

  renameConversation: async (id: number, name: string) => {
    try {
      await aiApi.renameConversation(id, { name });
      set((state) => ({
        conversations: state.conversations.map((c: AIConversation) =>
          c.id === id ? { ...c, name } : c
        ),
      }));
    } catch (e) {
      console.error('Failed to rename AI conversation:', e);
    }
  },

  deleteConversation: async (id: number) => {
    try {
      await aiApi.deleteConversation(id);
      set((state) => {
        const newConvs = state.conversations.filter((c: AIConversation) => c.id !== id);
        const newCurrentId = state.currentConversationId === id
          ? (newConvs.length > 0 ? newConvs[0].id : null)
          : state.currentConversationId;
        return {
          conversations: newConvs,
          currentConversationId: newCurrentId,
          messages: state.currentConversationId === id ? [] : state.messages,
        };
      });
    } catch (e) {
      console.error('Failed to delete AI conversation:', e);
    }
  },

  selectConversation: async (id: number) => {
    try {
      const res = await aiApi.getMessages(id);
      set({
        currentConversationId: id,
        messages: Array.isArray(res?.data) ? res.data : [],
      });

      const conv = get().conversations.find((c: AIConversation) => c.id === id);
      if (conv?.chatType === 'interview_review' && conv?.interviewSessionId) {
        set({ currentScore: null, currentFeedback: '', averageScore: 0 });
        try {
          const detail = await interviewApi.getDetail(conv.interviewSessionId);
          if (detail?.data) {
            set({ averageScore: detail.data.averageScore || 0 });
          }
        } catch {
          // ignore
        }
      } else {
        set({ currentScore: null, currentFeedback: '', averageScore: 0 });
      }
    } catch (e) {
      console.error('Failed to load AI messages:', e);
    }
  },

  sendMessage: async (content: string) => {
    const { currentConversationId, messages } = get();
    if (!currentConversationId) return;

    const conv = get().conversations.find((c: AIConversation) => c.id === currentConversationId);
    const isInterview = conv?.chatType === 'interview_review';

    set({ isStreaming: true });

    const tempUserMsg: AIMessage = {
      id: Date.now(),
      groupId: currentConversationId,
      senderId: -1,
      senderType: 'student',
      senderName: '我',
      content,
      createdAt: Math.floor(Date.now() / 1000),
    };
    set({ messages: [...messages, tempUserMsg] });

    const tempAiMsg: AIMessage = {
      id: Date.now() + 1,
      groupId: currentConversationId,
      senderId: 0,
      senderType: 'assistant',
      senderName: isInterview ? '面试官' : '职途助手',
      content: '',
      createdAt: Math.floor(Date.now() / 1000),
    };
    set((state) => ({ messages: [...state.messages, tempAiMsg] }));

    await aiApi.sendMessageStream(
      currentConversationId,
      content,
      (event) => {
        const { type, data } = event;
        if (type === 'chunk') {
          const parsed = data as { content: string };
          set((state) => {
            const newMessages = [...state.messages];
            const lastMsg = newMessages[newMessages.length - 1];
            if (lastMsg && lastMsg.senderType === 'assistant') {
              newMessages[newMessages.length - 1] = {
                ...lastMsg,
                content: lastMsg.content + parsed.content,
              };
            }
            return { messages: newMessages };
          });
        } else if (type === 'user_message') {
          const parsed = data as AIMessage;
          set((state) => ({
            messages: state.messages.map((m: AIMessage) =>
              m.id === tempUserMsg.id ? { ...parsed } : m
            ),
          }));
        } else if (type === 'ai_message') {
          const parsed = data as AIMessage;
          set((state) => ({
            messages: state.messages.map((m: AIMessage) =>
              m.id === tempAiMsg.id ? { ...parsed } : m
            ),
          }));
        } else if (type === 'question') {
          const parsed = data as { content: string };
          set((state) => {
            const newMessages = [...state.messages];
            const lastMsg = newMessages[newMessages.length - 1];
            if (lastMsg && lastMsg.senderType === 'assistant') {
              newMessages[newMessages.length - 1] = {
                ...lastMsg,
                content: parsed.content,
              };
            }
            return { messages: newMessages };
          });
        } else if (type === 'score') {
          const parsed = data as { value: number };
          set({ currentScore: parsed.value });
        } else if (type === 'feedback') {
          const parsed = data as { content: string };
          set({ currentFeedback: parsed.content });
        } else if (type === 'session_update') {
          const parsed = data as { averageScore: number };
          set({ averageScore: parsed.averageScore });
        } else if (type === 'done') {
          const parsed = data as { message?: string; sessionEnd?: boolean };
          if (parsed?.sessionEnd || parsed?.message === '面试结束') {
            const convId = get().currentConversationId;
            const currentConv = get().conversations.find((c: AIConversation) => c.id === convId);
            if (currentConv?.interviewSessionId) {
              set((state) => ({
                conversations: state.conversations.map((c: AIConversation) =>
                  c.id === convId ? { ...c, interviewStatus: 'completed' as const } : c
                ),
              }));
            }
          }
          set({ isStreaming: false });
          get().loadConversations();
        } else if (type === 'error') {
          set({ isStreaming: false });
        }
      },
      (error) => {
        console.error('AI message stream error:', error);
        set({ isStreaming: false });
      }
    );
  },

  setMode: (mode: 'normal' | 'interview') => set({ mode }),

  clearCurrentConversation: () => set({ currentConversationId: null, messages: [], currentScore: null, currentFeedback: '', averageScore: 0 }),

  endInterview: async (sessionId: number) => {
    try {
      await interviewApi.end(sessionId, 'user_completed');
      const convId = get().currentConversationId;
      if (convId) {
        set((state) => ({
          conversations: state.conversations.map((c: AIConversation) =>
            c.id === convId ? { ...c, interviewStatus: 'completed' as const } : c
          ),
        }));
      }
    } catch (e) {
      console.error('Failed to end interview:', e);
    }
  },
}));