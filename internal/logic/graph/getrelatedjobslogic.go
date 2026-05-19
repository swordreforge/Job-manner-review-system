// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package graph

import (
	"context"
	"encoding/json"
	"sort"
	"strings"

	"career-api/internal/model"
	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetRelatedJobsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetRelatedJobsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetRelatedJobsLogic {
	return &GetRelatedJobsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetRelatedJobsLogic) GetRelatedJobs(req *types.RelatedJobsReq) (*types.JobListResultResp, error) {
	currentJob, err := l.svcCtx.JobModel.FindOne(l.ctx, req.JobId)
	if err != nil || currentJob == nil {
		return &types.JobListResultResp{
			Code: 404,
			Msg:  "岗位不存在",
		}, nil
	}

	allJobs, _, err := l.svcCtx.JobModel.FindAll(l.ctx, 1, 500, "", "")
	if err != nil {
		return &types.JobListResultResp{
			Code: 500,
			Msg:  "获取岗位列表失败",
		}, nil
	}

	type scoredJob struct {
		job   *types.JobProfile
		score float64
	}

	var scores []scoredJob
	currentName := strings.ToLower(currentJob.Name)
	currentIndustry := strings.ToLower(currentJob.Industry.String)

	for _, j := range allJobs {
		if j.Id == req.JobId {
			continue
		}
		profile := convertToJobProfile(j)
		nameSim := calculateNameSimilarity(currentName, strings.ToLower(profile.Name))
		industrySim := calculateIndustrySimilarity(currentIndustry, strings.ToLower(profile.Industry))

		totalScore := nameSim*0.5 + industrySim*0.5
		if totalScore > 0.1 {
			scores = append(scores, scoredJob{job: profile, score: totalScore})
		}
	}

	sort.Slice(scores, func(i, j int) bool {
		return scores[i].score > scores[j].score
	})

	var results []types.JobProfile
	maxResults := 3
	if len(scores) < maxResults {
		maxResults = len(scores)
	}
	for i := 0; i < maxResults; i++ {
		results = append(results, *scores[i].job)
	}

	return &types.JobListResultResp{
		Code: 0,
		Msg:  "success",
		Data: &types.JobListResp{
			Total: int64(len(results)),
			List:  results,
		},
	}, nil
}

func convertToJobProfile(j *model.Jobs) *types.JobProfile {
	p := &types.JobProfile{
		Id:                   j.Id,
		Name:                 j.Name,
		Company:              j.Company.String,
		Industry:             j.Industry.String,
		Category:             j.Category.String,
		Location:             j.Location.String,
		SalaryRange:          j.SalaryRange.String,
		JobCode:              j.JobCode.String,
		CompanyScale:         j.CompanyScale.String,
		CompanyFundingStatus: j.CompanyFundingStatus.String,
		CompanyDescription:   j.CompanyDescription.String,
		SourceUrl:            j.SourceUrl.String,
		JobDetail:            j.JobDetail.String,
		GrowthPotential:      j.GrowthPotential.String,
		CreatedAt:            j.CreatedAt,
		UpdatedAt:            j.UpdatedAt,
	}
	if j.UpdateDate.Valid {
		p.UpdateDate = j.UpdateDate.Time.Format("2006-01-02")
	}
	if j.Skills.Valid && j.Skills.String != "" {
		var skills []types.Skill
		_ = json.Unmarshal([]byte(j.Skills.String), &skills)
		p.Skills = skills
	}
	if j.Certificates.Valid && j.Certificates.String != "" {
		var certs []string
		_ = json.Unmarshal([]byte(j.Certificates.String), &certs)
		p.Certificates = certs
	}
	if j.SoftSkills.Valid && j.SoftSkills.String != "" {
		var ss types.SoftSkills
		_ = json.Unmarshal([]byte(j.SoftSkills.String), &ss)
		p.SoftSkills = ss
	}
	if j.Requirements.Valid && j.Requirements.String != "" {
		var req types.Requirements
		_ = json.Unmarshal([]byte(j.Requirements.String), &req)
		p.Requirements = req
	}
	return p
}

func calculateNameSimilarity(s1, s2 string) float64 {
	if s1 == "" || s2 == "" {
		return 0
	}
	if s1 == s2 {
		return 1.0
	}
	if strings.Contains(s1, s2) || strings.Contains(s2, s1) {
		return 0.8
	}
	words1 := strings.Fields(s1)
	words2 := strings.Fields(s2)
	matchCount := 0
	for _, w1 := range words1 {
		for _, w2 := range words2 {
			if w1 == w2 {
				matchCount++
				break
			}
		}
	}
	totalWords := float64(len(words1) + len(words2))
	if totalWords == 0 {
		return 0
	}
	return float64(matchCount*2) / totalWords
}

func calculateIndustrySimilarity(s1, s2 string) float64 {
	if s1 == "" || s2 == "" {
		return 0
	}
	if s1 == s2 {
		return 1.0
	}
	parts1 := strings.Split(s1, ",")
	parts2 := strings.Split(s2, ",")
	set1 := make(map[string]bool)
	set2 := make(map[string]bool)
	for _, p := range parts1 {
		set1[strings.TrimSpace(p)] = true
	}
	for _, p := range parts2 {
		set2[strings.TrimSpace(p)] = true
	}
	matchCount := 0
	for p := range set1 {
		if set2[p] {
			matchCount++
		}
	}
	totalUnique := float64(len(set1) + len(set2))
	if totalUnique == 0 {
		return 0
	}
	return float64(matchCount*2) / totalUnique
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func levenshteinDistance(s1, s2 string) int {
	if len(s1) == 0 {
		return len(s2)
	}
	if len(s2) == 0 {
		return len(s1)
	}

	matrix := make([][]int, len(s1)+1)
	for i := range matrix {
		matrix[i] = make([]int, len(s2)+1)
	}
	for i := 0; i <= len(s1); i++ {
		matrix[i][0] = i
	}
	for j := 0; j <= len(s2); j++ {
		matrix[0][j] = j
	}
	for i := 1; i <= len(s1); i++ {
		for j := 1; j <= len(s2); j++ {
			cost := 1
			if s1[i-1] == s2[j-1] {
				cost = 0
			}
			matrix[i][j] = min(
				matrix[i-1][j]+1,
				min(matrix[i][j-1]+1, matrix[i-1][j-1]+cost),
			)
		}
	}
	return matrix[len(s1)][len(s2)]
}
