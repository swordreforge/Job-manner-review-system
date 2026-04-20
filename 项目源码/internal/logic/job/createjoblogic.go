package job

import (
	"context"
	"database/sql"
	"encoding/json"
	"time"

	"career-api/internal/model"
	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type CreateJobLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewCreateJobLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateJobLogic {
	return &CreateJobLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *CreateJobLogic) CreateJob(req *types.CreateJobReq) (resp *types.JobResp, err error) {
	if req.Name == "" {
		return &types.JobResp{
			Code: 400,
			Msg:  "岗位名称不能为空",
		}, nil
	}

	skillsJSON, _ := json.Marshal(req.Skills)
	certificatesJSON, _ := json.Marshal(req.Certificates)
	softSkillsJSON, _ := json.Marshal(req.SoftSkills)
	requirementsJSON, _ := json.Marshal(req.Requirements)

	now := time.Now().Unix()

	job := &model.Jobs{
		Name:                 req.Name,
		Description:          sql.NullString{String: req.Description, Valid: req.Description != ""},
		Company:              sql.NullString{String: req.Company, Valid: req.Company != ""},
		Industry:             sql.NullString{String: req.Industry, Valid: req.Industry != ""},
		Category:             sql.NullString{String: req.Category, Valid: req.Category != ""},
		Location:             sql.NullString{String: req.Location, Valid: req.Location != ""},
		SalaryRange:          sql.NullString{String: req.SalaryRange, Valid: req.SalaryRange != ""},
		JobCode:              sql.NullString{String: req.JobCode, Valid: req.JobCode != ""},
		CompanyScale:         sql.NullString{String: req.CompanyScale, Valid: req.CompanyScale != ""},
		CompanyFundingStatus: sql.NullString{String: req.CompanyFundingStatus, Valid: req.CompanyFundingStatus != ""},
		CompanyDescription:   sql.NullString{String: req.CompanyDescription, Valid: req.CompanyDescription != ""},
		SourceUrl:            sql.NullString{String: req.SourceUrl, Valid: req.SourceUrl != ""},
		JobDetail:            sql.NullString{String: req.JobDetail, Valid: req.JobDetail != ""},
		Skills:               sql.NullString{String: string(skillsJSON), Valid: len(req.Skills) > 0},
		Certificates:         sql.NullString{String: string(certificatesJSON), Valid: len(req.Certificates) > 0},
		SoftSkills:           sql.NullString{String: string(softSkillsJSON), Valid: true},
		Requirements:         sql.NullString{String: string(requirementsJSON), Valid: true},
		CreatedAt:            now,
		UpdatedAt:            now,
	}

	result, err := l.svcCtx.JobModel.Insert(l.ctx, job)
	if err != nil {
		logx.Errorf("Insert job failed: %v", err)
		return &types.JobResp{
			Code: 500,
			Msg:  "创建岗位失败",
		}, nil
	}

	jobId, err := result.LastInsertId()
	if err != nil {
		logx.Errorf("Get last insert id failed: %v", err)
		return &types.JobResp{
			Code: 500,
			Msg:  "获取岗位ID失败",
		}, nil
	}

	logx.Infof("Created job: %s (id: %d)", req.Name, jobId)

	return &types.JobResp{
		Code: 0,
		Msg:  "success",
		Data: &types.JobProfile{
			Id:                   jobId,
			Name:                 req.Name,
			Description:          req.Description,
			Company:              req.Company,
			Industry:             req.Industry,
			Category:             req.Category,
			Location:             req.Location,
			SalaryRange:          req.SalaryRange,
			JobCode:              req.JobCode,
			CompanyScale:         req.CompanyScale,
			CompanyFundingStatus: req.CompanyFundingStatus,
			CompanyDescription:   req.CompanyDescription,
			SourceUrl:            req.SourceUrl,
			UpdateDate:           req.UpdateDate,
			JobDetail:            req.JobDetail,
			Skills:               req.Skills,
			Certificates:         req.Certificates,
			SoftSkills:           req.SoftSkills,
			Requirements:         req.Requirements,
			CreatedAt:            now,
			UpdatedAt:            now,
		},
	}, nil
}