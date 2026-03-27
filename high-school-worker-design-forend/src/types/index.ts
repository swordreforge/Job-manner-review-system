export interface ApiResponse<T = unknown> {
  code: number;
  msg: string;
  data: T;
}

export interface PageResponse<T> {
  total: number;
  list: T[];
}

export interface User {
  id: number;
  username: string;
  email: string;
  phone?: string;
  role: string;
  createdAt: number;
}

export interface LoginResponse {
  token: string;
  expires: number;
  userId: number;
}

export interface StudentSkill {
  name: string;
  level: number;
  years: number;
}

export interface StudentCert {
  name: string;
  level: string;
  year: number;
}

export interface Student {
  id: number;
  name?: string;
  education?: string;
  major?: string;
  graduationYear?: number;
  skills?: StudentSkill[];
  certificates?: StudentCert[];
  softSkills?: Record<string, unknown>;
  internship?: Internship[];
  projects?: Project[];
  resumeContent?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface Internship {
  company: string;
  position: string;
  duration: number;
  description?: string;
}

export interface Project {
  name: string;
  role: string;
  description: string;
  technologies?: string[];
}

export interface Job {
  id: number;
  name?: string;
  description?: string;
  company?: string;
  industry?: string;
  location?: string;
  salaryRange?: string;
  skills?: string[];
  certificates?: string[];
  softSkills?: Record<string, unknown>;
  requirements?: Record<string, unknown>;
  createdAt?: number;
}

export interface MatchResult {
  jobId: number;
  jobName: string;
  overallScore: number;
  skillsMatch: number;
  certsMatch: number;
  softSkillsMatch: number;
  experienceMatch: number;
  gapAnalysis: GapItem[];
}

export interface GapItem {
  type: string;
  description: string;
  suggestions: string[];
}

export interface Report {
  id: number;
  studentId: number;
  title?: string;
  content?: string;
  status: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface PromotionPath {
  jobId: number;
  jobName: string;
  nextJobs: NextJob[];
}

export interface NextJob {
  id: number;
  name: string;
  requiredSkills: string[];
  experienceYears: number;
}

export interface TransferPath {
  fromJob: Job;
  toJob: Job;
  matchScore: number;
  transferSkills: string[];
  learningPath: LearningItem[];
}

export interface LearningItem {
  skill: string;
  resource: string;
  estimatedTime: string;
}

export interface ResumeUploadRequest {
  fileContent: string;
  fileName: string;
}

export interface GenerateReportRequest {
  studentId: number;
  targetJobId?: number;
  options?: {
    includeGapAnalysis?: boolean;
    includeActionPlan?: boolean;
    detailedLevel?: number;
  };
}

export interface ExportReportRequest {
  reportId: number;
  format: 'pdf' | 'docx' | 'json';
}

export interface PolishReportRequest {
  reportId: number;
  level: 'light' | 'normal' | 'thorough';
}

export interface SSEMessage {
  type: 'text' | 'json' | 'error';
  content?: string;
  data?: unknown;
}

export interface HealthResponse {
  status: string;
  version: string;
}