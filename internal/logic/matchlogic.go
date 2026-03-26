package logic

import (
	"context"
	"encoding/json"
	"math"

	"github.com/zeromicro/go-zero/core/logx"

	"career-api/common/errors"
	"career-api/internal/svc"
	"career-api/internal/types"
)

type MatchStudentJobLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewMatchStudentJobLogic(ctx context.Context, svcCtx *svc.ServiceContext) *MatchStudentJobLogic {
	return &MatchStudentJobLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *MatchStudentJobLogic) MatchStudentJob(req *types.MatchReq) (*types.MatchResultResp, error) {
	// 从数据库获取学生信息
	student, err := l.svcCtx.StudentModel.FindOne(l.ctx, req.StudentId)
	if err != nil {
		logx.Errorf("FindOne student failed: %v", err)
		return &types.MatchResultResp{
			Code: errors.CodeInternalError,
			Msg:  "student not found",
		}, nil
	}

	// 从数据库获取职位信息
	job, err := l.svcCtx.JobModel.FindOne(l.ctx, req.JobId)
	if err != nil {
		logx.Errorf("FindOne job failed: %v", err)
		return &types.MatchResultResp{
			Code: errors.CodeInternalError,
			Msg:  "job not found",
		}, nil
	}

	// 反序列化学生技能
	var studentSkills []types.StudentSkill
	if student.Skills.Valid {
		json.Unmarshal([]byte(student.Skills.String), &studentSkills)
	}

	// 反序列化职位技能
	var jobSkills []types.Skill
	if job.Skills.Valid {
		json.Unmarshal([]byte(job.Skills.String), &jobSkills)
	}

	// 计算技能匹配度
	skillsMatch := calculateSkillsMatch(studentSkills, jobSkills)

	// 计算证书匹配度
	var studentCerts []types.StudentCert
	if student.Certificates.Valid {
		json.Unmarshal([]byte(student.Certificates.String), &studentCerts)
	}
	var jobCerts []string
	if job.Certificates.Valid {
		json.Unmarshal([]byte(job.Certificates.String), &jobCerts)
	}
	certsMatch := calculateCertsMatch(studentCerts, jobCerts)

	// 计算软技能匹配度
	var studentSoftSkills types.SoftSkills
	if student.SoftSkills.Valid {
		json.Unmarshal([]byte(student.SoftSkills.String), &studentSoftSkills)
	}
	var jobSoftSkills types.SoftSkills
	if job.SoftSkills.Valid {
		json.Unmarshal([]byte(job.SoftSkills.String), &jobSoftSkills)
	}
	softSkillsMatch := calculateSoftSkillsMatch(studentSoftSkills, jobSoftSkills)

	// 计算经验匹配度（基于完整度和竞争力）
	experienceMatch := (student.CompletenessScore + student.CompetitivenessScore) / 2

	// 计算总体匹配度
	overallScore := (skillsMatch*0.35 + certsMatch*0.15 + softSkillsMatch*0.25 + experienceMatch*0.25)

	// 生成差距分析
	gapAnalysis := generateGapAnalysis(studentSkills, jobSkills)

	result := &types.MatchResult{
		JobId:           req.JobId,
		JobName:         job.Name,
		OverallScore:    math.Round(overallScore*100) / 100,
		SkillsMatch:     math.Round(skillsMatch*100) / 100,
		CertsMatch:      math.Round(certsMatch*100) / 100,
		SoftSkillsMatch: math.Round(softSkillsMatch*100) / 100,
		ExperienceMatch: math.Round(experienceMatch*100) / 100,
		GapAnalysis:     gapAnalysis,
	}

	return &types.MatchResultResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
		Data: result,
	}, nil
}

// calculateSkillsMatch 计算技能匹配度
func calculateSkillsMatch(studentSkills []types.StudentSkill, jobSkills []types.Skill) float64 {
	if len(jobSkills) == 0 {
		return 100.0
	}

	totalWeight := 0.0
	matchedWeight := 0.0

	studentSkillMap := make(map[string]float64)
	for _, skill := range studentSkills {
		studentSkillMap[skill.Name] = float64(skill.Level)
	}

	for _, jobSkill := range jobSkills {
		weight := 1.0
		if jobSkill.Required {
			weight = 1.5
		}
		totalWeight += weight

		if studentLevel, exists := studentSkillMap[jobSkill.Name]; exists {
			matchRatio := studentLevel / float64(jobSkill.Level)
			if matchRatio > 1.0 {
				matchRatio = 1.0
			}
			matchedWeight += weight * matchRatio
		}
	}

	if totalWeight == 0 {
		return 50.0
	}

	return (matchedWeight / totalWeight) * 100
}

// calculateCertsMatch 计算证书匹配度
func calculateCertsMatch(studentCerts []types.StudentCert, jobCerts []string) float64 {
	if len(jobCerts) == 0 {
		return 100.0
	}

	if len(studentCerts) == 0 {
		return 0.0
	}

	matchedCount := 0
	for _, jobCert := range jobCerts {
		for _, studentCert := range studentCerts {
			if studentCert.Name == jobCert {
				matchedCount++
				break
			}
		}
	}

	return float64(matchedCount) / float64(len(jobCerts)) * 100
}

// calculateSoftSkillsMatch 计算软技能匹配度
func calculateSoftSkillsMatch(studentSkills, jobSkills types.SoftSkills) float64 {
	// 计算各项软技能的平均匹配度
	innovationDiff := math.Abs(float64(studentSkills.Innovation - jobSkills.Innovation))
	learningDiff := math.Abs(float64(studentSkills.Learning - jobSkills.Learning))
	pressureDiff := math.Abs(float64(studentSkills.Pressure - jobSkills.Pressure))
	communicationDiff := math.Abs(float64(studentSkills.Communication - jobSkills.Communication))
	teamworkDiff := math.Abs(float64(studentSkills.Teamwork - jobSkills.Teamwork))

	totalDiff := innovationDiff + learningDiff + pressureDiff + communicationDiff + teamworkDiff
	avgDiff := totalDiff / 5.0

	// 差异越小，匹配度越高
	maxDiff := 5.0
	matchScore := (1.0 - avgDiff/maxDiff) * 100

	if matchScore < 0 {
		matchScore = 0
	}

	return matchScore
}

// generateGapAnalysis 生成差距分析
func generateGapAnalysis(studentSkills []types.StudentSkill, jobSkills []types.Skill) []types.Gap {
	gaps := []types.Gap{}

	studentSkillMap := make(map[string]float64)
	for _, skill := range studentSkills {
		studentSkillMap[skill.Name] = float64(skill.Level)
	}

	for _, jobSkill := range jobSkills {
		if !jobSkill.Required {
			continue
		}

		studentLevel, exists := studentSkillMap[jobSkill.Name]
		if !exists || studentLevel < float64(jobSkill.Level) {
			currentLevel := studentLevel
			if !exists {
				currentLevel = 0
			}

			gapPercent := (1.0 - currentLevel/float64(jobSkill.Level)) * 100
			if gapPercent < 0 {
				gapPercent = 0
			}

			suggestion := "Practice " + jobSkill.Name + " to improve your skills"
			if currentLevel == 0 {
				suggestion = "Start learning " + jobSkill.Name + " fundamentals"
			}

			gaps = append(gaps, types.Gap{
						Attribute:  jobSkill.Name,
						Required:   jobSkill.Level,
						Current:    int(currentLevel),
						GapPercent: gapPercent,
						Suggestion: suggestion,
					})		}
	}

	// 如果没有差距，返回空数组
	if len(gaps) == 0 {
		return []types.Gap{}
	}

	// 最多返回3个差距
	if len(gaps) > 3 {
		gaps = gaps[:3]
	}

	return gaps
}

type MatchStudentJobsLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewMatchStudentJobsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *MatchStudentJobsLogic {
	return &MatchStudentJobsLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *MatchStudentJobsLogic) MatchStudentJobs(req *types.MatchListReq) (*types.MatchListResp, error) {
	page := req.Page
	if page <= 0 {
		page = 1
	}
	pageSize := req.PageSize
	if pageSize <= 0 {
		pageSize = 10
	}

	// 从数据库获取学生信息
	student, err := l.svcCtx.StudentModel.FindOne(l.ctx, req.StudentId)
	if err != nil {
		logx.Errorf("FindOne student failed: %v", err)
		return &types.MatchListResp{
			Code: errors.CodeInternalError,
			Msg:  "student not found",
		}, nil
	}

	// 反序列化学生技能
	var studentSkills []types.StudentSkill
	if student.Skills.Valid {
		json.Unmarshal([]byte(student.Skills.String), &studentSkills)
	}

	// 反序列化学生证书
	var studentCerts []types.StudentCert
	if student.Certificates.Valid {
		json.Unmarshal([]byte(student.Certificates.String), &studentCerts)
	}

	// 反序列化学生软技能
	var studentSoftSkills types.SoftSkills
	if student.SoftSkills.Valid {
		json.Unmarshal([]byte(student.SoftSkills.String), &studentSoftSkills)
	}

	// 从数据库获取所有职位（使用分页）
	// 注意：这里需要使用JobsModel的FindAll方法
	// 如果JobsModel没有FindAll方法，需要先添加
	// 为了简化，我们假设JobsModel有FindAll方法
	allJobs, total, err := l.svcCtx.JobModel.FindAll(l.ctx, page, pageSize, "")
	if err != nil {
		logx.Errorf("FindAll jobs failed: %v", err)
		return &types.MatchListResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to get jobs",
		}, nil
	}

	// 计算每个职位的匹配度
	results := make([]types.MatchResult, 0, len(allJobs))
	for _, job := range allJobs {
		// 反序列化职位技能
		var jobSkills []types.Skill
		if job.Skills.Valid {
			json.Unmarshal([]byte(job.Skills.String), &jobSkills)
		}

		// 反序列化职位证书
		var jobCerts []string
		if job.Certificates.Valid {
			json.Unmarshal([]byte(job.Certificates.String), &jobCerts)
		}

		// 反序列化职位软技能
		var jobSoftSkills types.SoftSkills
		if job.SoftSkills.Valid {
			json.Unmarshal([]byte(job.SoftSkills.String), &jobSoftSkills)
		}

		// 计算各项匹配度
		skillsMatch := calculateSkillsMatch(studentSkills, jobSkills)
		certsMatch := calculateCertsMatch(studentCerts, jobCerts)
		softSkillsMatch := calculateSoftSkillsMatch(studentSoftSkills, jobSoftSkills)
		experienceMatch := (student.CompletenessScore + student.CompetitivenessScore) / 2

		// 计算总体匹配度
		overallScore := (skillsMatch*0.35 + certsMatch*0.15 + softSkillsMatch*0.25 + experienceMatch*0.25)

		// 生成差距分析
		gapAnalysis := generateGapAnalysis(studentSkills, jobSkills)

		results = append(results, types.MatchResult{
			JobId:           job.Id,
			JobName:         job.Name,
			OverallScore:    math.Round(overallScore*100) / 100,
			SkillsMatch:     math.Round(skillsMatch*100) / 100,
			CertsMatch:      math.Round(certsMatch*100) / 100,
			SoftSkillsMatch: math.Round(softSkillsMatch*100) / 100,
			ExperienceMatch: math.Round(experienceMatch*100) / 100,
			GapAnalysis:     gapAnalysis,
		})
	}

	return &types.MatchListResp{
		Code:  errors.CodeSuccess,
		Msg:   "success",
		Total: total,
		List:  results,
	}, nil
}

type GetMatchScoreLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetMatchScoreLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetMatchScoreLogic {
	return &GetMatchScoreLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetMatchScoreLogic) GetMatchScore(studentId, jobId int64) (*types.MatchScoreResp, error) {
	// 从数据库获取学生信息
	student, err := l.svcCtx.StudentModel.FindOne(l.ctx, studentId)
	if err != nil {
		logx.Errorf("FindOne student failed: %v", err)
		return &types.MatchScoreResp{
			Code: errors.CodeInternalError,
			Msg:  "student not found",
		}, nil
	}

	// 从数据库获取职位信息
	job, err := l.svcCtx.JobModel.FindOne(l.ctx, jobId)
	if err != nil {
		logx.Errorf("FindOne job failed: %v", err)
		return &types.MatchScoreResp{
			Code: errors.CodeInternalError,
			Msg:  "job not found",
		}, nil
	}

	// 反序列化学生技能
	var studentSkills []types.StudentSkill
	if student.Skills.Valid {
		json.Unmarshal([]byte(student.Skills.String), &studentSkills)
	}

	// 反序列化职位技能
	var jobSkills []types.Skill
	if job.Skills.Valid {
		json.Unmarshal([]byte(job.Skills.String), &jobSkills)
	}

	// 计算技能匹配度
	skillsMatch := calculateSkillsMatch(studentSkills, jobSkills)

	// 计算证书匹配度
	var studentCerts []types.StudentCert
	if student.Certificates.Valid {
		json.Unmarshal([]byte(student.Certificates.String), &studentCerts)
	}
	var jobCerts []string
	if job.Certificates.Valid {
		json.Unmarshal([]byte(job.Certificates.String), &jobCerts)
	}
	certsMatch := calculateCertsMatch(studentCerts, jobCerts)

	// 计算软技能匹配度
	var studentSoftSkills types.SoftSkills
	if student.SoftSkills.Valid {
		json.Unmarshal([]byte(student.SoftSkills.String), &studentSoftSkills)
	}
	var jobSoftSkills types.SoftSkills
	if job.SoftSkills.Valid {
		json.Unmarshal([]byte(job.SoftSkills.String), &jobSoftSkills)
	}
	softSkillsMatch := calculateSoftSkillsMatch(studentSoftSkills, jobSoftSkills)

	// 计算经验匹配度（基于完整度和竞争力）
	experienceMatch := (student.CompletenessScore + student.CompetitivenessScore) / 2

	// 计算总体匹配度
	overallScore := (skillsMatch*0.35 + certsMatch*0.15 + softSkillsMatch*0.25 + experienceMatch*0.25)

	return &types.MatchScoreResp{
		Code:  errors.CodeSuccess,
		Msg:   "success",
		Score: math.Round(overallScore*100) / 100,
	}, nil
}

type GetRecommendedJobsLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetRecommendedJobsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetRecommendedJobsLogic {
	return &GetRecommendedJobsLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetRecommendedJobsLogic) GetRecommendedJobs(req *types.MatchListReq) (*types.MatchListResp, error) {
	page := req.Page
	if page <= 0 {
		page = 1
	}
	pageSize := req.PageSize
	if pageSize <= 0 {
		pageSize = 10
	}

	// 从数据库获取学生信息
	student, err := l.svcCtx.StudentModel.FindOne(l.ctx, req.StudentId)
	if err != nil {
		logx.Errorf("FindOne student failed: %v", err)
		return &types.MatchListResp{
			Code: errors.CodeInternalError,
			Msg:  "student not found",
		}, nil
	}

	// 反序列化学生技能
	var studentSkills []types.StudentSkill
	if student.Skills.Valid {
		json.Unmarshal([]byte(student.Skills.String), &studentSkills)
	}

	// 反序列化学生证书
	var studentCerts []types.StudentCert
	if student.Certificates.Valid {
		json.Unmarshal([]byte(student.Certificates.String), &studentCerts)
	}

	// 反序列化学生软技能
	var studentSoftSkills types.SoftSkills
	if student.SoftSkills.Valid {
		json.Unmarshal([]byte(student.SoftSkills.String), &studentSoftSkills)
	}

	// 从数据库获取所有职位
	allJobs, _, err := l.svcCtx.JobModel.FindAll(l.ctx, 1, 1000, "") // 获取更多职位进行推荐
	if err != nil {
		logx.Errorf("FindAll jobs failed: %v", err)
		return &types.MatchListResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to get jobs",
		}, nil
	}

	// 计算每个职位的匹配度
	matchResults := make([]types.MatchResult, 0, len(allJobs))
	for _, job := range allJobs {
		// 反序列化职位技能
		var jobSkills []types.Skill
		if job.Skills.Valid {
			json.Unmarshal([]byte(job.Skills.String), &jobSkills)
		}

		// 反序列化职位证书
		var jobCerts []string
		if job.Certificates.Valid {
			json.Unmarshal([]byte(job.Certificates.String), &jobCerts)
		}

		// 反序列化职位软技能
		var jobSoftSkills types.SoftSkills
		if job.SoftSkills.Valid {
			json.Unmarshal([]byte(job.SoftSkills.String), &jobSoftSkills)
		}

		// 计算各项匹配度
		skillsMatch := calculateSkillsMatch(studentSkills, jobSkills)
		certsMatch := calculateCertsMatch(studentCerts, jobCerts)
		softSkillsMatch := calculateSoftSkillsMatch(studentSoftSkills, jobSoftSkills)
		experienceMatch := (student.CompletenessScore + student.CompetitivenessScore) / 2

		// 计算总体匹配度
		overallScore := (skillsMatch*0.35 + certsMatch*0.15 + softSkillsMatch*0.25 + experienceMatch*0.25)

		// 生成差距分析
		gapAnalysis := generateGapAnalysis(studentSkills, jobSkills)

		matchResults = append(matchResults, types.MatchResult{
			JobId:           job.Id,
			JobName:         job.Name,
			OverallScore:    math.Round(overallScore*100) / 100,
			SkillsMatch:     math.Round(skillsMatch*100) / 100,
			CertsMatch:      math.Round(certsMatch*100) / 100,
			SoftSkillsMatch: math.Round(softSkillsMatch*100) / 100,
			ExperienceMatch: math.Round(experienceMatch*100) / 100,
			GapAnalysis:     gapAnalysis,
		})
	}

	// 按匹配度排序（从高到低）
	// 使用简单的冒泡排序
	for i := 0; i < len(matchResults); i++ {
		for j := i + 1; j < len(matchResults); j++ {
			if matchResults[i].OverallScore < matchResults[j].OverallScore {
				matchResults[i], matchResults[j] = matchResults[j], matchResults[i]
			}
		}
	}

	// 分页返回结果
	start := (page - 1) * pageSize
	end := start + pageSize
	if end > len(matchResults) {
		end = len(matchResults)
	}

	var results []types.MatchResult
	if start < len(matchResults) {
		results = matchResults[start:end]
	} else {
		results = []types.MatchResult{}
	}

	return &types.MatchListResp{
		Code:  errors.CodeSuccess,
		Msg:   "success",
		Total: int64(len(matchResults)),
		List:  results,
	}, nil
}
