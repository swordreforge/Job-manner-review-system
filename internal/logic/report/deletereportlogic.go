// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package report

import (
	"context"

	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type DeleteReportLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// Delete report
func NewDeleteReportLogic(ctx context.Context, svcCtx *svc.ServiceContext) *DeleteReportLogic {
	return &DeleteReportLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *DeleteReportLogic) DeleteReport() (resp *types.ReportResp, err error) {
	// todo: add your logic here and delete this line

	return
}
