import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 120000, // 增加到 2 分钟，支持简历上传等长时间操作
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // 动态导入store避免循环依赖
          import('../stores').then(({ useAuthStore }) => {
            useAuthStore.getState().clearAuth();
            useAuthStore.getState().setAuthChecked(true);
          });
          localStorage.removeItem('token');
          window.location.href = '/auth';
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig) {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig) {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

export const api = new ApiClient();

export const userApi = {
  register: (data: { username: string; password: string; email: string; phone?: string }) =>
    api.post<{ code: number; msg: string; data: import('../types').User }>('/user/register', data),

  login: (data: { username: string; password: string }) =>
    api.post<{ token: string; expires: number; userId: number }>('/user/login', data),

  getInfo: () => api.get<{ code: number; msg: string; data: import('../types').User }>('/user/info'),

  updateInfo: (data: { username?: string; phone?: string }) =>
    api.put<{ code: number; msg: string; data: import('../types').User }>('/user/info', data),

uploadAvatar: (data: { fileContent: string; fileName: string }) =>
    api.post<{ code: number; msg: string; url: string }>('/user/avatar', data),

  resetAvatar: () =>
    api.delete<{ code: number; msg: string }>('/user/avatar'),

  updatePassword: (data: { oldPassword: string; newPassword: string }) =>
    api.put<{ code: number; msg: string }>('/user/password', data),

  completeOnboarding: () =>
    api.post<{ code: number; msg: string }>('/user/complete-onboarding'),

  deleteAccount: (data: { password: string }) =>
    api.delete<{ code: number; msg: string }>('/user/account', { data }),
};

export const studentApi = {
  create: (data: Partial<import('../types').Student>) =>
    api.post<{ code: number; msg: string; data: import('../types').Student }>('/students', data),
  update: (data: import('../types').Student) =>
    api.put<{ code: number; msg: string; data: import('../types').Student }>('/students', data),
  get: (id: number) =>
    api.get<{ code: number; msg: string; data: import('../types').Student }>(`/students/${id}`),
  delete: (id: number) => api.delete<void>(`/students/${id}`),
  list: (params?: { page?: number; pageSize?: number; major?: string; education?: string }) =>
    api.get<{ code: number; msg: string; data: import('../types').PageResponse<import('../types').Student> }>('/students', { params }),
  getMe: () =>
    api.get<{ code: number; msg: string; data: import('../types').Student }>('/students/me'),
  uploadResume: (data: { fileContent: string; fileName: string }) =>
    api.post<{ code: number; msg: string; data: import('../types').Student }>('/students/resume', data, { timeout: 120000 }),
  generate: (data: { resumeContent: string }) =>
    api.post<{ code: number; msg: string; data: import('../types').Student }>('/students/generate', data, { timeout: 120000 }),
  getResumeHistory: (params?: { page?: number; pageSize?: number }) =>
    api.get<{ code: number; msg: string; data: import('../types').PageResponse<import('../types').ResumeHistoryRecord> }>('/students/resume/history', { params }),
  getResumeHistoryDetail: (id: number) =>
    api.get<{ code: number; msg: string; data: import('../types').ResumeHistoryRecord }>(`/students/resume/history/${id}`),
  deleteResumeHistory: (id: number) =>
    api.delete<{ code: number; msg: string }>(`/students/resume/history/${id}`),
  polishResume: (data: { studentId: number; historyId?: number }) =>
    api.post<{ code: number; msg: string; htmlContent?: string; plainText?: string }>('/students/resume/polish', data, { timeout: 120000 }),
  joinSchool: (data: { inviteCode: string; name: string }) =>
    api.post<{ code: number; msg: string; data: { schoolId: number; schoolName: string; joinedAt: number } }>('/students/join-school', data),
  getSchools: () =>
    api.get<{ code: number; msg: string; data: { total: number; list: { schoolId: number; schoolName: string; status: string; joinedAt: number }[] } }>('/students/schools'),
};

export const jobApi = {
  create: (data: Partial<import('../types').Job>) =>
    api.post<{ code: number; msg: string; data: import('../types').Job }>('/jobs', data),
  update: (data: import('../types').Job) =>
    api.put<{ code: number; msg: string; data: import('../types').Job }>('/jobs', data),
  get: (id: number) =>
    api.get<{ code: number; msg: string; data: import('../types').Job }>(`/jobs/${id}`),
  delete: (id: number) => api.delete<void>(`/jobs/${id}`),
  list: (params?: { page?: number; pageSize?: number; industry?: string; name?: string; keyword?: string; location?: string; companyScale?: string; salaryMin?: number; salaryMax?: number; category?: string }) =>
    api.get<{ code: number; msg: string; data: import('../types').PageResponse<import('../types').Job> }>('/jobs', { params }),
  generate: (data: { positionName: string; industry?: string; rawData?: string }) =>
    api.post<{ code: number; msg: string; data: import('../types').Job }>('/jobs/generate', data, { timeout: 120000 }),
};

export const matchApi = {
  matchSingle: (data: { studentId: number; jobId: number }) =>
    api.post<{ code: number; msg: string; data: import('../types').MatchResult }>('/match', data),
  matchJobs: (data: { studentId: number; page?: number; pageSize?: number; minScore?: number; industry?: string }) =>
    api.post<{ code: number; msg: string; total: number; list: import('../types').MatchResult[] }>('/match/jobs', data),
  getScore: (studentId: number, jobId: number) =>
    api.get<{ code: number; msg: string; data: import('../types').MatchResult }>(`/match/${studentId}/${jobId}/score`),
  recommend: (studentId: number, params?: { page?: number; pageSize?: number; industry?: string }) =>
    api.get<{ code: number; msg: string; data: import('../types').PageResponse<import('../types').Job> }>(`/match/${studentId}/recommend`, { params }),
};

export const reportApi = {
  generate: (data: { studentId: number; targetJobId?: number; options?: { includeGapAnalysis?: boolean; includeActionPlan?: boolean; detailedLevel?: number } }) =>
    api.post<{ code: number; msg: string; data: import('../types').Report }>('/reports/generate', data, { timeout: 120000 }),
  generateStream: (data: { studentId: number; track?: string; targetJobId?: number }) => {
    const params = new URLSearchParams({
      studentId: String(data.studentId),
    });
    if (data.track) params.append('track', data.track);
    if (data.targetJobId) params.append('targetJobId', String(data.targetJobId));
    const token = localStorage.getItem('token');
    const authParam = token ? `&token=${encodeURIComponent(token)}` : '';
    return `${BASE_URL}/reports/generate-stream?${params.toString()}${authParam}`;
  },
  get: (id: number) =>
    api.get<{ code: number; msg: string; data: import('../types').Report }>(`/reports/${id}`),
  update: (data: { id: number; title?: string; content?: string; status?: string }) =>
    api.put<{ code: number; msg: string; data: import('../types').Report }>('/reports', data),
  delete: (id: number) => api.delete<void>(`/reports/${id}`),
  list: (params?: { page?: number; pageSize?: number; studentId?: number; status?: string }) =>
    api.get<{ code: number; msg: string; data: import('../types').PageResponse<import('../types').Report> }>('/reports', { params }),
  export: (data: { reportId: number; format: 'pdf' | 'docx' | 'json' }) =>
    api.post<{ code: number; msg: string; url: string }>('/reports/export', data),
  polish: (data: { reportId: number; level: 'light' | 'normal' | 'thorough' }) =>
    api.post<{ code: number; msg: string; data: import('../types').Report }>('/reports/polish', data),
  getCompleteness: (id: number) =>
    api.get<{ code: number; msg: string; data: { score: number; missingFields: string[] } }>(`/reports/${id}/completeness`),
  getMe: () =>
    api.get<{ code: number; msg: string; data: import('../types').PageResponse<import('../types').Report> }>('/reports/me'),
};

export const healthApi = {
  check: () => api.get<{ status: string; version: string }>('/health'),
};

export const jobPathApi = {
  getPromotionPath: (jobId: number) => 
    api.get<{ code: number; msg: string; data: import('../types').PromotionPath }>(`/jobs/${jobId}/promotion-path`),
  getTransferPaths: (jobId: number) => 
    api.get<{ code: number; msg: string; data: import('../types').TransferPath[] }>(`/jobs/${jobId}/transfer-paths`),
  getAllPaths: (jobId: number) => 
    api.get<{ code: number; msg: string; data: { promotion: import('../types').PromotionPath; transfer: import('../types').TransferPath[] } }>(`/jobs/${jobId}/all-paths`),
  getRelated: (jobId: number, params?: { type?: string }) => 
    api.get<{ code: number; msg: string; data: import('../types').Job[] }>(`/jobs/${jobId}/related`, { params }),
  generatePathAnalysis: (jobId: number, data: { toJobId?: number; studentId?: number; pathType: string }) =>
    api.post<{ code: number; msg: string }>(`/jobs/${jobId}/path-analysis`, data),
};

export const chatApi = {
  listGroups: () =>
    api.get<{ code: number; msg: string; data: import('../types').ChatGroup[] }>('/chat/groups'),

  createGroup: (data: { schoolId?: number; peerUserId: number; peerUserType: 'teacher' | 'student'; peerUserName?: string; name?: string }) =>
    api.post<{ code: number; msg: string; data: import('../types').ChatGroup }>('/chat/groups', data),

  getMessages: (groupId: number) =>
    api.get<{ code: number; msg: string; data: import('../types').ChatMessage[] }>(`/chat/groups/${groupId}/messages`),

  sendMessage: (groupId: number, content: string) =>
    api.post<{ code: number; msg: string; data: import('../types').ChatMessage }>(`/chat/groups/${groupId}/messages`, { content }),

  getMembers: (groupId: number) =>
    api.get<{ code: number; msg: string; data: import('../types').ChatGroupMember[] }>(`/chat/groups/${groupId}/members`),

  markRead: (groupId: number) =>
    api.put<{ code: number; msg: string; data: { groupId: number; readAt: number } }>(`/chat/groups/${groupId}/read`),

  streamUrl: (groupId: number) => `${BASE_URL}/chat/groups/${groupId}/stream`,
};

export const hollandApi = {
  getQuestions: () =>
    api.get<{ code: number; msg: string; data: import('../types').HollandTestInfo }>('/holland/questions'),
  submitTest: (answers: import('../types').HollandAnswer[]) =>
    api.post<{ code: number; msg: string; data: import('../types').HollandResult }>('/holland/submit', { answers }),
  getResult: (testId: number) =>
    api.get<{ code: number; msg: string; data: import('../types').HollandResult }>(`/holland/result/${testId}`),
  getHistory: (params?: { page?: number; pageSize?: number }) =>
    api.get<{ code: number; msg: string; data: import('../types').HollandHistoryData }>('/holland/history', { params }),
};

export const interviewApi = {
  start: (data: { mode: 'practice' | 'assessment'; studentId?: number }) =>
    api.post<{ code: number; msg: string; data: import('../types').InterviewSession }>('/interview/start', data),
  
  chatStream: async (data: { sessionId: number; message: string }, onEvent: (event: { type: string; data: any }) => void, onError: (error: Error) => void) => {
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`${BASE_URL}/interview/chat-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Response body is null');
      }

      let buffer = '';
      let currentEventType = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        
        // 处理SSE事件
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine === '') continue;

          // 处理event行，记录事件类型
          if (trimmedLine.startsWith('event: ')) {
            currentEventType = trimmedLine.substring(7);
            continue;
          }

          // 处理data行，发送事件
          if (trimmedLine.startsWith('data: ')) {
            const data = trimmedLine.substring(6);
            try {
              const parsedData = JSON.parse(data);
              onEvent({ type: currentEventType || 'data', data: parsedData });
              currentEventType = ''; // 重置事件类型
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      onError(error as Error);
    }
  },
  
  getHistory: (params?: { page?: number; pageSize?: number; status?: string; mode?: string }) =>
    api.get<{ code: number; msg: string; data: import('../types').InterviewHistoryResult }>('/interview/history', { params }),
  
  getDetail: (id: number) =>
    api.get<{ code: number; msg: string; data: import('../types').InterviewDetail }>(`/interview/${id}`),
  
  getReport: (id: number) =>
    api.get<{ code: number; msg: string; data: import('../types').InterviewReport }>(`/interview/${id}/report`),
  
  end: (id: number, reason: 'user_completed' | 'timeout' | 'cancelled') =>
    api.post<{ code: number; msg: string; data: import('../types').EndInterviewData }>(`/interview/${id}/end`, { reason }),
  
  delete: (id: number) =>
    api.delete<{ code: number; msg: string }>(`/interview/${id}`),
};

export interface TeacherInviteCode {
  id: number;
  code: string;
  type: string;
  maxUses: number;
  usedCount: number;
  status: string;
  expiresAt: number;
  createdAt: number;
}

export interface TeacherStudent {
  id: number;
  userId: number;
  name: string;
  username: string;
  email: string;
  className?: string;
  grade?: string;
  taskCompletionRate: number;
  lastActivityAt?: number;
  joinedAt: number;
}

export interface TeacherTaskProgress {
  taskSeriesId: number;
  taskName: string;
  taskType: string;
  status: string;
  completionRate: number;
  score?: number;
  startedAt?: number;
  completedAt?: number;
}

export interface TeacherAlert {
  id: number;
  studentId: number;
  studentName: string;
  className?: string;
  alertType: string;
  alertLevel: string;
  description: string;
  completionRate: number;
  totalTasks: number;
  completedTasks: number;
  status: string;
  createdAt: number;
}

export interface TeacherMessage {
  id: number;
  studentId: number;
  studentName: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: number;
}

export const teacherApi = {
  register: (data: { username: string; password: string; email: string; name: string; schoolCode: string; employeeId?: string; department?: string }) =>
    api.post<{ code: number; msg: string; token?: string; userId?: number; schoolId?: number }>('/teachers/register', data),

  createInviteCode: (data: { type?: string; maxUses?: number; expiresIn?: number }) =>
    api.post<{ code: number; msg: string; data: TeacherInviteCode }>('/teachers/invite-codes', data),

  listInviteCodes: (params?: { page?: number; pageSize?: number; status?: string }) =>
    api.get<{ code: number; msg: string; data: { total: number; list: TeacherInviteCode[] } }>('/teachers/invite-codes', { params }),

  revokeInviteCode: (id: number) =>
    api.delete<{ code: number; msg: string }>(`/teachers/invite-codes/${id}`),

  deleteInviteCode: (id: number) =>
    api.delete<{ code: number; msg: string }>(`/teachers/invite-codes/delete/${id}`),

  listStudents: (params?: { page?: number; pageSize?: number; className?: string; grade?: string; status?: string }) =>
    api.get<{ code: number; msg: string; data: { total: number; list: TeacherStudent[] } }>('/teachers/students', { params }),

  getStudentDetail: (id: number) =>
    api.get<{ code: number; msg: string; data: TeacherStudent }>(`/teachers/students/${id}`),

  getStudentTasks: (id: number) =>
    api.get<{ code: number; msg: string; data: { studentId: number; totalTasks: number; completedTasks: number; overallRate: number; tasks: TeacherTaskProgress[] } }>(`/teachers/students/${id}/tasks`),

  listAlerts: (params?: { page?: number; pageSize?: number; alertType?: string; alertLevel?: string; status?: string }) =>
    api.get<{ code: number; msg: string; data: { total: number; list: TeacherAlert[] } }>('/teachers/alerts', { params }),

resolveAlert: (id: number) =>
    api.put<{ code: number; msg: string }>(`/teachers/alerts/${id}/resolve`),

  unresolveAlert: (id: number) =>
    api.put<{ code: number; msg: string }>(`/teachers/alerts/${id}/unresolve`),

  ignoreAlert: (id: number) =>
    api.put<{ code: number; msg: string }>(`/teachers/alerts/${id}/ignore`),

  checkAlert: (studentId: number) =>
    api.post<{ code: number; msg: string }>(`/teachers/students/${studentId}/check-alert`),

  listMessages: (params?: { page?: number; pageSize?: number }) =>
    api.get<{ code: number; msg: string; data: import('../types').PageResponse<import('../types').InboxMessage> }>('/teachers/messages', { params }),

  sendMessage: (data: { receiverId: number; title: string; content: string }) =>
    api.post<{ code: number; msg: string }>('/teachers/messages', data),

  deleteMessage: (id: number) =>
    api.delete<{ code: number; msg: string }>(`/teachers/messages/${id}`),
};

export const studentMessageApi = {
  listMessages: (params?: { page?: number; pageSize?: number }) =>
    api.get<{ code: number; msg: string; data: import('../types').PageResponse<import('../types').InboxMessage> }>('/students/messages', { params }),

  markAsRead: (id: number) =>
    api.put<{ code: number; msg: string }>(`/students/messages/${id}/read`),

  sendMessage: (data: { receiverId: number; title: string; content: string }) =>
    api.post<{ code: number; msg: string }>('/students/messages', data),

  listTeachers: () =>
    api.get<{ code: number; msg: string; data: { list: import('../types').TeacherInfo[] } }>('/students/teachers'),
};

export default api;