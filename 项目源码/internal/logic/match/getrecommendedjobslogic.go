// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package match

import (
	"context"

	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetRecommendedJobsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// Get recommended jobs for student
func NewGetRecommendedJobsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetRecommendedJobsLogic {
	return &GetRecommendedJobsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetRecommendedJobsLogic) GetRecommendedJobs(req *types.MatchListReq) (resp *types.MatchListResp, err error) {
	// todo: add your logic here and delete this line

	return
}
