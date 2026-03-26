// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package graph

import (
	"context"

	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetPromotionPathLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// Get promotion path for a job
func NewGetPromotionPathLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetPromotionPathLogic {
	return &GetPromotionPathLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetPromotionPathLogic) GetPromotionPath(req *types.JobGraphReq) (resp *types.PromotionPathResp, err error) {
	// todo: add your logic here and delete this line

	return
}
