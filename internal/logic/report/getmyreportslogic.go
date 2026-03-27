// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package report

import (
	"context"

	"career-api/common/errors"
	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetMyReportsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// Get my reports
func NewGetMyReportsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetMyReportsLogic {
	return &GetMyReportsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetMyReportsLogic) GetMyReports() (resp *types.ReportListResultResp, err error) {
	// 从上下文获取 userId
	userId, ok := l.ctx.Value("userId").(int64)
	if !ok {
		return &types.ReportListResultResp{
			Code: errors.CodeUnauthorized,
			Msg:  "unauthorized",
		}, nil
	}

	// 获取分页参数（默认值）
	page := 1
	pageSize := 10

	// 查询该用户的报告列表
	reports, total, err := l.svcCtx.ReportModel.FindAll(
		l.ctx,
		page,
		pageSize,
		userId,
		"completed", // 只返回已完成的报告
	)
	if err != nil {
		logx.Errorf("GetMyReports failed: %v", err)
		return &types.ReportListResultResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to get reports",
		}, err
	}

	// 转换为响应格式
	list := make([]types.CareerReport, 0, len(reports))
	for _, report := range reports {
		list = append(list, types.CareerReport{
			Id:        report.Id,
			StudentId: report.StudentId,
			Title:     report.Title.String,
			Content:   report.Content.String,
			Status:    report.Status,
			CreatedAt: report.CreatedAt,
			UpdatedAt: report.UpdatedAt,
		})
	}

	return &types.ReportListResultResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
		Data: &types.ReportListResp{
			Total: total,
			List:  list,
		},
	}, nil
}
