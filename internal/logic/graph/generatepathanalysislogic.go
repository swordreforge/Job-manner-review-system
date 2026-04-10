package graph

import (
	"context"
	"database/sql"
	"encoding/json"
	"strconv"

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

	var analysis struct {
		MatchScore     float64  `json:"matchScore"`
		GapAnalysis    string   `json:"gapAnalysis"`
		LearningPath   string   `json:"learningPath"`
		RequiredSkills []string `json:"requiredSkills"`
		Timeline       string   `json:"timeline"`
		Recommendation string   `json:"recommendation"`
	}

	if err := json.Unmarshal([]byte(aiResult), &analysis); err != nil {
		logx.Errorf("Failed to parse AI result: %v, result: %s", err, aiResult)
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

		l.svcCtx.PromotionPathModel.Update(l.ctx, existingPath)
		logx.Infof("Updated path analysis for job %d -> %d", req.FromJobId, req.ToJobId)
	} else {
		newPath := &model.JobPromotionPaths{
			FromJobId:      req.FromJobId,
			ToJobId:        req.ToJobId,
			MatchScore:     sql.NullFloat64{Float64: analysis.MatchScore, Valid: true},
			TransferSkills: sql.NullString{String: string(requiredSkillsJSON), Valid: true},
			LearningPath:   sql.NullString{String: analysis.LearningPath, Valid: true},
		}
		l.svcCtx.PromotionPathModel.Insert(l.ctx, newPath)
		logx.Infof("Created new path analysis for job %d -> %d", req.FromJobId, req.ToJobId)
	}

	return &types.ErrorResp{
		Code: 0,
		Msg:  "success",
	}, nil
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
