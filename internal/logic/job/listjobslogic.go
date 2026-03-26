// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package job

import (
	"context"

	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListJobsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// List job profiles
func NewListJobsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListJobsLogic {
	return &ListJobsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ListJobsLogic) ListJobs(req *types.JobListReq) (resp *types.JobListResultResp, err error) {
	// todo: add your logic here and delete this line

	return
}
