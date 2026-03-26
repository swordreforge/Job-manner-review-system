// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package report

import (
	"context"

	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type ExportReportLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// Export report
func NewExportReportLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ExportReportLogic {
	return &ExportReportLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ExportReportLogic) ExportReport(req *types.ExportReq) (resp *types.ExportResp, err error) {
	// todo: add your logic here and delete this line

	return
}
