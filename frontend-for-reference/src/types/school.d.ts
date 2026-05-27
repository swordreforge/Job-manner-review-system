export interface School {
  id: string
  name: string
  inviteCode?: string // 学生查看时不含邀请码
  description?: string
  createdAt: string
  updatedAt: string
}

export interface SchoolStudentListItem {
  userId: string
  username: string
  university?: string
  major?: string
  completenessScore?: number
  competitivenessScore?: number
  hasProfile: boolean
  createdAt: string
  // P2 活跃度字段
  conversationCount: number
  matchCount: number
  reportCount: number
  lastActiveAt?: string
  activityStatus?: 'active' | 'normal' | 'silent' | 'new'
}

export interface SchoolStatistics {
  totalStudents: number
  studentsWithProfile: number
  profileRate: number
  studentsWithMatch: number
  studentsWithReport: number
  avgCompetitivenessScore: number
  scoreDistribution: Record<string, number>
  radarAvg: Record<string, number>
  majorStats: Array<{ major: string; studentCount: number; avgScore: number }>
}

export interface SchoolAlert {
  userId: string
  username: string
  alertType: 'NO_PROFILE' | 'LOW_SCORE' | 'LOW_COMPLETENESS' | 'NO_MATCH'
  alertMessage: string
  severity: 'high' | 'medium' | 'low'
}

export interface StudentCompareItem {
  userId: string
  username: string
  major?: string
  competitivenessScore?: number
  completenessScore?: number
  scoreDetail?: Record<string, { score: number; weight: number; explanation: string }>
  matchCount: number
  reportCount: number
}

export interface StudentCompareResult {
  students: StudentCompareItem[]
}

export interface SchoolStudentDetail {
  userId: string
  username: string
  userCreatedAt: string
  profile?: StudentProfileSummary
  matchResults: MatchSummary[]
  reports: ReportSummary[]
}

export interface StudentProfileSummary {
  id: string
  userId: string
  education?: string
  major?: string
  university?: string
  certificates?: string[]
  skills?: Array<Record<string, unknown>>
  scoreDetail?: import('./student').ScoreDetail | null
  completenessScore?: number
  competitivenessScore?: number
  preferredCity?: string
  preferredSalary?: string
  preferredDirection?: string
  careerGoal?: string
  createdAt: string
  updatedAt: string
}

export interface MatchSummary {
  id: string
  jobProfileId: string
  overallScore?: number
  createdAt: string
}

export interface ReportSummary {
  id: string
  title: string
  status: string
  version: number
  createdAt: string
  updatedAt: string
}

export interface BatchImportResult {
  total: number
  created: number
  skipped: number
  generatedPasswords?: Array<{
    username: string
    password: string
  }>
}
