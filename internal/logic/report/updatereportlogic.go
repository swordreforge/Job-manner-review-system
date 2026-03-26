// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package report

import (
	"context"

	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type UpdateReportLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// Update report
func NewUpdateReportLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UpdateReportLogic {
	return &UpdateReportLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *UpdateReportLogic) UpdateReport(req *types.UpdateReportReq) (resp *types.ReportResp, err error) {
	// todo: add your logic here and delete this line

	return
}
