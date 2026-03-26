// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package graph

import (
	"context"

	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetRelatedJobsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// Get related jobs
func NewGetRelatedJobsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetRelatedJobsLogic {
	return &GetRelatedJobsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetRelatedJobsLogic) GetRelatedJobs(req *types.RelatedJobsReq) (resp *types.JobListResultResp, err error) {
	// todo: add your logic here and delete this line

	return
}
