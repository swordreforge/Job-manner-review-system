// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package match

import (
	"context"

	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type MatchStudentJobsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// Match student to multiple jobs
func NewMatchStudentJobsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *MatchStudentJobsLogic {
	return &MatchStudentJobsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *MatchStudentJobsLogic) MatchStudentJobs(req *types.MatchListReq) (resp *types.MatchListResp, err error) {
	// todo: add your logic here and delete this line

	return
}
