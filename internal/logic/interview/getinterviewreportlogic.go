package interview

import (
	"context"
	"encoding/json"

	"github.com/zeromicro/go-zero/core/logx"

	"career-api/common/errors"
	"career-api/internal/svc"
	"career-api/internal/types"
)

type GetInterviewReportLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetInterviewReportLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetInterviewReportLogic {
	return &GetInterviewReportLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetInterviewReportLogic) GetInterviewReport(req *types.GetInterviewReportReq) (*types.InterviewReportResp, error) {
	// 获取用户ID
	userId, ok := l.ctx.Value("userId").(int64)
	if !ok {
		return &types.InterviewReportResp{
			Code: errors.CodeUnauthorized,
			Msg:  "unauthorized",
		}, nil
	}

	// 验证session权限
	_, err := l.svcCtx.InterviewSessionsModel.FindOneByUserId(l.ctx, userId, req.Id)
	if err != nil {
		logx.WithContext(l.ctx).Errorf("Failed to get interview session: %v", err)
		return &types.InterviewReportResp{
			Code: errors.CodeNotFound,
			Msg:  "session not found",
		}, nil
	}

	// 获取报告
	report, err := l.svcCtx.InterviewReportsModel.FindBySessionId(l.ctx, req.Id)
	if err != nil {
		logx.WithContext(l.ctx).Errorf("Failed to get interview report: %v", err)
		return &types.InterviewReportResp{
			Code: errors.CodeNotFound,
			Msg:  "report not found",
		}, nil
	}

	// 解析JSON字段
	var strengths, weaknesses, suggestions []string
	if report.Strengths.Valid {
		json.Unmarshal([]byte(report.Strengths.String), &strengths)
	}
	if report.Weaknesses.Valid {
		json.Unmarshal([]byte(report.Weaknesses.String), &weaknesses)
	}
	if report.ImprovementSuggestions.Valid {
		json.Unmarshal([]byte(report.ImprovementSuggestions.String), &suggestions)
	}

	return &types.InterviewReportResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
		Data: &types.InterviewReport{
			Id:                    report.Id,
			SessionId:             report.SessionId,
			UserId:                report.UserId,
			OverallScore:          report.OverallScore,
			SkillScore:            getValidFloat64(report.SkillScore),
			CommunicationScore:    getValidFloat64(report.CommunicationScore),
			LogicScore:            getValidFloat64(report.LogicScore),
			ConfidenceScore:       getValidFloat64(report.ConfidenceScore),
			Strengths:             strengths,
			Weaknesses:            weaknesses,
			ImprovementSuggestions: suggestions,
			Summary:               getValidString(report.Summary),
			CreatedAt:             report.CreatedAt,
		},
	}, nil
}