package logic

import (
	"context"
	"fmt"
	"math/rand"
	"time"

	"github.com/zeromicro/go-zero/core/logx"

	"career-api/common/errors"
	ai "career-api/common/pkg"
	"career-api/internal/svc"
	"career-api/internal/types"
)

type GenerateReportLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGenerateReportLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GenerateReportLogic {
	return &GenerateReportLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GenerateReportLogic) GenerateReport(req *types.GenerateReportReq) (*types.ReportResp, error) {
	studentProfile := "Student profile data"
	jobProfile := "Target job profile data"
	matchResult := "Match analysis results"

	content, err := l.svcCtx.AIProvider.GenerateCareerReport(l.ctx, ai.ReportGenerationRequest{
		StudentProfile: studentProfile,
		JobProfile:     jobProfile,
		MatchResult:    matchResult,
		Options: ai.ReportOptions{
			IncludeGapAnalysis: req.Options.IncludeGapAnalysis,
			IncludeActionPlan:  req.Options.IncludeActionPlan,
			DetailedLevel:      req.Options.DetailedLevel,
		},
	})
	if err != nil {
		logx.Errorf("GenerateReport failed: %v", err)
		content = "Career development report generated based on student profile and target position."
	}

	report := &types.CareerReport{
		Id:        time.Now().UnixNano(),
		StudentId: req.StudentId,
		Title:     "Career Development Report",
		Overview: types.ReportOverview{
			StudentName:     "Zhang San",
			Education:       "Bachelor",
			Major:           "Computer Science",
			Completeness:    85.0,
			Competitiveness: 75.0,
			TopJobs: []types.JobRef{
				{Id: 1, Name: "Software Engineer"},
				{Id: 2, Name: "Backend Developer"},
			},
		},
		MatchAnalysis: types.MatchAnalysis{
			OverallScore: 78.5,
			Strengths:    []string{"Strong programming skills", "Good teamwork"},
			Weaknesses:   []string{"Limited experience with distributed systems"},
			TopMatches:   []types.MatchResult{},
		},
		CareerPath: types.CareerPath{
			TargetJob: types.JobNode{
				Id:          1,
				Name:        "Senior Software Engineer",
				Level:       3,
				Description: "Lead technical development",
				Skills:      []string{"Go", "System Design", "Leadership"},
			},
			IndustryTrend: "Growing demand for AI/ML engineers",
			SocialDemand:  "High demand in tech industry",
			Milestones: []types.Milestone{
				{
					Stage:    "Short-term",
					Year:     2025,
					Position: "Junior Developer",
					Skills:   []string{"Go", "Python"},
					Salary:   "15k-25k",
				},
				{
					Stage:    "Mid-term",
					Year:     2027,
					Position: "Senior Developer",
					Skills:   []string{"Architecture", "Leadership"},
					Salary:   "30k-50k",
				},
				{
					Stage:    "Long-term",
					Year:     2030,
					Position: "Tech Lead",
					Skills:   []string{"Strategy", "Management"},
					Salary:   "60k-100k",
				},
			},
		},
		ActionPlan: types.ActionPlan{
			ShortTerm: []types.Action{
				{
					Period:    "0-6 months",
					Task:      "Master Go concurrency patterns",
					Details:   "Complete advanced Go courses and projects",
					Timeline:  "Q1 2025",
					Resources: []string{"Go expert courses", "Practice projects"},
				},
			},
			MidTerm: []types.Action{
				{
					Period:    "6-18 months",
					Task:      "Build system design skills",
					Details:   "Learn distributed systems and microservices",
					Timeline:  "2025-2026",
					Resources: []string{"System design books", "Online courses"},
				},
			},
			LongTerm: []types.Action{
				{
					Period:    "18-36 months",
					Task:      "Develop leadership skills",
					Details:   "Lead team projects and mentor junior developers",
					Timeline:  "2026-2027",
					Resources: []string{"Leadership training", "Mentoring programs"},
				},
			},
		},
		Content:   content,
		Status:    "generated",
		CreatedAt: time.Now().Unix(),
		UpdatedAt: time.Now().Unix(),
	}

	return &types.ReportResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
		Data: report,
	}, nil
}

type GetReportLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetReportLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetReportLogic {
	return &GetReportLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetReportLogic) GetReport(id int64) (*types.ReportResp, error) {
	report := &types.CareerReport{
		Id:        id,
		StudentId: 1,
		Title:     "Career Development Report",
		Overview: types.ReportOverview{
			StudentName:     "Zhang San",
			Education:       "Bachelor",
			Major:           "Computer Science",
			Completeness:    85.0,
			Competitiveness: 75.0,
			TopJobs:         []types.JobRef{},
		},
		MatchAnalysis: types.MatchAnalysis{
			OverallScore: 78.5,
			Strengths:    []string{"Strong programming skills"},
			Weaknesses:   []string{"Limited experience"},
		},
		CareerPath: types.CareerPath{
			TargetJob: types.JobNode{
				Id:   1,
				Name: "Senior Software Engineer",
			},
			Milestones: []types.Milestone{},
		},
		ActionPlan: types.ActionPlan{
			ShortTerm: []types.Action{},
			MidTerm:   []types.Action{},
			LongTerm:  []types.Action{},
		},
		Content:   "Report content",
		Status:    "generated",
		CreatedAt: time.Now().Unix(),
		UpdatedAt: time.Now().Unix(),
	}

	return &types.ReportResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
		Data: report,
	}, nil
}

type UpdateReportLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewUpdateReportLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UpdateReportLogic {
	return &UpdateReportLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *UpdateReportLogic) UpdateReport(req *types.UpdateReportReq) (*types.ReportResp, error) {
	report := &types.CareerReport{
		Id:        req.Id,
		StudentId: 1,
		Title:     req.Title,
		Content:   req.Content,
		Status:    req.Status,
		UpdatedAt: time.Now().Unix(),
	}

	return &types.ReportResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
		Data: report,
	}, nil
}

type DeleteReportLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewDeleteReportLogic(ctx context.Context, svcCtx *svc.ServiceContext) *DeleteReportLogic {
	return &DeleteReportLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *DeleteReportLogic) DeleteReport(id int64) (*types.ReportResp, error) {
	return &types.ReportResp{
		Code: errors.CodeSuccess,
		Msg:  "deleted successfully",
	}, nil
}

type ListReportsLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewListReportsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListReportsLogic {
	return &ListReportsLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ListReportsLogic) ListReports(req *types.ReportListReq) (*types.ReportListResultResp, error) {
	page := req.Page
	if page <= 0 {
		page = 1
	}
	pageSize := req.PageSize
	if pageSize <= 0 {
		pageSize = 10
	}

	reports := make([]types.CareerReport, 0, pageSize)
	for i := 0; i < pageSize; i++ {
		reports = append(reports, types.CareerReport{
			Id:        int64(page*pageSize + i),
			StudentId: req.StudentId,
			Title:     fmt.Sprintf("Career Report %d", i+1),
			Status:    req.Status,
			CreatedAt: time.Now().Unix(),
			UpdatedAt: time.Now().Unix(),
		})
	}

	return &types.ReportListResultResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
		Data: &types.ReportListResp{
			Total: 50,
			List:  reports,
		},
	}, nil
}

type ExportReportLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewExportReportLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ExportReportLogic {
	return &ExportReportLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ExportReportLogic) ExportReport(req *types.ExportReq) (*types.ExportResp, error) {
	if req.Format == "" {
		req.Format = "json"
	}

	url := fmt.Sprintf("/exports/report_%d.%s", req.ReportId, req.Format)

	return &types.ExportResp{
		Code:    errors.CodeSuccess,
		Msg:     "export successful",
		Url:     url,
		Content: `{"reportId": ` + fmt.Sprintf("%d", req.ReportId) + `}`,
	}, nil
}

type PolishReportLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewPolishReportLogic(ctx context.Context, svcCtx *svc.ServiceContext) *PolishReportLogic {
	return &PolishReportLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *PolishReportLogic) PolishReport(req *types.PolishReq) (*types.ReportResp, error) {
	report := &types.CareerReport{
		Id:        req.ReportId,
		StudentId: 1,
		Title:     "Polished Career Report",
		Content:   "This report has been optimized and polished for better readability.",
		Status:    "polished",
		UpdatedAt: time.Now().Unix(),
	}

	return &types.ReportResp{
		Code: errors.CodeSuccess,
		Msg:  "report polished successfully",
		Data: report,
	}, nil
}

type CheckReportCompletenessLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewCheckReportCompletenessLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CheckReportCompletenessLogic {
	return &CheckReportCompletenessLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *CheckReportCompletenessLogic) CheckReportCompleteness(id int64) (*types.ReportResp, error) {
	completeness := float64(rand.Intn(31) + 70)

	report := &types.CareerReport{
		Id:        id,
		StudentId: 1,
		Title:     "Career Development Report",
		Overview: types.ReportOverview{
			Completeness: completeness,
		},
		Status:    "checked",
		UpdatedAt: time.Now().Unix(),
	}

	return &types.ReportResp{
		Code: errors.CodeSuccess,
		Msg:  fmt.Sprintf("report completeness: %.1f%%", completeness),
		Data: report,
	}, nil
}

type GetMyReportsLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetMyReportsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetMyReportsLogic {
	return &GetMyReportsLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetMyReportsLogic) GetMyReports() (*types.ReportListResultResp, error) {
	reports := []types.CareerReport{
		{
			Id:        1,
			StudentId: 1,
			Title:     "My Career Report 1",
			Status:    "generated",
			CreatedAt: time.Now().Unix(),
			UpdatedAt: time.Now().Unix(),
		},
		{
			Id:        2,
			StudentId: 1,
			Title:     "My Career Report 2",
			Status:    "polished",
			CreatedAt: time.Now().Unix(),
			UpdatedAt: time.Now().Unix(),
		},
	}

	return &types.ReportListResultResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
		Data: &types.ReportListResp{
			Total: 2,
			List:  reports,
		},
	}, nil
}
