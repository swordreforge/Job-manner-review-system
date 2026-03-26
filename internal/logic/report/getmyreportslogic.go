// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package report

import (
	"context"

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
	// todo: add your logic here and delete this line

	return
}
