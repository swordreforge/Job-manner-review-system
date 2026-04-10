// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package graph

import (
	"context"
	"database/sql"
	"encoding/json"
	"strconv"
	"strings"
	"time"

	pkg "career-api/common/pkg"
	"career-api/internal/model"
	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GeneratePathAnalysisLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGeneratePathAnalysisLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GeneratePathAnalysisLogic {
	return &GeneratePathAnalysisLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

type GeneratePathAnalysisReq struct {
	FromJobId int64  `json:"fromJobId"`
	ToJobId   int64  `json:"toJobId"`
	StudentId int64  `json:"studentId"`
	PathType  string `json:"pathType"`
}

func (l *GeneratePathAnalysisLogic) GeneratePathAnalysis(req *GeneratePathAnalysisReq) (resp *types.ErrorResp, err error) {
	if req.FromJobId == req.ToJobId {
		return &types.ErrorResp{
			Code: 400,
			Msg:  "源岗位和目标岗位不能相同",
		}, nil
	}

	fromJob, err := l.svcCtx.JobModel.FindOne(l.ctx, req.FromJobId)
	if err != nil {
		return &types.ErrorResp{
			Code: 500,
			Msg:  "来源岗位不存在",
		}, nil
	}

	toJob, err := l.svcCtx.JobModel.FindOne(l.ctx, req.ToJobId)
	if err != nil {
		return &types.ErrorResp{
			Code: 500,
			Msg:  "目标岗位不存在",
		}, nil
	}

	var studentProfile string
	if req.StudentId > 0 {
		student, err := l.svcCtx.StudentModel.FindOne(l.ctx, req.StudentId)
		if err == nil && student != nil {
			studentProfile = formatStudentInfo(student)
		}
	}

	fromJobInfo := formatJobInfoForAI(fromJob)
	toJobInfo := formatJobInfoForAI(toJob)

	aiReq := pkg.PathAnalysisRequest{
		StudentProfile: studentProfile,
		FromJobInfo:    fromJobInfo,
		ToJobInfo:      toJobInfo,
		PathType:       req.PathType,
	}

	aiResult, err := l.svcCtx.AIProvider.GeneratePathAnalysis(l.ctx, aiReq)
	if err != nil {
		logx.Errorf("AI path analysis failed: %v", err)
		return &types.ErrorResp{
			Code: 500,
			Msg:  "AI分析失败: " + err.Error(),
		}, nil
	}

	logx.Infof("AI Path Analysis Result: %s", aiResult)

	cleanResult := strings.TrimSpace(aiResult)
	cleanResult = strings.TrimPrefix(cleanResult, "```json")
	cleanResult = strings.TrimPrefix(cleanResult, "```")
	cleanResult = strings.TrimSuffix(cleanResult, "```")
	cleanResult = strings.TrimSpace(cleanResult)

	var analysis struct {
		MatchScore     float64  `json:"matchScore"`
		GapAnalysis    string   `json:"gapAnalysis"`
		LearningPath   string   `json:"learningPath"`
		RequiredSkills []string `json:"requiredSkills"`
		Timeline       string   `json:"timeline"`
		Recommendation string   `json:"recommendation"`
	}

	if err := json.Unmarshal([]byte(cleanResult), &analysis); err != nil {
		logx.Errorf("Failed to parse AI result: %v, result: %s", err, cleanResult)
		return &types.ErrorResp{
			Code: 500,
			Msg:  "解析AI结果失败",
		}, nil
	}

	existingPaths, _ := l.svcCtx.PromotionPathModel.FindByFromJob(l.ctx, req.FromJobId)
	var existingPath *model.JobPromotionPaths
	for _, p := range existingPaths {
		if p.ToJobId == req.ToJobId {
			existingPath = p
			break
		}
	}

	requiredSkillsJSON, _ := json.Marshal(analysis.RequiredSkills)

	if existingPath != nil {
		existingPath.MatchScore = sql.NullFloat64{Float64: analysis.MatchScore, Valid: true}
		existingPath.TransferSkills = sql.NullString{String: string(requiredSkillsJSON), Valid: true}
		existingPath.LearningPath = sql.NullString{String: analysis.LearningPath, Valid: true}
		existingPath.UpdatedAt = time.Now().Unix()

		l.svcCtx.PromotionPathModel.Update(l.ctx, existingPath)
		logx.Infof("Updated path analysis for job %d -> %d", req.FromJobId, req.ToJobId)
	} else {
		now := time.Now().Unix()
		newPath := &model.JobPromotionPaths{
			FromJobId:      req.FromJobId,
			ToJobId:        req.ToJobId,
			MatchScore:     sql.NullFloat64{Float64: analysis.MatchScore, Valid: true},
			TransferSkills: sql.NullString{String: string(requiredSkillsJSON), Valid: true},
			LearningPath:   sql.NullString{String: analysis.LearningPath, Valid: true},
			CreatedAt:      now,
			UpdatedAt:      now,
		}
		l.svcCtx.PromotionPathModel.Insert(l.ctx, newPath)
		logx.Infof("Created new path analysis for job %d -> %d", req.FromJobId, req.ToJobId)
	}

	return &types.ErrorResp{
		Code: 0,
		Msg:  "success",
	}, nil
}

// GeneratePromotionTargets generates possible promotion targets for a job based on user resume
type GeneratePromotionTargetsReq struct {
	JobId     int64 `json:"jobId"`
	StudentId int64 `json:"studentId"`
}

func (l *GeneratePathAnalysisLogic) GeneratePromotionTargets(req *GeneratePromotionTargetsReq) (resp *types.ErrorResp, err error) {
	job, err := l.svcCtx.JobModel.FindOne(l.ctx, req.JobId)
	if err != nil {
		return &types.ErrorResp{
			Code: 500,
			Msg:  "岗位不存在",
		}, nil
	}

	var studentProfile string
	if req.StudentId > 0 {
		student, err := l.svcCtx.StudentModel.FindOne(l.ctx, req.StudentId)
		if err == nil && student != nil {
			studentProfile = formatStudentInfo(student)
		}
	}

	jobInfo := formatJobInfoForAI(job)

	aiResult, err := l.svcCtx.AIProvider.GeneratePromotionTargets(l.ctx, jobInfo, studentProfile)
	if err != nil {
		logx.Errorf("AI generate promotion targets failed: %v", err)
		return &types.ErrorResp{
			Code: 500,
			Msg:  "AI生成晋升目标失败: " + err.Error(),
		}, nil
	}

	logx.Infof("AI Generate Promotion Targets Result: %s", aiResult)

	// 解析AI返回的晋升目标
	type TargetResult struct {
		Targets []struct {
			JobName        string   `json:"jobName"`
			Reason         string   `json:"reason"`
			MatchScore     float64  `json:"matchScore"`
			TransferSkills []string `json:"transferSkills"`
			LearningPath   string   `json:"learningPath"`
		} `json:"targets"`
	}

	cleanResult := strings.TrimSpace(aiResult)
	cleanResult = strings.TrimPrefix(cleanResult, "```json")
	cleanResult = strings.TrimPrefix(cleanResult, "```")
	cleanResult = strings.TrimSuffix(cleanResult, "```")
	cleanResult = strings.TrimSpace(cleanResult)

	logx.Infof("Cleaned AI result: %s", cleanResult)

	var targetResult TargetResult
	if err := json.Unmarshal([]byte(cleanResult), &targetResult); err != nil {
		logx.Errorf("Failed to parse AI targets result: %v", err)
		return &types.ErrorResp{
			Code: 500,
			Msg:  "解析晋升目标失败",
		}, nil
	}

	// 为每个目标岗位创建晋升路径记录
	allJobs, _, err := l.svcCtx.JobModel.FindAll(l.ctx, 1, 1000, "")
	if err != nil {
		logx.Errorf("Failed to get all jobs: %v", err)
		return &types.ErrorResp{
			Code: 500,
			Msg:  "获取岗位列表失败",
		}, nil
	}

	now := time.Now().Unix()
	createdCount := 0

	logx.Infof("Looking for matching jobs among %d jobs", len(allJobs))
	logx.Infof("AI returned %d targets", len(targetResult.Targets))

	for _, target := range targetResult.Targets {
		logx.Infof("Looking for job matching: %s", target.JobName)

		// 清理 AI 返回的岗位名称，去除"高级"、"资深"等前缀
		cleanJobName := target.JobName
		cleanJobName = strings.TrimPrefix(cleanJobName, "高级")
		cleanJobName = strings.TrimPrefix(cleanJobName, "资深")
		cleanJobName = strings.TrimPrefix(cleanJobName, "初级")
		cleanJobName = strings.TrimPrefix(cleanJobName, "中级")
		cleanJobName = strings.TrimSpace(cleanJobName)

		// 使用智能模糊匹配查找目标岗位
		matchedJob := fuzzyMatchJob(target.JobName, allJobs, req.JobId)
		if matchedJob != nil {
			logx.Infof("Fuzzy matched: %s (id=%d) for target: %s", matchedJob.Name, matchedJob.Id, target.JobName)
		}

		// 如果没有找到匹配，自动创建新岗位
		if matchedJob == nil {
			logx.Infof("No matching job found for: %s, creating new job", target.JobName)
			newJob := &model.Jobs{
				Name:      target.JobName,
				CreatedAt: now,
				UpdatedAt: now,
			}
			result, err := l.svcCtx.JobModel.Insert(l.ctx, newJob)
			if err != nil {
				logx.Errorf("Failed to create job %s: %v", target.JobName, err)
				continue
			}
			newJobId, _ := result.LastInsertId()
			newJob.Id = newJobId
			matchedJob = newJob
			logx.Infof("Created new job: %s (id=%d)", target.JobName, newJobId)
		}

		// 检查是否已存在
		existingPaths, _ := l.svcCtx.PromotionPathModel.FindByFromJob(l.ctx, req.JobId)
		exists := false
		for _, p := range existingPaths {
			if p.ToJobId == matchedJob.Id {
				exists = true
				break
			}
		}

		if !exists {
			// 序列化 transferSkills 为 JSON
			transferSkillsJSON := ""
			if len(target.TransferSkills) > 0 {
				skillsJSON, _ := json.Marshal(target.TransferSkills)
				transferSkillsJSON = string(skillsJSON)
			}

			// 使用 AI 返回的 learningPath 或 reason
			learningPath := target.LearningPath
			if learningPath == "" {
				learningPath = target.Reason
			}

			newPath := &model.JobPromotionPaths{
				FromJobId:      req.JobId,
				ToJobId:        matchedJob.Id,
				MatchScore:     sql.NullFloat64{Float64: target.MatchScore, Valid: target.MatchScore > 0},
				TransferSkills: sql.NullString{String: transferSkillsJSON, Valid: transferSkillsJSON != ""},
				LearningPath:   sql.NullString{String: learningPath, Valid: learningPath != ""},
				CreatedAt:      now,
				UpdatedAt:      now,
			}
			l.svcCtx.PromotionPathModel.Insert(l.ctx, newPath)
			createdCount++
			logx.Infof("Created promotion path: %d -> %d (%s) with score %v", req.JobId, matchedJob.Id, target.JobName, target.MatchScore)
		}
	}

	if createdCount == 0 {
		return &types.ErrorResp{
			Code: 500,
			Msg:  "未能找到匹配的晋升目标岗位",
		}, nil
	}

	return &types.ErrorResp{
		Code: 0,
		Msg:  "success",
	}, nil
}

type GenerateTransferTargetsReq struct {
	JobId     int64 `json:"jobId"`
	StudentId int64 `json:"studentId"`
}

func (l *GeneratePathAnalysisLogic) GenerateTransferTargets(req *GenerateTransferTargetsReq) (resp *types.ErrorResp, err error) {
	job, err := l.svcCtx.JobModel.FindOne(l.ctx, req.JobId)
	if err != nil {
		return &types.ErrorResp{
			Code: 500,
			Msg:  "岗位不存在",
		}, nil
	}

	var studentProfile string
	if req.StudentId > 0 {
		student, err := l.svcCtx.StudentModel.FindOne(l.ctx, req.StudentId)
		if err == nil && student != nil {
			studentProfile = formatStudentInfo(student)
		}
	}

	jobInfo := formatJobInfoForAI(job)

	aiResult, err := l.svcCtx.AIProvider.GenerateTransferTargets(l.ctx, jobInfo, studentProfile)
	if err != nil {
		logx.Errorf("AI generate transfer targets failed: %v", err)
		return &types.ErrorResp{
			Code: 500,
			Msg:  "AI生成转岗目标失败: " + err.Error(),
		}, nil
	}

	logx.Infof("AI Generate Transfer Targets Result: %s", aiResult)

	type TargetResult struct {
		Targets []struct {
			JobName        string   `json:"jobName"`
			Reason         string   `json:"reason"`
			MatchScore     float64  `json:"matchScore"`
			TransferSkills []string `json:"transferSkills"`
			LearningPath   string   `json:"learningPath"`
		} `json:"targets"`
	}

	cleanResult := strings.TrimSpace(aiResult)
	cleanResult = strings.TrimPrefix(cleanResult, "```json")
	cleanResult = strings.TrimPrefix(cleanResult, "```")
	cleanResult = strings.TrimSuffix(cleanResult, "```")
	cleanResult = strings.TrimSpace(cleanResult)

	logx.Infof("Cleaned AI result: %s", cleanResult)

	var targetResult TargetResult
	if err := json.Unmarshal([]byte(cleanResult), &targetResult); err != nil {
		logx.Errorf("Failed to parse AI targets result: %v", err)
		return &types.ErrorResp{
			Code: 500,
			Msg:  "解析转岗目标失败",
		}, nil
	}

	allJobs, _, err := l.svcCtx.JobModel.FindAll(l.ctx, 1, 1000, "")
	if err != nil {
		logx.Errorf("Failed to get all jobs: %v", err)
		return &types.ErrorResp{
			Code: 500,
			Msg:  "获取岗位列表失败",
		}, nil
	}

	now := time.Now().Unix()
	createdCount := 0

	logx.Infof("Looking for matching jobs among %d jobs", len(allJobs))
	logx.Infof("AI returned %d targets", len(targetResult.Targets))

	for _, target := range targetResult.Targets {
		logx.Infof("Looking for job matching: %s", target.JobName)

		// 使用智能模糊匹配查找目标岗位
		matchedJob := fuzzyMatchJob(target.JobName, allJobs, req.JobId)
		if matchedJob != nil {
			logx.Infof("Fuzzy matched: %s (id=%d) for target: %s", matchedJob.Name, matchedJob.Id, target.JobName)
		}

		// 如果没有找到匹配，自动创建新岗位
		if matchedJob == nil {
			logx.Infof("No matching job found for: %s, creating new job", target.JobName)
			newJob := &model.Jobs{
				Name:      target.JobName,
				CreatedAt: now,
				UpdatedAt: now,
			}
			result, err := l.svcCtx.JobModel.Insert(l.ctx, newJob)
			if err != nil {
				logx.Errorf("Failed to create job %s: %v", target.JobName, err)
				continue
			}
			newJobId, _ := result.LastInsertId()
			newJob.Id = newJobId
			matchedJob = newJob
			logx.Infof("Created new job: %s (id=%d)", target.JobName, newJobId)
		}

		existingPaths, _ := l.svcCtx.PromotionPathModel.FindByFromJob(l.ctx, req.JobId)
		exists := false
		for _, p := range existingPaths {
			if p.ToJobId == matchedJob.Id {
				exists = true
				break
			}
		}

		if !exists {
			// 序列化 transferSkills 为 JSON
			transferSkillsJSON := ""
			if len(target.TransferSkills) > 0 {
				skillsJSON, _ := json.Marshal(target.TransferSkills)
				transferSkillsJSON = string(skillsJSON)
			}

			// 使用 AI 返回的 learningPath 或 reason
			learningPath := target.LearningPath
			if learningPath == "" {
				learningPath = target.Reason
			}

			newPath := &model.JobPromotionPaths{
				FromJobId:      req.JobId,
				ToJobId:        matchedJob.Id,
				MatchScore:     sql.NullFloat64{Float64: target.MatchScore, Valid: target.MatchScore > 0},
				TransferSkills: sql.NullString{String: transferSkillsJSON, Valid: transferSkillsJSON != ""},
				LearningPath:   sql.NullString{String: learningPath, Valid: learningPath != ""},
				CreatedAt:      now,
				UpdatedAt:      now,
			}
			l.svcCtx.PromotionPathModel.Insert(l.ctx, newPath)
			createdCount++
			logx.Infof("Created transfer path: %d -> %d (%s) with score %v", req.JobId, matchedJob.Id, target.JobName, target.MatchScore)
		}
	}

	if createdCount == 0 {
		return &types.ErrorResp{
			Code: 500,
			Msg:  "未能找到匹配的转岗目标岗位",
		}, nil
	}

	return &types.ErrorResp{
		Code: 0,
		Msg:  "success",
	}, nil
}

// FindAll gets all jobs
func (l *GeneratePathAnalysisLogic) FindAll() ([]*model.Jobs, error) {
	return nil, nil
}

func formatJobInfoForAI(job *model.Jobs) string {
	var skills []string
	if job.Skills.Valid {
		json.Unmarshal([]byte(job.Skills.String), &skills)
	}
	info := job.Name
	if job.Company.Valid && job.Company.String != "" {
		info += " | 公司: " + job.Company.String
	}
	if job.Description.Valid && job.Description.String != "" {
		info += " | 描述: " + job.Description.String
	}
	if len(skills) > 0 {
		info += " | 技能: " + strconv.Itoa(len(skills)) + "项"
	}
	return info
}

func formatStudentInfo(student *model.Students) string {
	info := "学生信息: "
	if student.Name != "" {
		info += "姓名:" + student.Name + " | "
	}
	if student.Education.Valid {
		info += "学历:" + student.Education.String + " | "
	}
	if student.Major.Valid {
		info += "专业:" + student.Major.String + " | "
	}
	if student.Skills.Valid {
		info += "技能:" + student.Skills.String + " | "
	}
	if student.Certificates.Valid {
		info += "证书:" + student.Certificates.String
	}
	return info
}

// fuzzyMatchJob 使用智能模糊匹配在岗位列表中查找匹配
func fuzzyMatchJob(targetName string, jobs []*model.Jobs, excludeId int64) *model.Jobs {
	// 预处理：去除各种前缀和后缀
	cleanName := targetName
	prefixes := []string{"高级", "资深", "初级", "中级", "首席", "资深", "见习", "全职", "兼职", "远程", "主管", "负责人", "专员", "工程师", "开发", "设计师", "经理", "总监"}
	suffixes := []string{"岗", "工程师", "开发", "设计师", "经理", "总监", "专家", "专员"}

	// 去除所有前缀
	for _, prefix := range prefixes {
		cleanName = strings.TrimPrefix(cleanName, prefix)
	}
	// 去除所有后缀
	for _, suffix := range suffixes {
		cleanName = strings.TrimSuffix(cleanName, suffix)
	}
	cleanName = strings.TrimSpace(cleanName)

	// 常见同义词映射
	synonyms := map[string][]string{
		"后端":     []string{"后端", "Backend", "backend"},
		"前端":     []string{"前端", "Frontend", "frontend", "FE"},
		"全栈":     []string{"全栈", "Fullstack", "fullstack", "Full Stack"},
		"Java":   []string{"Java", "JAVA", "java"},
		"Golang": []string{"Golang", "Go", "GO", "golang"},
		"Python": []string{"Python", "PYTHON", "python", "Python"},
		"数据":     []string{"数据", "Data"},
		"分析":     []string{"分析", "Analytics", "分析"},
		"算法":     []string{"算法", "Algorithm"},
		"机器学习":   []string{"机器学习", "Machine Learning", "ML", "AI"},
		"深度学习":   []string{"深度学习", "Deep Learning", "DL"},
		"产品":     []string{"产品", "Product"},
		"运营":     []string{"运营", "Operation", "Operations"},
		"测试":     []string{"测试", "QA", "QC", "Test"},
		"运维":     []string{"运维", "DevOps", "SRE", "Ops"},
		"安全":     []string{"安全", "Security", "Sec"},
		"云原生":    []string{"云原生", "Cloud Native", "CloudNative"},
		"架构":     []string{"架构", "Architecture", "架构师"},
		"技术":     []string{"技术", "Tech", "技术"},
		"研发":     []string{"研发", "研发", "R&D", "RD"},
		"管理":     []string{"管理", "Manager", "Lead", "管理"},
	}

	// 计算标准化关键词集合
	normalizeKeyword := func(s string) string {
		result := strings.ToLower(s)
		for _, syns := range synonyms {
			for _, syn := range syns {
				if strings.Contains(result, strings.ToLower(syn)) {
					for _, other := range syns {
						result = strings.ReplaceAll(result, strings.ToLower(other), syns[0])
					}
				}
			}
		}
		return result
	}

	targetNorm := normalizeKeyword(targetName)
	cleanNorm := normalizeKeyword(cleanName)

	bestMatch := (*model.Jobs)(nil)
	bestScore := 0

	for _, job := range jobs {
		if job.Id == excludeId {
			continue
		}

		jobName := job.Name
		jobNorm := normalizeKeyword(jobName)
		jobClean := jobName
		for _, prefix := range prefixes {
			jobClean = strings.TrimPrefix(jobClean, prefix)
		}
		for _, suffix := range suffixes {
			jobClean = strings.TrimSuffix(jobClean, suffix)
		}
		jobCleanNorm := normalizeKeyword(jobClean)

		var score int

		// 1. 精确匹配（去除前缀后）
		if cleanNorm != "" && jobCleanNorm != "" {
			if cleanNorm == jobCleanNorm {
				return job
			}
			// 核心词匹配
			cleanCore := strings.Split(cleanNorm, " ")
			jobCore := strings.Split(jobCleanNorm, " ")
			matchCount := 0
			for _, cc := range cleanCore {
				if cc == "" || len(cc) < 2 {
					continue
				}
				for _, jc := range jobCore {
					if jc == "" || len(jc) < 2 {
						continue
					}
					// 部分包含匹配
					if strings.Contains(cc, jc) || strings.Contains(jc, cc) {
						matchCount++
					}
				}
			}
			score = matchCount * 10
		}

		// 2. 原名称包含匹配
		if strings.Contains(jobNorm, targetNorm) || strings.Contains(targetNorm, jobNorm) {
			score += 30
		}

		// 3. 主要关键词匹配（取前两个重要词）
		targetWords := strings.Fields(targetNorm)
		jobWords := strings.Fields(jobNorm)

		importantMatches := 0
		for _, tw := range targetWords {
			if len(tw) < 2 {
				continue
			}
			for _, jw := range jobWords {
				if len(jw) < 2 {
					continue
				}
				// 单向包含匹配（长词包含短词）
				if len(tw) > len(jw) && strings.Contains(tw, jw) {
					importantMatches++
				} else if len(jw) > len(tw) && strings.Contains(jw, tw) {
					importantMatches++
				}
			}
		}
		score += importantMatches * 20

		// 4. 品牌/公司不同时惩罚（但不完全排除）
		// 例如：阿里巴巴Java工程师 vs 字节跳动Java工程师 可以匹配

		if score > bestScore && score >= 20 {
			bestScore = score
			bestMatch = job
			if score >= 40 {
				return job
			}
		}
	}

	return bestMatch
}
