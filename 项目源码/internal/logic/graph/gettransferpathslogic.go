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
	// 获取当前岗位信息
	currentJob, err := l.svcCtx.JobModel.FindOne(l.ctx, req.JobId)
	if err != nil {
		logx.Errorf("Failed to find job %d: %v", req.JobId, err)
		return &types.TransferPathsResp{
			Code: 500,
			Msg:  "岗位不存在",
		}, nil
	}

	// 查询换岗路径（包括作为from_job和to_job的所有路径）
	fromPaths, err := l.svcCtx.PromotionPathModel.FindByFromJob(l.ctx, req.JobId)
	if err != nil && err.Error() != "not found" {
		logx.Errorf("Failed to find transfer paths for job %d: %v", req.JobId, err)
		return &types.TransferPathsResp{
			Code: 500,
			Msg:  "查询换岗路径失败",
		}, nil
	}

	// 构建TransferPath列表
	transferPaths := make([]types.TransferPath, 0)

	// 添加from方向的换岗路径
	for _, path := range fromPaths {
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

		// 解析learning path
		var learningPath []string
		if path.LearningPath.Valid {
			json.Unmarshal([]byte(path.LearningPath.String), &learningPath)
		}

		matchScore := 0.0
		if path.MatchScore.Valid {
			matchScore = path.MatchScore.Float64
		}

		transferPaths = append(transferPaths, types.TransferPath{
			FromJob: types.JobNode{
				Id:   currentJob.Id,
				Name: currentJob.Name,
			},
			ToJob: types.JobNode{
				Id:     toJob.Id,
				Name:   toJob.Name,
				Skills: transferSkills,
			},
			MatchScore:     matchScore,
			TransferSkills: transferSkills,
			LearningPath:   learningPath,
		})
	}

	// 添加to方向的换岗路径（可以转换到当前岗位的岗位）
	toPaths, err := l.svcCtx.PromotionPathModel.FindByToJob(l.ctx, req.JobId)
	if err != nil && err.Error() != "not found" {
		logx.Errorf("Failed to find to-paths for job %d: %v", req.JobId, err)
		return &types.TransferPathsResp{
			Code: 500,
			Msg:  "查询换岗路径失败",
		}, nil
	}

	for _, path := range toPaths {
		fromJob, err := l.svcCtx.JobModel.FindOne(l.ctx, path.FromJobId)
		if err != nil {
			logx.Errorf("Failed to find source job %d: %v", path.FromJobId, err)
			continue
		}

		// 解析transfer skills
		var transferSkills []string
		if path.TransferSkills.Valid {
			json.Unmarshal([]byte(path.TransferSkills.String), &transferSkills)
		}

		// 解析learning path
		var learningPath []string
		if path.LearningPath.Valid {
			json.Unmarshal([]byte(path.LearningPath.String), &learningPath)
		}

		matchScore := 0.0
		if path.MatchScore.Valid {
			matchScore = path.MatchScore.Float64
		}

		transferPaths = append(transferPaths, types.TransferPath{
			FromJob: types.JobNode{
				Id:     fromJob.Id,
				Name:   fromJob.Name,
				Skills: transferSkills,
			},
			ToJob: types.JobNode{
				Id:   currentJob.Id,
				Name: currentJob.Name,
			},
			MatchScore:     matchScore,
			TransferSkills: transferSkills,
			LearningPath:   learningPath,
		})
	}

	return &types.TransferPathsResp{
		Code: 0,
		Msg:  "success",
		Data: transferPaths,
	}, nil
}