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
	// 获取晋升路径
	promotionResp, err := l.GetPromotionPath(req)
	if err != nil {
		logx.Errorf("Failed to get promotion path: %v", err)
		return &types.AllPathsResp{
			Code: 500,
			Msg:  "获取晋升路径失败",
		}, nil
	}

	// 获取换岗路径
	transferResp, err := l.GetTransferPaths(req)
	if err != nil {
		logx.Errorf("Failed to get transfer paths: %v", err)
		return &types.AllPathsResp{
			Code: 500,
			Msg:  "获取换岗路径失败",
		}, nil
	}

	// 构建响应
	promotionPaths := make([]types.PromotionPath, 0)
	if promotionResp.Data != nil {
		promotionPaths = append(promotionPaths, *promotionResp.Data)
	}

	transferPaths := make([]types.TransferPath, 0)
	if transferResp.Data != nil {
		transferPaths = transferResp.Data
	}

	return &types.AllPathsResp{
		Code:           0,
		Msg:            "success",
		PromotionPaths: promotionPaths,
		TransferPaths:  transferPaths,
	}, nil
}

// GetPromotionPath 获取晋升路径
func (l *GetAllPathsLogic) GetPromotionPath(req *types.JobGraphReq) (*types.PromotionPathResp, error) {
	promotionLogic := NewGetPromotionPathLogic(l.ctx, l.svcCtx)
	return promotionLogic.GetPromotionPath(req)
}

// GetTransferPath 获取换岗路径
func (l *GetAllPathsLogic) GetTransferPaths(req *types.JobGraphReq) (*types.TransferPathsResp, error) {
	transferLogic := NewGetTransferPathsLogic(l.ctx, l.svcCtx)
	return transferLogic.GetTransferPaths(req)
}
