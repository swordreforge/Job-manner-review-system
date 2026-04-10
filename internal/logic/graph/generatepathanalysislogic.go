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

	aiReq := pkg.PathAnalysisRequest{
		StudentProfile: studentProfile,
		FromJobInfo:    jobInfo,
		ToJobInfo:      "晋升目标岗位",
		PathType:       "promotion",
	}

	aiResult, err := l.svcCtx.AIProvider.GeneratePathAnalysis(l.ctx, aiReq)
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
			JobName string `json:"jobName"`
			Reason  string `json:"reason"`
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
		// 在现有岗位中查找匹配的目标岗位
		var matchedJob *model.Jobs
		for _, job := range allJobs {
			if strings.Contains(job.Name, target.JobName) || strings.Contains(target.JobName, job.Name) {
				matchedJob = job
				logx.Infof("Matched: %s (id=%d)", job.Name, job.Id)
				break
			}
		}

		if matchedJob == nil {
			logx.Errorf("No matching job found for: %s", target.JobName)
		}

		if matchedJob != nil {
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
				newPath := &model.JobPromotionPaths{
					FromJobId:      req.JobId,
					ToJobId:        matchedJob.Id,
					MatchScore:     sql.NullFloat64{Valid: false},
					TransferSkills: sql.NullString{Valid: false},
					LearningPath:   sql.NullString{String: target.Reason, Valid: true},
					CreatedAt:      now,
					UpdatedAt:      now,
				}
				l.svcCtx.PromotionPathModel.Insert(l.ctx, newPath)
				createdCount++
				logx.Infof("Created promotion path: %d -> %d (%s)", req.JobId, matchedJob.Id, target.JobName)
			}
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
