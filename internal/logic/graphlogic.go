package logic

import (
	"context"
	"math/rand"
	"time"

	"github.com/zeromicro/go-zero/core/logx"

	"career-api/common/errors"
	"career-api/internal/svc"
	"career-api/internal/types"
)

type GetPromotionPathLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetPromotionPathLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetPromotionPathLogic {
	return &GetPromotionPathLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetPromotionPathLogic) GetPromotionPath(req *types.JobGraphReq) (*types.PromotionPathResp, error) {
	promotionPath := &types.PromotionPath{
		JobId:   req.JobId,
		JobName: "Software Engineer",
		NextJobs: []types.JobNode{
			{
				Id:          req.JobId + 1,
				Name:        "Senior Software Engineer",
				Level:       2,
				Description: "Lead technical development",
				Skills:      []string{"Architecture", "Leadership"},
			},
			{
				Id:          req.JobId + 2,
				Name:        "Tech Lead",
				Level:       3,
				Description: "Lead engineering team",
				Skills:      []string{"Management", "Strategy"},
			},
			{
				Id:          req.JobId + 3,
				Name:        "Engineering Manager",
				Level:       4,
				Description: "Manage engineering department",
				Skills:      []string{"Leadership", "Planning"},
			},
		},
	}

	return &types.PromotionPathResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
		Data: promotionPath,
	}, nil
}

type GetTransferPathsLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetTransferPathsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetTransferPathsLogic {
	return &GetTransferPathsLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetTransferPathsLogic) GetTransferPaths(req *types.JobGraphReq) (*types.TransferPathsResp, error) {
	paths := []types.TransferPath{
		{
			FromJob: types.JobNode{
				Id:   req.JobId,
				Name: "Software Engineer",
			},
			ToJob: types.JobNode{
				Id:          101,
				Name:        "DevOps Engineer",
				Description: "Infrastructure and deployment",
				Skills:      []string{"Docker", "Kubernetes", "CI/CD"},
			},
			MatchScore:     65.5,
			TransferSkills: []string{"Linux", "Scripting", "Cloud"},
			LearningPath:   []string{"Learn Docker", "Learn Kubernetes", "Learn CI/CD tools"},
		},
		{
			FromJob: types.JobNode{
				Id:   req.JobId,
				Name: "Software Engineer",
			},
			ToJob: types.JobNode{
				Id:          102,
				Name:        "Data Engineer",
				Description: "Data pipeline and processing",
				Skills:      []string{"Python", "SQL", "Spark"},
			},
			MatchScore:     58.0,
			TransferSkills: []string{"Programming", "Problem Solving"},
			LearningPath:   []string{"Learn SQL", "Learn Python for Data", "Learn Big Data tools"},
		},
		{
			FromJob: types.JobNode{
				Id:   req.JobId,
				Name: "Software Engineer",
			},
			ToJob: types.JobNode{
				Id:          103,
				Name:        "Product Manager",
				Description: "Product strategy and management",
				Skills:      []string{"Strategy", "Communication", "Analytics"},
			},
			MatchScore:     45.0,
			TransferSkills: []string{"Communication", "Problem Solving"},
			LearningPath:   []string{"Learn product management", "Learn analytics tools", "Build portfolio"},
		},
	}

	return &types.TransferPathsResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
		Data: paths,
	}, nil
}

type GetAllPathsLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetAllPathsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetAllPathsLogic {
	return &GetAllPathsLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetAllPathsLogic) GetAllPaths(req *types.JobGraphReq) (*types.AllPathsResp, error) {
	promotionPaths := []types.PromotionPath{
		{
			JobId:   req.JobId,
			JobName: "Software Engineer",
			NextJobs: []types.JobNode{
				{Id: req.JobId + 1, Name: "Senior Software Engineer", Level: 2},
				{Id: req.JobId + 2, Name: "Tech Lead", Level: 3},
			},
		},
	}

	transferPaths := []types.TransferPath{
		{
			FromJob:    types.JobNode{Id: req.JobId, Name: "Software Engineer"},
			ToJob:      types.JobNode{Id: 201, Name: "DevOps Engineer"},
			MatchScore: 65.5,
		},
		{
			FromJob:    types.JobNode{Id: req.JobId, Name: "Software Engineer"},
			ToJob:      types.JobNode{Id: 202, Name: "Data Engineer"},
			MatchScore: 58.0,
		},
	}

	return &types.AllPathsResp{
		Code:           errors.CodeSuccess,
		Msg:            "success",
		PromotionPaths: promotionPaths,
		TransferPaths:  transferPaths,
	}, nil
}

type GetRelatedJobsLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetRelatedJobsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetRelatedJobsLogic {
	return &GetRelatedJobsLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetRelatedJobsLogic) GetRelatedJobs(req *types.RelatedJobsReq) (*types.JobListResultResp, error) {
	jobs := make([]types.JobProfile, 0, 5)
	for i := 0; i < 5; i++ {
		jobs = append(jobs, types.JobProfile{
			Id:       int64(300 + i),
			Name:     "Related Job " + string(rune('A'+i)),
			Industry: "Technology",
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

	logx.Infof("GetRelatedJobs for job %d, type: %s", req.JobId, req.Type)

	return &types.JobListResultResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
		Data: &types.JobListResp{
			Total: 5,
			List:  jobs,
		},
	}, nil
}
