export interface SkillDetail {
  skillName: string
  proficiency: string | null
  knowledgePoints: string[]
}

export interface InternshipDetail {
  company: string
  position: string
  duration: string
  description: string
}

export interface ProjectDetail {
  name: string
  role: string
  techStack: string[]
  description: string
}

// ── 7 维层级评分结构 ──────────────────────────────────────

export interface SubDimensionScore {
  score: number
  weight: number
}

export interface DimensionScore {
  score: number
  weight: number
  explanation: string
  sub_dimensions: Record<string, SubDimensionScore>
}

/** scoreDetail 的顶层结构（与后端 Map<String, Object> 对应） */
export interface ScoreDetail {
  technical?: DimensionScore
  project?: DimensionScore
  internship?: DimensionScore
  education?: DimensionScore
  achievement?: DimensionScore
  soft_skill?: DimensionScore
  professionalism?: DimensionScore
  [key: string]: DimensionScore | undefined
}

export interface StudentProfile {
  id: string
  userId: string
  education: string
  major: string
  university: string | null
  certificates: string[]
  skills: SkillDetail[]
  internships: InternshipDetail[]
  projects: ProjectDetail[]
  scoreDetail: ScoreDetail | null
  completenessScore: number
  competitivenessScore: number
  summary: string
  preferredCity: string | null
  preferredSalary: string | null
  preferredDirection: string | null
  careerGoal: string | null
  createdAt: string
  updatedAt: string
}

export interface ResumeParseResult {
  education: string
  major: string
  certificates: string[]
  name: string | null
  phone: string | null
  email: string | null
  university: string | null
  skills: SkillDetail[]
  internships: InternshipDetail[]
  projects: ProjectDetail[]
  awards: string[]
}
