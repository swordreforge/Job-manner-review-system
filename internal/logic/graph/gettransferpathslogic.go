// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package graph

import (
	"context"

	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetTransferPathsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// Get transfer paths for a job
func NewGetTransferPathsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetTransferPathsLogic {
	return &GetTransferPathsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetTransferPathsLogic) GetTransferPaths(req *types.JobGraphReq) (resp *types.TransferPathsResp, err error) {
	// todo: add your logic here and delete this line

	return
}
