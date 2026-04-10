// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package graph

import (
	"context"
	"encoding/json"

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
	// 获取当前岗位信息
	currentJob, err := l.svcCtx.JobModel.FindOne(l.ctx, req.JobId)
	if err != nil {
		logx.Errorf("Failed to find job %d: %v", req.JobId, err)
		return &types.PromotionPathResp{
			Code: 500,
			Msg:  "岗位不存在",
		}, nil
	}

	// 查询晋升路径
	paths, err := l.svcCtx.PromotionPathModel.FindByFromJob(l.ctx, req.JobId)
	if err != nil && err.Error() != "not found" {
		logx.Errorf("Failed to find promotion paths for job %d: %v", req.JobId, err)
		return &types.PromotionPathResp{
			Code: 500,
			Msg:  "查询晋升路径失败",
		}, nil
	}

	// 构建NextJobs列表
	nextJobs := make([]types.JobNode, 0, len(paths))
	for _, path := range paths {
		toJob, err := l.svcCtx.JobModel.FindOne(l.ctx, path.ToJobId)
		if err != nil {
			logx.Errorf("Failed to find target job %d: %v", path.ToJobId, err)
			continue
		}

		// 解析transfer skills
		var transferSkills []string
		if path.TransferSkills.Valid {
			json.Unmarshal([]byte(path.TransferSkills.String), &transferSkills)
		}

		nextJobs = append(nextJobs, types.JobNode{
			Id:     toJob.Id,
			Name:   toJob.Name,
			Level:  2,
			Skills: transferSkills,
		})
	}

	promotionPath := &types.PromotionPath{
		JobId:    currentJob.Id,
		JobName:  currentJob.Name,
		NextJobs: nextJobs,
	}

	return &types.PromotionPathResp{
		Code: 0,
		Msg:  "success",
		Data: promotionPath,
	}, nil
}
