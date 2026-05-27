export interface ReportSection {
  title: string
  content: string
  subSections?: ReportSection[]
}

export interface Report {
  id: string
  userId: string
  matchResultId: string
  title: string
  content: string
  status: 'GENERATING' | 'COMPLETED' | 'FAILED'
  version: number
  createdAt: string
  updatedAt: string
}

export type VersionSource = 'GENERATED' | 'MANUAL_EDIT' | 'AI_POLISH'

export interface ReportVersionSummary {
  id: string
  version: number
  source: VersionSource
  createdAt: string
}

export interface ReportVersionDetail extends ReportVersionSummary {
  content: string
  reportId: string
}

export interface CompletenessIssue {
  chapter: string
  issue: string
  suggestion: string
}

export interface CompletenessResult {
  completeness_score: number
  is_complete: boolean
  overall_comment?: string
  issues: CompletenessIssue[]
}

export interface CareerReport {
  title: string
  generatedAt: string
  studentName: string | null
  targetJob: string
  sections: ReportSection[]
  summary: string
}
