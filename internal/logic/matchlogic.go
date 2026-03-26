package logic

import (
	"context"
	"math"
	"math/rand"

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
	content, err := l.svcCtx.AIProvider.MatchAnalysis(l.ctx,
		"Student Profile Data",
		"Job Profile Data")
	if err != nil {
		logx.Errorf("MatchStudentJob failed: %v", err)
	}

	skillsMatch := float64(rand.Intn(36) + 60)
	certsMatch := float64(rand.Intn(41) + 50)
	softSkillsMatch := float64(rand.Intn(31) + 65)
	experienceMatch := float64(rand.Intn(31) + 55)

	overallScore := (skillsMatch*0.35 + certsMatch*0.15 + softSkillsMatch*0.25 + experienceMatch*0.25)

	result := &types.MatchResult{
		JobId:           req.JobId,
		JobName:         "Software Engineer",
		OverallScore:    math.Round(overallScore*100) / 100,
		SkillsMatch:     math.Round(skillsMatch*100) / 100,
		CertsMatch:      math.Round(certsMatch*100) / 100,
		SoftSkillsMatch: math.Round(softSkillsMatch*100) / 100,
		ExperienceMatch: math.Round(experienceMatch*100) / 100,
		GapAnalysis: []types.Gap{
			{
				Attribute:  "Go Programming",
				Required:   4,
				Current:    3,
				GapPercent: 25,
				Suggestion: "Practice Go concurrency patterns",
			},
			{
				Attribute:  "System Design",
				Required:   3,
				Current:    2,
				GapPercent: 33,
				Suggestion: "Study distributed systems concepts",
			},
		},
	}

	_ = content

	return &types.MatchResultResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
		Data: result,
	}, nil
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

	results := make([]types.MatchResult, 0, pageSize)
	for i := 0; i < pageSize; i++ {
		overallScore := float64(rand.Intn(46) + 50)
		results = append(results, types.MatchResult{
			JobId:           int64(page*pageSize + i),
			JobName:         "Software Engineer " + string(rune('A'+i)),
			OverallScore:    overallScore,
			SkillsMatch:     float64(rand.Intn(46) + 50),
			CertsMatch:      float64(rand.Intn(41) + 50),
			SoftSkillsMatch: float64(rand.Intn(46) + 50),
			ExperienceMatch: float64(rand.Intn(36) + 50),
			GapAnalysis:     []types.Gap{},
		})
	}

	return &types.MatchListResp{
		Code:  errors.CodeSuccess,
		Msg:   "success",
		Total: 100,
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
	score := float64(rand.Intn(46) + 50)

	return &types.MatchScoreResp{
		Code:  errors.CodeSuccess,
		Msg:   "success",
		Score: score,
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

	results := make([]types.MatchResult, 0, pageSize)
	for i := 0; i < pageSize; i++ {
		overallScore := float64(rand.Intn(39) + 60)
		results = append(results, types.MatchResult{
			JobId:           int64(page*pageSize + i),
			JobName:         "Recommended Job " + string(rune('A'+i)),
			OverallScore:    overallScore,
			SkillsMatch:     float64(rand.Intn(36) + 60),
			CertsMatch:      float64(rand.Intn(31) + 60),
			SoftSkillsMatch: float64(rand.Intn(36) + 60),
			ExperienceMatch: float64(rand.Intn(26) + 60),
			GapAnalysis:     []types.Gap{},
		})
	}

	return &types.MatchListResp{
		Code:  errors.CodeSuccess,
		Msg:   "success",
		Total: 50,
		List:  results,
	}, nil
}
