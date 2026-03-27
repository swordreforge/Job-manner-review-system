import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 30000,
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
    api.post<{ id: number; username: string; email: string; phone: string; role: string; createdAt: number }>('/user/register', data),

  login: (data: { username: string; password: string }) =>
    api.post<{ token: string; expires: number; userId: number }>('/user/login', data),

  getInfo: () => api.get<{ code: number; msg: string; data: import('../types').User }>('/user/info'),

  updateInfo: (data: { email?: string; phone?: string }) =>
    api.put<{ code: number; msg: string; data: import('../types').User }>('/user/info', data),
};

export const studentApi = {
  create: (data: Partial<import('../types').Student>) => api.post<import('../types').Student>('/students', data),
  update: (data: import('../types').Student) => api.put<import('../types').Student>('/students', data),
  get: (id: number) => api.get<import('../types').Student>(`/students/${id}`),
  delete: (id: number) => api.delete<void>(`/students/${id}`),
  list: (params?: { page?: number; pageSize?: number; major?: string; education?: string }) => 
    api.get<import('../types').PageResponse<import('../types').Student>>('/students', { params }),
  getMe: () => api.get<import('../types').Student>('/students/me'),
  uploadResume: (data: { fileContent: string; fileName: string }) => 
    api.post<import('../types').Student>('/students/resume', data),
  generate: (data: { resumeContent: string }) => 
    api.post<import('../types').Student>('/students/generate', data),
};

export const jobApi = {
  create: (data: Partial<import('../types').Job>) => api.post<import('../types').Job>('/jobs', data),
  update: (data: import('../types').Job) => api.put<import('../types').Job>('/jobs', data),
  get: (id: number) => api.get<import('../types').Job>(`/jobs/${id}`),
  delete: (id: number) => api.delete<void>(`/jobs/${id}`),
  list: (params?: { page?: number; pageSize?: number; industry?: string; name?: string }) => 
    api.get<import('../types').PageResponse<import('../types').Job>>('/jobs', { params }),
  generate: (data: { positionName: string; industry?: string; rawData?: string }) => 
    api.post<import('../types').Job>('/jobs/generate', data),
};

export const matchApi = {
  matchSingle: (data: { studentId: number; jobId: number }) => 
    api.post<import('../types').MatchResult>('/match', data),
  matchJobs: (data: { studentId: number; page?: number; pageSize?: number; minScore?: number; industry?: string }) => 
    api.post<import('../types').PageResponse<import('../types').MatchResult>>('/match/jobs', data),
  getScore: (studentId: number, jobId: number) => 
    api.get<import('../types').MatchResult>(`/match/${studentId}/${jobId}/score`),
  recommend: (studentId: number, params?: { page?: number; pageSize?: number; industry?: string }) => 
    api.get<import('../types').PageResponse<import('../types').Job>>(`/match/${studentId}/recommend`, { params }),
};

export const reportApi = {
  generate: (data: { studentId: number; targetJobId?: number; options?: { includeGapAnalysis?: boolean; includeActionPlan?: boolean; detailedLevel?: number } }) => 
    api.post<import('../types').Report>('/reports/generate', data),
  generateStream: (data: { studentId: number; targetJobId?: number; options?: { includeGapAnalysis?: boolean; includeActionPlan?: boolean; detailedLevel?: number } }) => 
    `/reports/generate-stream`,
  get: (id: number) => api.get<import('../types').Report>(`/reports/${id}`),
  update: (data: { id: number; title?: string; content?: string; status?: string }) => 
    api.put<import('../types').Report>('/reports', data),
  delete: (id: number) => api.delete<void>(`/reports/${id}`),
  list: (params?: { page?: number; pageSize?: number; studentId?: number; status?: string }) => 
    api.get<import('../types').PageResponse<import('../types').Report>>('/reports', { params }),
  export: (data: { reportId: number; format: 'pdf' | 'docx' | 'json' }) => 
    api.post<{ url: string }>('/reports/export', data),
  polish: (data: { reportId: number; level: 'light' | 'normal' | 'thorough' }) => 
    api.post<import('../types').Report>('/reports/polish', data),
  getCompleteness: (id: number) => api.get<{ score: number; missingFields: string[] }>(`/reports/${id}/completeness`),
  getMe: () => api.get<import('../types').PageResponse<import('../types').Report>>('/reports/me'),
};

export const healthApi = {
  check: () => api.get<{ status: string; version: string }>('/health'),
};

export const jobPathApi = {
  getPromotionPath: (jobId: number) => 
    api.get<import('../types').PromotionPath>(`/jobs/${jobId}/promotion-path`),
  getTransferPaths: (jobId: number) => 
    api.get<import('../types').TransferPath[]>(`/jobs/${jobId}/transfer-paths`),
  getAllPaths: (jobId: number) => 
    api.get<{ promotion: import('../types').PromotionPath; transfer: import('../types').TransferPath[] }>(`/jobs/${jobId}/all-paths`),
  getRelated: (jobId: number, params?: { type?: string }) => 
    api.get<import('../types').Job[]>(`/jobs/${jobId}/related`, { params }),
};

export default api;