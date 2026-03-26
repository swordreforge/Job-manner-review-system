package logic

import (
	"context"
	"encoding/json"
	"math"

	"github.com/zeromicro/go-zero/core/logx"

	"career-api/common/errors"
	"career-api/internal/model"
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
	// 获取当前职位信息
	currentJob, err := l.svcCtx.JobModel.FindOne(l.ctx, req.JobId)
	if err != nil {
		logx.Errorf("FindOne failed: %v", err)
		return &types.JobListResultResp{
			Code: errors.CodeInternalError,
			Msg:  "job not found",
		}, nil
	}

	// 反序列化当前职位的技能
	var currentSkills []types.Skill
	if currentJob.Skills.Valid {
		json.Unmarshal([]byte(currentJob.Skills.String), &currentSkills)
	}

	// 反序列化当前职位的软技能
	var currentSoftSkills types.SoftSkills
	if currentJob.SoftSkills.Valid {
		json.Unmarshal([]byte(currentJob.SoftSkills.String), &currentSoftSkills)
	}

	// 获取所有职位
	allJobs, _, err := l.svcCtx.JobModel.FindAll(l.ctx, 1, 1000, "")
	if err != nil {
		logx.Errorf("FindAll failed: %v", err)
		return &types.JobListResultResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to get jobs",
		}, nil
	}

	// 计算每个职位与当前职位的相似度
	type jobSimilarity struct {
		job         *model.Jobs
		similarity  float64
	}
	similarJobs := make([]jobSimilarity, 0)

	for _, job := range allJobs {
		if job.Id == req.JobId {
			continue // 跳过当前职位
		}

		// 反序列化职位的技能
		var jobSkills []types.Skill
		if job.Skills.Valid {
			json.Unmarshal([]byte(job.Skills.String), &jobSkills)
		}

		// 反序列化职位的软技能
		var jobSoftSkills types.SoftSkills
		if job.SoftSkills.Valid {
			json.Unmarshal([]byte(job.SoftSkills.String), &jobSoftSkills)
		}

		// 计算相似度（基于技能和软技能）
		skillSimilarity := calculateJobSimilarity(currentSkills, jobSkills)
		softSkillSimilarity := calculateSoftSkillSimilarity(currentSoftSkills, jobSoftSkills)
		overallSimilarity := (skillSimilarity * 0.6 + softSkillSimilarity * 0.4)

		similarJobs = append(similarJobs, jobSimilarity{
			job:        job,
			similarity: overallSimilarity,
		})
	}

	// 按相似度排序
	for i := 0; i < len(similarJobs); i++ {
		for j := i + 1; j < len(similarJobs); j++ {
			if similarJobs[i].similarity < similarJobs[j].similarity {
				similarJobs[i], similarJobs[j] = similarJobs[j], similarJobs[i]
			}
		}
	}

	// 取前5个最相似的职位
	limit := 5
	if len(similarJobs) < limit {
		limit = len(similarJobs)
	}

	jobs := make([]types.JobProfile, 0, limit)
	for i := 0; i < limit; i++ {
		job := similarJobs[i].job

		// 反序列化职位信息
		var skills []types.Skill
		if job.Skills.Valid {
			json.Unmarshal([]byte(job.Skills.String), &skills)
		}

		var softSkills types.SoftSkills
		if job.SoftSkills.Valid {
			json.Unmarshal([]byte(job.SoftSkills.String), &softSkills)
		}

		var certificates []string
		if job.Certificates.Valid {
			json.Unmarshal([]byte(job.Certificates.String), &certificates)
		}

		var requirements types.Requirements
		if job.Requirements.Valid {
			json.Unmarshal([]byte(job.Requirements.String), &requirements)
		}

		jobs = append(jobs, types.JobProfile{
			Id:           job.Id,
			Name:         job.Name,
			Description:  job.Description.String,
			Company:      job.Company.String,
			Industry:     job.Industry.String,
			Location:     job.Location.String,
			SalaryRange:  job.SalaryRange.String,
			Skills:       skills,
			Certificates: certificates,
			SoftSkills:   softSkills,
			Requirements: requirements,
			CreatedAt:    job.CreatedAt,
			UpdatedAt:    job.UpdatedAt,
		})
	}

	logx.Infof("GetRelatedJobs for job %d, type: %s, found %d related jobs", req.JobId, req.Type, len(jobs))

	return &types.JobListResultResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
		Data: &types.JobListResp{
			Total: int64(len(jobs)),
			List:  jobs,
		},
	}, nil
}

// calculateJobSimilarity 计算职位技能相似度
func calculateJobSimilarity(skills1, skills2 []types.Skill) float64 {
	if len(skills1) == 0 && len(skills2) == 0 {
		return 100.0
	}

	skillMap1 := make(map[string]int)
	for _, skill := range skills1 {
		skillMap1[skill.Name] = skill.Level
	}

	skillMap2 := make(map[string]int)
	for _, skill := range skills2 {
		skillMap2[skill.Name] = skill.Level
	}

	commonSkills := 0
	allSkills := make(map[string]bool)

	for name := range skillMap1 {
		allSkills[name] = true
	}
	for name := range skillMap2 {
		allSkills[name] = true
	}

	for name := range allSkills {
		if _, exists := skillMap1[name]; exists {
			if _, exists := skillMap2[name]; exists {
				commonSkills++
			}
		}
	}

	if len(allSkills) == 0 {
		return 100.0
	}

	return float64(commonSkills) / float64(len(allSkills)) * 100
}

// calculateSoftSkillSimilarity 计算软技能相似度
func calculateSoftSkillSimilarity(skills1, skills2 types.SoftSkills) float64 {
	diff := math.Abs(float64(skills1.Innovation-skills2.Innovation)) +
		math.Abs(float64(skills1.Learning-skills2.Learning)) +
		math.Abs(float64(skills1.Pressure-skills2.Pressure)) +
		math.Abs(float64(skills1.Communication-skills2.Communication)) +
		math.Abs(float64(skills1.Teamwork-skills2.Teamwork))

	avgDiff := diff / 5.0
	maxDiff := 5.0

	similarity := (1.0 - avgDiff/maxDiff) * 100
	if similarity < 0 {
		similarity = 0
	}

	return similarity
}
