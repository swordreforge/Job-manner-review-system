// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package graph

import (
	"context"

	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetAllPathsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// Get all job paths (promotion + transfer)
func NewGetAllPathsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetAllPathsLogic {
	return &GetAllPathsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetAllPathsLogic) GetAllPaths(req *types.JobGraphReq) (resp *types.AllPathsResp, err error) {
	// todo: add your logic here and delete this line

	return
}
