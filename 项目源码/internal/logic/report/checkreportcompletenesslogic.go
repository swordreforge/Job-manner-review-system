// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package report

import (
	"context"

	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type CheckReportCompletenessLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// Check report completeness
func NewCheckReportCompletenessLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CheckReportCompletenessLogic {
	return &CheckReportCompletenessLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *CheckReportCompletenessLogic) CheckReportCompleteness() (resp *types.ReportResp, err error) {
	// todo: add your logic here and delete this line

	return
}
