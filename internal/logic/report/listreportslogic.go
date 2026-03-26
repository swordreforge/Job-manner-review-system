// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package report

import (
	"context"

	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListReportsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// List reports
func NewListReportsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListReportsLogic {
	return &ListReportsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ListReportsLogic) ListReports(req *types.ReportListReq) (resp *types.ReportListResultResp, err error) {
	// todo: add your logic here and delete this line

	return
}
