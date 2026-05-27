export interface SkillItem {
  skillName: string
  knowledgePoints: string[]
  proficiencyLevel: string
}

export interface SalaryRange {
  min: number
  max: number
}

export interface JobProfile {
  id: string
  profileName: string
  category: string
  description: string
  educationRequirement: string
  majorRequirement: string[]
  requiredSkills: SkillItem[]
  requiredCertificates: string[]
  innovationAbility: string
  learningAbility: string
  stressTolerance: string
  communicationSkill: string
  internshipRequirement: string
  salaryRangeMin: number
  salaryRangeMax: number
  careerProspects: string
  createdAt: string
}

export interface GraphNode {
  id: string
  label: string
  category: string
  level?: number
  skillsSummary: string[]
  education?: string
  salaryMin?: number
  salaryMax?: number
  description?: string
}

export interface GraphEdge {
  source: string
  target: string
  edgeType: 'PROMOTION' | 'TRANSFER'
  weight: number
  description: string
  conditions?: string
  gapSkills?: string[]
  difficulty?: string
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
  warnings?: string[]
}
