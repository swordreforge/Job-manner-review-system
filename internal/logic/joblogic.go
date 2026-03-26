package logic

import (
	"context"
	"database/sql"
	"encoding/json"
	"math/rand"
	"time"

	"github.com/zeromicro/go-zero/core/logx"
	"github.com/zeromicro/go-zero/core/stringx"

	"career-api/common/errors"
	"career-api/internal/model"
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

	// 序列化JSON字段
	skillsJSON, _ := json.Marshal(req.Skills)
	certificatesJSON, _ := json.Marshal(req.Certificates)
	softSkillsJSON, _ := json.Marshal(req.SoftSkills)
	requirementsJSON, _ := json.Marshal(req.Requirements)

	now := time.Now().Unix()
	job := &model.Jobs{
		Name:            req.Name,
		Description:     sql.NullString{String: req.Description, Valid: req.Description != ""},
		Company:         sql.NullString{String: req.Company, Valid: req.Company != ""},
		Industry:        sql.NullString{String: req.Industry, Valid: req.Industry != ""},
		Location:        sql.NullString{String: req.Location, Valid: req.Location != ""},
		SalaryRange:     sql.NullString{String: req.SalaryRange, Valid: req.SalaryRange != ""},
		Skills:          sql.NullString{String: string(skillsJSON), Valid: len(req.Skills) > 0},
		Certificates:    sql.NullString{String: string(certificatesJSON), Valid: len(req.Certificates) > 0},
		SoftSkills:      sql.NullString{String: string(softSkillsJSON), Valid: true},
		Requirements:    sql.NullString{String: string(requirementsJSON), Valid: true},
		GrowthPotential: sql.NullString{String: "", Valid: false},
		CreatedAt:       now,
		UpdatedAt:       now,
	}

	result, err := l.svcCtx.JobModel.Insert(l.ctx, job)
	if err != nil {
		logx.Errorf("Insert job failed: %v", err)
		return &types.JobResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to create job",
		}, nil
	}

	jobId, err := result.LastInsertId()
	if err != nil {
		logx.Errorf("Get last insert id failed: %v", err)
		return &types.JobResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to get job id",
		}, nil
	}

	logx.Infof("Created job: %s (id: %d)", req.Name, jobId)

	return &types.JobResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
		Data: &types.JobProfile{
			Id:           jobId,
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
			CreatedAt:    now,
			UpdatedAt:    now,
		},
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

	// 从数据库查询职位信息
	job, err := l.svcCtx.JobModel.FindOne(l.ctx, req.Id)
	if err != nil {
		logx.Errorf("FindOne failed: %v", err)
		return &types.JobResp{
			Code: errors.CodeInternalError,
			Msg:  "job not found",
		}, nil
	}

	// 更新字段
	if req.Name != "" {
		job.Name = req.Name
	}
	if req.Description != "" {
		job.Description = sql.NullString{String: req.Description, Valid: true}
	}
	if req.Company != "" {
		job.Company = sql.NullString{String: req.Company, Valid: true}
	}
	if req.Industry != "" {
		job.Industry = sql.NullString{String: req.Industry, Valid: true}
	}
	if req.Location != "" {
		job.Location = sql.NullString{String: req.Location, Valid: true}
	}
	if req.SalaryRange != "" {
		job.SalaryRange = sql.NullString{String: req.SalaryRange, Valid: true}
	}
	if len(req.Skills) > 0 {
		skillsJSON, _ := json.Marshal(req.Skills)
		job.Skills = sql.NullString{String: string(skillsJSON), Valid: true}
	}
	if len(req.Certificates) > 0 {
		certificatesJSON, _ := json.Marshal(req.Certificates)
		job.Certificates = sql.NullString{String: string(certificatesJSON), Valid: true}
	}
	if req.SoftSkills.Innovation > 0 {
		softSkillsJSON, _ := json.Marshal(req.SoftSkills)
		job.SoftSkills = sql.NullString{String: string(softSkillsJSON), Valid: true}
	}
	if req.Requirements.Education != "" || req.Requirements.Experience != "" {
		requirementsJSON, _ := json.Marshal(req.Requirements)
		job.Requirements = sql.NullString{String: string(requirementsJSON), Valid: true}
	}
	job.UpdatedAt = time.Now().Unix()

	err = l.svcCtx.JobModel.Update(l.ctx, job)
	if err != nil {
		logx.Errorf("Update failed: %v", err)
		return &types.JobResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to update job",
		}, nil
	}

	// 反序列化返回数据
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

	return &types.JobResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
		Data: &types.JobProfile{
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
		},
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
	job, err := l.svcCtx.JobModel.FindOne(l.ctx, id)
	if err != nil {
		logx.Errorf("FindOne failed: %v", err)
		return &types.JobResp{
			Code: errors.CodeInternalError,
			Msg:  "job not found",
		}, nil
	}

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

	return &types.JobResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
		Data: &types.JobProfile{
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
		},
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
	err := l.svcCtx.JobModel.Delete(l.ctx, id)
	if err != nil {
		logx.Errorf("Delete failed: %v", err)
		return &types.JobResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to delete job",
		}, nil
	}

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

	aiCtx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	content, err := l.svcCtx.AIProvider.GenerateJobProfile(aiCtx, prompt)
	if err != nil {
		logx.Errorf("GenerateJobProfile failed: %v", err)
		return &types.JobResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to generate job profile: " + err.Error(),
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
