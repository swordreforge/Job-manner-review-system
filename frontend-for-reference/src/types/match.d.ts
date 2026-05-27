export interface DimensionScore {
  score: number
  weight: number
  weightedScore: number
  analysis: string
  subScores?: Record<string, number>
}

export interface MatchDimensions {
  basicRequirement: DimensionScore
  professionalSkill: DimensionScore
  professionalQuality: DimensionScore
  developmentPotential: DimensionScore
}

export interface SkillComparisonItem {
  jobSkill: string
  jobKnowledgePoints: string[]
  studentMatchedPoints: string[]
  studentMissingPoints: string[]
  matchRate: number
  status: 'MATCH' | 'PARTIAL' | 'MISS'
}

export interface MatchResult {
  id: string
  userId: string
  jobProfileId: string
  overallScore: number
  dimensions: MatchDimensions
  skillComparison: SkillComparisonItem[]
  analysisText: string
  createdAt: string
}
