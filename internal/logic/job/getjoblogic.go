package job

import (
	"context"
	"encoding/json"

	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetJobLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
	id     int64
}

func NewGetJobLogic(ctx context.Context, svcCtx *svc.ServiceContext, id int64) *GetJobLogic {
	return &GetJobLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
		id:     id,
	}
}

func (l *GetJobLogic) GetJob() (resp *types.JobResp, err error) {
	job, err := l.svcCtx.JobModel.FindOne(l.ctx, l.id)
	if err != nil {
		return nil, err
	}

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

	var updateDate string
	if job.UpdateDate.Valid {
		updateDate = job.UpdateDate.Time.Format("2006-01-02")
	}

	jobProfile := &types.JobProfile{
		Id:                   job.Id,
		Name:                 job.Name,
		Description:          job.Description.String,
		Company:              job.Company.String,
		Industry:             job.Industry.String,
		Category:             job.Category.String,
		Location:             job.Location.String,
		SalaryRange:          job.SalaryRange.String,
		JobCode:              job.JobCode.String,
		CompanyScale:         job.CompanyScale.String,
		CompanyFundingStatus: job.CompanyFundingStatus.String,
		CompanyDescription:   job.CompanyDescription.String,
		SourceUrl:            job.SourceUrl.String,
		UpdateDate:           updateDate,
		JobDetail:            job.JobDetail.String,
		Skills:               skills,
		Certificates:         certificates,
		SoftSkills:           softSkills,
		GrowthPotential:      job.GrowthPotential.String,
		Requirements:         requirements,
		CreatedAt:            job.CreatedAt,
		UpdatedAt:            job.UpdatedAt,
	}

	return &types.JobResp{
		Code: 0,
		Msg:  "success",
		Data: jobProfile,
	}, nil
}
