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
  completeness?: number;
  competitiveness?: number;
  suggestions?: string[];
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

export interface ResumeHistoryRecord {
  id: number;
  studentId?: number;
  resumeFileName: string;
  resumeContent: string;
  parsedProfile?: Student;
  suggestions?: string[];
  completenessScore: number;
  competitivenessScore: number;
  createdAt: number;
}

// 霍兰德职业倾向测试相关类型
export interface HollandQuestion {
  id: number;
  question: string;
  options: HollandOption[];
}

export interface HollandOption {
  text: string;
  type: 'R' | 'I' | 'A' | 'S' | 'E' | 'C';
}

export interface HollandAnswer {
  questionId: number;
  selectedType: 'R' | 'I' | 'A' | 'S' | 'E' | 'C';
}

export interface HollandTestInfo {
  testInfo: HollandTestMeta;
  questions: HollandQuestion[];
  careerTypes: Record<string, HollandCareerType>;
}

export interface HollandTestMeta {
  name: string;
  description: string;
  version: string;
  totalQuestions: number;
  estimatedTime: string;
}

export interface HollandCareerType {
  name: string;
  description: string;
  traits: string[];
  suitableJobs: string[];
  color: string;
}

export interface HollandResult {
  testId: number;
  studentId: number;
  careerCode: string;
  scores: Record<string, number>;
  topTypes: HollandTypeInfo[];
  suitableJobs: string[];
  description: string;
  createdAt: number;
}

export interface HollandTypeInfo {
  type: string;
  name: string;
  score: number;
  description: string;
  color: string;
}

export interface HollandHistoryData {
  total: number;
  list: HollandResult[];
}

// 面试模块相关类型
export interface InterviewSession {
  id: number;
  userId: number;
  studentId?: number;
  mode: 'practice' | 'assessment';
  status: 'running' | 'completed' | 'cancelled';
  totalQuestions: number;
  currentQuestion: number;
  averageScore: number;
  createdAt: number;
  firstQuestion: string;
}

export interface InterviewHistoryResult {
  total: number;
  list: InterviewHistoryItem[];
}

export interface InterviewHistoryItem {
  id: number;
  userId: number;
  studentId?: number;
  mode: 'practice' | 'assessment';
  status: 'running' | 'completed' | 'cancelled';
  averageScore: number;
  totalQuestions: number;
  currentQuestion: number;
  durationSeconds: number;
  createdAt: number;
  completedAt?: number;
}

export interface InterviewDetail {
  id: number;
  userId: number;
  studentId?: number;
  mode: 'practice' | 'assessment';
  status: 'running' | 'completed' | 'cancelled';
  totalQuestions: number;
  currentQuestion: number;
  averageScore: number;
  maxScore: number;
  minScore: number;
  durationSeconds: number;
  createdAt: number;
  completedAt?: number;
  messages: InterviewMessage[];
}

export interface InterviewMessage {
  id: number;
  sessionId: number;
  role: 'user' | 'assistant';
  content: string;
  questionType?: string;
  score?: number;
  feedback?: string;
  createdAt: number;
}

export interface InterviewReport {
  id: number;
  sessionId: number;
  userId: number;
  overallScore: number;
  skillScore: number;
  communicationScore: number;
  logicScore: number;
  confidenceScore: number;
  strengths: string[];
  weaknesses: string[];
  improvementSuggestions: string[];
  summary: string;
  createdAt: number;
}

export interface EndInterviewData {
  id: number;
  status: 'completed' | 'cancelled';
  averageScore: number;
  durationSeconds: number;
  completedAt: number;
}

export interface InterviewStreamEvent {
  event: 'question' | 'score' | 'feedback' | 'session_update' | 'done' | 'error';
  data: {
    content?: string;
    value?: number;
    sessionId?: number;
    currentQuestion?: number;
    averageScore?: number;
    message?: string;
    reportId?: number;
    code?: number;
    msg?: string;
  };
}