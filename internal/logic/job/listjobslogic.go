// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package job

import (
	"context"
	"encoding/json"

	"career-api/common/errors"
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
	page := req.Page
	if page <= 0 {
		page = 1
	}
	pageSize := req.PageSize
	if pageSize <= 0 {
		pageSize = 10
	}

	// 从数据库查询职位列表
	jobs, total, err := l.svcCtx.JobModel.FindAll(l.ctx, page, pageSize, req.Industry, req.Category)
	if err != nil {
		logx.Errorf("FindAll failed: %v", err)
		return &types.JobListResultResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to list jobs",
		}, nil
	}

	// 转换为响应格式
	jobProfiles := make([]types.JobProfile, 0, len(jobs))
	for _, job := range jobs {
		// 反序列化JSON字段
		var skills []types.Skill
		var certificates []string
		var softSkills types.SoftSkills
		var requirements types.Requirements

		if job.Skills.Valid {
			json.Unmarshal([]byte(job.Skills.String), &skills)
		}
		if job.Certificates.Valid {
			json.Unmarshal([]byte(job.Certificates.String), &certificates)
		}
		if job.SoftSkills.Valid {
			json.Unmarshal([]byte(job.SoftSkills.String), &softSkills)
		}
		if job.Requirements.Valid {
			json.Unmarshal([]byte(job.Requirements.String), &requirements)
		}

		jobProfiles = append(jobProfiles, types.JobProfile{
			Id:              job.Id,
			Name:            job.Name,
			Description:     job.Description.String,
			Company:         job.Company.String,
			Industry:        job.Industry.String,
			Location:        job.Location.String,
			SalaryRange:     job.SalaryRange.String,
			Skills:          skills,
			Certificates:    certificates,
			SoftSkills:      softSkills,
			Requirements:    requirements,
			GrowthPotential: job.GrowthPotential.String,
			CreatedAt:       job.CreatedAt,
			UpdatedAt:       job.UpdatedAt,
		})
	}

	result := &types.JobListResultResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
	}

	if len(jobProfiles) > 0 || total > 0 {
		result.Data = &types.JobListResp{
			Total: total,
			List:  jobProfiles,
		}
	}

	return result, nil
}
