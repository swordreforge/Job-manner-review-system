// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package report

import (
	"context"

	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetReportLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// Get report by id
func NewGetReportLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetReportLogic {
	return &GetReportLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetReportLogic) GetReport() (resp *types.ReportResp, err error) {
	// todo: add your logic here and delete this line

	return
}
