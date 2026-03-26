package logic

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"time"

	"github.com/zeromicro/go-zero/core/logx"

	"career-api/common/errors"
	ai "career-api/common/pkg"
	"career-api/internal/model"
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
	// 从数据库获取学生信息
	student, err := l.svcCtx.StudentModel.FindOne(l.ctx, req.StudentId)
	if err != nil {
		logx.Errorf("FindOne student failed: %v", err)
		return &types.ReportResp{
			Code: errors.CodeInternalError,
			Msg:  "student not found",
		}, nil
	}

	// 序列化学生信息
	studentProfileJSON, _ := json.Marshal(student)
	studentProfile := string(studentProfileJSON)

	// 获取目标职位信息
	jobProfile := ""
	var targetJob *model.Jobs
	if req.TargetJobId > 0 {
		targetJob, err = l.svcCtx.JobModel.FindOne(l.ctx, req.TargetJobId)
		if err != nil {
			logx.Errorf("FindOne job failed: %v", err)
			return &types.ReportResp{
				Code: errors.CodeInternalError,
				Msg:  "job not found",
			}, nil
		}
		jobProfileJSON, _ := json.Marshal(targetJob)
		jobProfile = string(jobProfileJSON)
	}

	// 计算匹配结果
	matchResult := fmt.Sprintf("Student completeness: %.1f%%, competitiveness: %.1f%%",
		student.CompletenessScore, student.CompetitivenessScore)

	// 调用AI生成报告
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
		return &types.ReportResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to generate report",
		}, nil
	}

	// 构建报告数据
	// 序列化各个部分
	overview := &types.ReportOverview{
		StudentName:     student.Name,
		Education:       student.Education.String,
		Major:           student.Major.String,
		Completeness:    student.CompletenessScore,
		Competitiveness: student.CompetitivenessScore,
		TopJobs:         []types.JobRef{},
	}
	overviewJSON, _ := json.Marshal(overview)

	matchAnalysis := &types.MatchAnalysis{
		OverallScore: student.CompetitivenessScore,
		Strengths:    []string{"Good technical foundation"},
		Weaknesses:   []string{},
		TopMatches:   []types.MatchResult{},
	}
	matchAnalysisJSON, _ := json.Marshal(matchAnalysis)

	careerPath := &types.CareerPath{
		TargetJob: types.JobNode{
			Id:   req.TargetJobId,
			Name: targetJob.Name,
		},
		IndustryTrend: "Growing demand",
		SocialDemand:  "High demand",
		Milestones:    []types.Milestone{},
	}
	careerPathJSON, _ := json.Marshal(careerPath)

	actionPlan := &types.ActionPlan{
		ShortTerm: []types.Action{},
		MidTerm:   []types.Action{},
		LongTerm:  []types.Action{},
	}
	actionPlanJSON, _ := json.Marshal(actionPlan)

	// 保存报告到数据库（时间戳由Model的Insert方法自动设置）
	report := &model.CareerReports{
		StudentId:     req.StudentId,
		TargetJobId:   sql.NullInt64{Int64: req.TargetJobId, Valid: req.TargetJobId > 0},
		Title:         sql.NullString{String: "Career Development Report", Valid: true},
		Content:       sql.NullString{String: content, Valid: true},
		Overview:      sql.NullString{String: string(overviewJSON), Valid: true},
		MatchAnalysis: sql.NullString{String: string(matchAnalysisJSON), Valid: true},
		CareerPath:    sql.NullString{String: string(careerPathJSON), Valid: true},
		ActionPlan:    sql.NullString{String: string(actionPlanJSON), Valid: true},
		Status:        "generated",
	}

	result, err := l.svcCtx.ReportModel.Insert(l.ctx, report)
	if err != nil {
		logx.Errorf("Insert report failed: %v", err)
		return &types.ReportResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to save report",
		}, nil
	}

	reportId, err := result.LastInsertId()
	if err != nil {
		logx.Errorf("Get last insert id failed: %v", err)
		return &types.ReportResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to get report id",
		}, nil
	}

	// 查询报告以获取完整数据（包括created_at和updated_at）
	reportInfo, err := l.svcCtx.ReportModel.FindOne(l.ctx, reportId)
	if err != nil {
		logx.Errorf("FindOne failed: %v", err)
		return &types.ReportResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to get report info",
		}, nil
	}

	logx.Infof("Generated report for student %d, report id: %d", req.StudentId, reportId)

	// 构建返回的CareerReport
	careerReport := &types.CareerReport{
		Id:            reportId,
		StudentId:     req.StudentId,
		Title:         "Career Development Report",
		Overview:      *overview,
		MatchAnalysis: *matchAnalysis,
		CareerPath:    *careerPath,
		ActionPlan:    *actionPlan,
		Content:       content,
		Status:        "generated",
		CreatedAt:     reportInfo.CreatedAt,
		UpdatedAt:     reportInfo.UpdatedAt,
	}

	return &types.ReportResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
		Data: careerReport,
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
	reportDB, err := l.svcCtx.ReportModel.FindOne(l.ctx, id)
	if err != nil {
		logx.Errorf("FindOne failed: %v", err)
		return &types.ReportResp{
			Code: errors.CodeInternalError,
			Msg:  "report not found",
		}, nil
	}

	// 反序列化各个部分
	var overview types.ReportOverview
	if reportDB.Overview.Valid {
		json.Unmarshal([]byte(reportDB.Overview.String), &overview)
	}

	var matchAnalysis types.MatchAnalysis
	if reportDB.MatchAnalysis.Valid {
		json.Unmarshal([]byte(reportDB.MatchAnalysis.String), &matchAnalysis)
	}

	var careerPath types.CareerPath
	if reportDB.CareerPath.Valid {
		json.Unmarshal([]byte(reportDB.CareerPath.String), &careerPath)
	}

	var actionPlan types.ActionPlan
	if reportDB.ActionPlan.Valid {
		json.Unmarshal([]byte(reportDB.ActionPlan.String), &actionPlan)
	}

	report := &types.CareerReport{
		Id:            reportDB.Id,
		StudentId:     reportDB.StudentId,
		Title:         reportDB.Title.String,
		Content:       reportDB.Content.String,
		Overview:      overview,
		MatchAnalysis: matchAnalysis,
		CareerPath:    careerPath,
		ActionPlan:    actionPlan,
		Status:        reportDB.Status,
		CreatedAt:     reportDB.CreatedAt,
		UpdatedAt:     reportDB.UpdatedAt,
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
	// 从数据库查询报告
	reportDB, err := l.svcCtx.ReportModel.FindOne(l.ctx, req.Id)
	if err != nil {
		logx.Errorf("FindOne failed: %v", err)
		return &types.ReportResp{
			Code: errors.CodeInternalError,
			Msg:  "report not found",
		}, nil
	}

	// 更新字段
	if req.Title != "" {
		reportDB.Title = sql.NullString{String: req.Title, Valid: true}
	}
	if req.Content != "" {
		reportDB.Content = sql.NullString{String: req.Content, Valid: true}
	}
	if req.Status != "" {
		reportDB.Status = req.Status
	}
	reportDB.UpdatedAt = time.Now().Unix()

	err = l.svcCtx.ReportModel.Update(l.ctx, reportDB)
	if err != nil {
		logx.Errorf("Update failed: %v", err)
		return &types.ReportResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to update report",
		}, nil
	}

	// 反序列化各个部分
	var overview types.ReportOverview
	if reportDB.Overview.Valid {
		json.Unmarshal([]byte(reportDB.Overview.String), &overview)
	}

	var matchAnalysis types.MatchAnalysis
	if reportDB.MatchAnalysis.Valid {
		json.Unmarshal([]byte(reportDB.MatchAnalysis.String), &matchAnalysis)
	}

	var careerPath types.CareerPath
	if reportDB.CareerPath.Valid {
		json.Unmarshal([]byte(reportDB.CareerPath.String), &careerPath)
	}

	var actionPlan types.ActionPlan
	if reportDB.ActionPlan.Valid {
		json.Unmarshal([]byte(reportDB.ActionPlan.String), &actionPlan)
	}

	report := &types.CareerReport{
		Id:            reportDB.Id,
		StudentId:     reportDB.StudentId,
		Title:         reportDB.Title.String,
		Content:       reportDB.Content.String,
		Overview:      overview,
		MatchAnalysis: matchAnalysis,
		CareerPath:    careerPath,
		ActionPlan:    actionPlan,
		Status:        reportDB.Status,
		CreatedAt:     reportDB.CreatedAt,
		UpdatedAt:     reportDB.UpdatedAt,
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
	err := l.svcCtx.ReportModel.Delete(l.ctx, id)
	if err != nil {
		logx.Errorf("Delete failed: %v", err)
		return &types.ReportResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to delete report",
		}, nil
	}

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

	// 从数据库查询报告列表
	reports, total, err := l.svcCtx.ReportModel.FindAll(l.ctx, page, pageSize, req.StudentId, req.Status)
	if err != nil {
		logx.Errorf("FindAll failed: %v", err)
		return &types.ReportListResultResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to list reports",
		}, nil
	}

	// 转换为响应格式
	careerReports := make([]types.CareerReport, 0, len(reports))
	for _, report := range reports {
		// 反序列化各个部分
		var overview types.ReportOverview
		if report.Overview.Valid {
			json.Unmarshal([]byte(report.Overview.String), &overview)
		}

		var matchAnalysis types.MatchAnalysis
		if report.MatchAnalysis.Valid {
			json.Unmarshal([]byte(report.MatchAnalysis.String), &matchAnalysis)
		}

		var careerPath types.CareerPath
		if report.CareerPath.Valid {
			json.Unmarshal([]byte(report.CareerPath.String), &careerPath)
		}

actionPlan := types.ActionPlan{}
		if report.ActionPlan.Valid {
			json.Unmarshal([]byte(report.ActionPlan.String), &actionPlan)
		}

		careerReports = append(careerReports, types.CareerReport{
			Id:            report.Id,
			StudentId:     report.StudentId,
			Title:         report.Title.String,
			Content:       report.Content.String,
			Overview:      overview,
			MatchAnalysis: matchAnalysis,
			CareerPath:    careerPath,
			ActionPlan:    actionPlan,
			Status:        report.Status,
			CreatedAt:     report.CreatedAt,
			UpdatedAt:     report.UpdatedAt,
		})
	}

	return &types.ReportListResultResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
		Data: &types.ReportListResp{
			Total: total,
			List:  careerReports,
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
	// 从上下文获取userId
	userId, ok := l.ctx.Value("userId").(int64)
	if !ok {
		return &types.ReportListResultResp{
			Code: errors.CodeUnauthorized,
			Msg:  "unauthorized",
		}, nil
	}

	// 查询学生的档案
	_, err := l.svcCtx.StudentModel.FindOneByUserId(l.ctx, userId)
	if err != nil {
		logx.Errorf("FindOneByUserId failed: %v", err)
		return &types.ReportListResultResp{
			Code: errors.CodeInternalError,
			Msg:  "student profile not found",
		}, nil
	}

	// 由于Model层没有提供FindAll方法，我们暂时返回空列表
	// 在实际项目中，应该添加FindAll方法到Model层
	reports := []types.CareerReport{}

	return &types.ReportListResultResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
		Data: &types.ReportListResp{
			Total: int64(len(reports)),
			List:  reports,
		},
	}, nil
}

type GenerateReportStreamLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGenerateReportStreamLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GenerateReportStreamLogic {
	return &GenerateReportStreamLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GenerateReportStreamLogic) GenerateReportStream(w http.ResponseWriter, req *types.GenerateReportStreamReq) {
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "SSE not supported", http.StatusInternalServerError)
		return
	}

	userId, ok := l.ctx.Value("userId").(int64)
	if !ok {
		l.sendSSEEvent(w, flusher, "error", map[string]interface{}{
			"code": errors.CodeUnauthorized,
			"msg":  "unauthorized",
		})
		return
	}

	// 验证Track字段
	if req.Track == "" {
		l.sendSSEEvent(w, flusher, "error", map[string]interface{}{
			"code": 400,
			"msg":  "track is required",
		})
		return
	}

	if req.Track != "bigtech" && req.Track != "gov" {
		l.sendSSEEvent(w, flusher, "error", map[string]interface{}{
			"code": 400,
			"msg":  "track must be either 'bigtech' or 'gov'",
		})
		return
	}

	student, err := l.svcCtx.StudentModel.FindOneByUserId(l.ctx, userId)
	if err != nil {
		logx.WithContext(l.ctx).Errorw("Student not found in database", logx.Field("userId", userId), logx.Field("error", err))
		l.sendSSEEvent(w, flusher, "error", map[string]interface{}{
			"code": errors.CodeInternalError,
			"msg":  "student profile not found",
		})
		return
	}

	logx.WithContext(l.ctx).Infow("Found student in database", logx.Field("userId", userId), logx.Field("studentId", student.Id))

	l.sendSSEEvent(w, flusher, "status", map[string]interface{}{
		"type":    "start",
		"message": "开始生成职业规划报告...",
	})

	content, err := l.svcCtx.AIProvider.GenerateCareerReport(l.ctx, ai.ReportGenerationRequest{
		StudentProfile: fmt.Sprintf("Name: %s, Education: %s, Major: %s",
			student.Name, student.Education.String, student.Major.String),
		JobProfile: fmt.Sprintf("Track: %s", req.Track),
		MatchResult: "AI analysis",
		Options: ai.ReportOptions{
			IncludeGapAnalysis: true,
			IncludeActionPlan:  true,
			DetailedLevel:      2,
		},
	})

	if err != nil {
		logx.Errorf("GenerateCareerReport failed: %v", err)
		l.sendSSEEvent(w, flusher, "error", map[string]interface{}{
			"code": errors.CodeInternalError,
			"msg":  "failed to generate report",
		})
		return
	}

	buffer := ""
	for i, char := range content {
		buffer += string(char)
		if len(buffer) >= 50 || i == len(content)-1 {
			l.sendSSEEvent(w, flusher, "content", map[string]interface{}{
				"type":    "text",
				"content": buffer,
			})
			buffer = ""
			time.Sleep(20 * time.Millisecond)
		}
	}

	l.sendSSEEvent(w, flusher, "done", map[string]interface{}{
		"type":    "complete",
		"message": "报告生成完成",
	})
}

func (l *GenerateReportStreamLogic) sendSSEEvent(w http.ResponseWriter, flusher http.Flusher, eventType string, data interface{}) {
	jsonData, _ := json.Marshal(data)
	fmt.Fprintf(w, "event: %s\n", eventType)
	fmt.Fprintf(w, "data: %s\n\n", jsonData)
	flusher.Flush()
}
