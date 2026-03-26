package logic

import (
	"context"
	"math/rand"
	"time"

	"github.com/zeromicro/go-zero/core/logx"
	"github.com/zeromicro/go-zero/core/stringx"

	"career-api/common/errors"
	"career-api/internal/svc"
	"career-api/internal/types"
)

type CreateJobLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewCreateJobLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateJobLogic {
	return &CreateJobLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *CreateJobLogic) CreateJob(req *types.CreateJobReq) (*types.JobResp, error) {
	if req.Name == "" {
		return &types.JobResp{
			Code: errors.CodeInvalidParams,
			Msg:  "job name is required",
		}, nil
	}

	job := &types.JobProfile{
		Id:           time.Now().UnixNano(),
		Name:         req.Name,
		Description:  req.Description,
		Company:      req.Company,
		Industry:     req.Industry,
		Location:     req.Location,
		SalaryRange:  req.SalaryRange,
		Skills:       req.Skills,
		Certificates: req.Certificates,
		SoftSkills:   req.SoftSkills,
		Requirements: req.Requirements,
		CreatedAt:    time.Now().Unix(),
		UpdatedAt:    time.Now().Unix(),
	}

	logx.Infof("Created job: %s", job.Name)

	return &types.JobResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
		Data: job,
	}, nil
}

type UpdateJobLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewUpdateJobLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UpdateJobLogic {
	return &UpdateJobLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *UpdateJobLogic) UpdateJob(req *types.UpdateJobReq) (*types.JobResp, error) {
	if req.Id <= 0 {
		return &types.JobResp{
			Code: errors.CodeInvalidParams,
			Msg:  "invalid job id",
		}, nil
	}

	job := &types.JobProfile{
		Id:           req.Id,
		Name:         req.Name,
		Description:  req.Description,
		Company:      req.Company,
		Industry:     req.Industry,
		Location:     req.Location,
		SalaryRange:  req.SalaryRange,
		Skills:       req.Skills,
		Certificates: req.Certificates,
		SoftSkills:   req.SoftSkills,
		Requirements: req.Requirements,
		UpdatedAt:    time.Now().Unix(),
	}

	return &types.JobResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
		Data: job,
	}, nil
}

type GetJobLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetJobLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetJobLogic {
	return &GetJobLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetJobLogic) GetJob(id int64) (*types.JobResp, error) {
	job := &types.JobProfile{
		Id:          id,
		Name:        "Senior Software Engineer",
		Description: "Develop and maintain software systems",
		Company:     "Tech Corp",
		Industry:    "Technology",
		Location:    "Beijing",
		SalaryRange: "30k-50k",
		Skills: []types.Skill{
			{Name: "Go", Level: 4, Required: true},
			{Name: "Python", Level: 3, Required: false},
		},
		Certificates: []string{"AWS Certified"},
		SoftSkills: types.SoftSkills{
			Innovation:    4,
			Learning:      5,
			Pressure:      4,
			Communication: 4,
			Teamwork:      5,
		},
		Requirements: types.Requirements{
			Education:  "Bachelor",
			Experience: "3+ years",
			Internship: "Preferred",
		},
		CreatedAt: time.Now().Unix(),
		UpdatedAt: time.Now().Unix(),
	}

	return &types.JobResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
		Data: job,
	}, nil
}

type DeleteJobLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewDeleteJobLogic(ctx context.Context, svcCtx *svc.ServiceContext) *DeleteJobLogic {
	return &DeleteJobLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *DeleteJobLogic) DeleteJob(id int64) (*types.JobResp, error) {
	return &types.JobResp{
		Code: errors.CodeSuccess,
		Msg:  "deleted successfully",
	}, nil
}

type ListJobsLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewListJobsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListJobsLogic {
	return &ListJobsLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ListJobsLogic) ListJobs(req *types.JobListReq) (*types.JobListResultResp, error) {
	page := req.Page
	if page <= 0 {
		page = 1
	}
	pageSize := req.PageSize
	if pageSize <= 0 {
		pageSize = 10
	}

	jobs := make([]types.JobProfile, 0, pageSize)
	for i := 0; i < pageSize; i++ {
		jobs = append(jobs, types.JobProfile{
			Id:          int64(page*pageSize + i),
			Name:        "Software Engineer " + stringx.RandId(),
			Industry:    req.Industry,
			SalaryRange: "20k-40k",
			SoftSkills: types.SoftSkills{
				Innovation:    rand.Intn(3) + 3,
				Learning:      rand.Intn(3) + 3,
				Pressure:      rand.Intn(3) + 3,
				Communication: rand.Intn(3) + 3,
				Teamwork:      rand.Intn(3) + 3,
			},
			CreatedAt: time.Now().Unix(),
			UpdatedAt: time.Now().Unix(),
		})
	}

	return &types.JobListResultResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
		Data: &types.JobListResp{
			Total: 100,
			List:  jobs,
		},
	}, nil
}

type GenerateJobProfileLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGenerateJobProfileLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GenerateJobProfileLogic {
	return &GenerateJobProfileLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GenerateJobProfileLogic) GenerateJobProfile(req *types.JobGenerateReq) (*types.JobResp, error) {
	prompt := "Generate a job profile for: " + req.PositionName
	if req.Industry != "" {
		prompt += " in the " + req.Industry + " industry"
	}
	if req.RawData != "" {
		prompt += "\n\nAdditional information:\n" + req.RawData
	}

	content, err := l.svcCtx.AIProvider.GenerateJobProfile(l.ctx, prompt)
	if err != nil {
		logx.Errorf("GenerateJobProfile failed: %v", err)
		return &types.JobResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to generate job profile",
		}, nil
	}

	job := &types.JobProfile{
		Id:          time.Now().UnixNano(),
		Name:        req.PositionName,
		Description: content,
		Industry:    req.Industry,
		Skills: []types.Skill{
			{Name: "Skill 1", Level: 3, Required: true},
		},
		SoftSkills: types.SoftSkills{
			Innovation:    4,
			Learning:      4,
			Pressure:      3,
			Communication: 4,
			Teamwork:      5,
		},
		CreatedAt: time.Now().Unix(),
		UpdatedAt: time.Now().Unix(),
	}

	return &types.JobResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
		Data: job,
	}, nil
}
