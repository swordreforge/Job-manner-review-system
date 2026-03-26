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

type CreateStudentLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewCreateStudentLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateStudentLogic {
	return &CreateStudentLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *CreateStudentLogic) CreateStudent(req *types.CreateStudentReq) (*types.StudentResp, error) {
	completeness := calculateCompleteness(req)
	competitiveness := calculateCompetitiveness(req)

	profile := &types.StudentProfile{
		Id:              time.Now().UnixNano(),
		UserId:          1,
		Name:            req.Name,
		Education:       req.Education,
		Major:           req.Major,
		GraduationYear:  req.GraduationYear,
		Skills:          req.Skills,
		Certificates:    req.Certificates,
		SoftSkills:      req.SoftSkills,
		Internship:      req.Internship,
		Projects:        req.Projects,
		Completeness:    completeness,
		Competitiveness: competitiveness,
		CreatedAt:       time.Now().Unix(),
		UpdatedAt:       time.Now().Unix(),
	}

	logx.Infof("Created student profile for: %s", profile.Name)

	return &types.StudentResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
		Data: profile,
	}, nil
}

func calculateCompleteness(req *types.CreateStudentReq) float64 {
	score := 0.0
	total := 7.0

	if req.Name != "" {
		score += 1
	}
	if req.Education != "" {
		score += 1
	}
	if req.Major != "" {
		score += 1
	}
	if len(req.Skills) > 0 {
		score += 1
	}
	if len(req.Certificates) > 0 {
		score += 1
	}
	if len(req.Internship) > 0 {
		score += 1
	}
	if len(req.Projects) > 0 {
		score += 1
	}

	return score / total * 100
}

func calculateCompetitiveness(req *types.CreateStudentReq) float64 {
	score := 50.0

	if len(req.Skills) > 5 {
		score += 10
	}
	if len(req.Certificates) > 3 {
		score += 10
	}
	if len(req.Internship) > 1 {
		score += 15
	}
	if len(req.Projects) > 2 {
		score += 15
	}

	return score
}

type UpdateStudentLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewUpdateStudentLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UpdateStudentLogic {
	return &UpdateStudentLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *UpdateStudentLogic) UpdateStudent(req *types.UpdateStudentReq) (*types.StudentResp, error) {
	if req.Id <= 0 {
		return &types.StudentResp{
			Code: errors.CodeInvalidParams,
			Msg:  "invalid student id",
		}, nil
	}

	completeness := calculateCompleteness(&types.CreateStudentReq{
		Name:         req.Name,
		Education:    req.Education,
		Major:        req.Major,
		Skills:       req.Skills,
		Certificates: req.Certificates,
		Internship:   req.Internship,
		Projects:     req.Projects,
	})

	profile := &types.StudentProfile{
		Id:             req.Id,
		Name:           req.Name,
		Education:      req.Education,
		Major:          req.Major,
		GraduationYear: req.GraduationYear,
		Skills:         req.Skills,
		Certificates:   req.Certificates,
		SoftSkills:     req.SoftSkills,
		Internship:     req.Internship,
		Projects:       req.Projects,
		Completeness:   completeness,
		UpdatedAt:      time.Now().Unix(),
	}

	return &types.StudentResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
		Data: profile,
	}, nil
}

type GetStudentLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetStudentLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetStudentLogic {
	return &GetStudentLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetStudentLogic) GetStudent(id int64) (*types.StudentResp, error) {
	profile := &types.StudentProfile{
		Id:             id,
		UserId:         1,
		Name:           "Zhang San",
		Education:      "Bachelor",
		Major:          "Computer Science",
		GraduationYear: 2025,
		Skills: []types.StudentSkill{
			{Name: "Go", Level: 4, Years: 2},
			{Name: "Python", Level: 3, Years: 1},
		},
		Certificates: []types.StudentCert{
			{Name: "AWS Certified", Level: "Associate", Year: 2024},
		},
		SoftSkills: types.SoftSkills{
			Innovation:    4,
			Learning:      5,
			Pressure:      4,
			Communication: 4,
			Teamwork:      5,
		},
		Internship: []types.Internship{
			{Company: "Tech Corp", Position: "Software Engineer Intern", Duration: 3},
		},
		Completeness:    85.0,
		Competitiveness: 72.5,
		CreatedAt:       time.Now().Unix(),
		UpdatedAt:       time.Now().Unix(),
	}

	return &types.StudentResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
		Data: profile,
	}, nil
}

type DeleteStudentLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewDeleteStudentLogic(ctx context.Context, svcCtx *svc.ServiceContext) *DeleteStudentLogic {
	return &DeleteStudentLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *DeleteStudentLogic) DeleteStudent(id int64) (*types.StudentResp, error) {
	return &types.StudentResp{
		Code: errors.CodeSuccess,
		Msg:  "deleted successfully",
	}, nil
}

type ListStudentsLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewListStudentsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListStudentsLogic {
	return &ListStudentsLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ListStudentsLogic) ListStudents(req *types.StudentListReq) (*types.StudentListResultResp, error) {
	page := req.Page
	if page <= 0 {
		page = 1
	}
	pageSize := req.PageSize
	if pageSize <= 0 {
		pageSize = 10
	}

	profiles := make([]types.StudentProfile, 0, pageSize)
	for i := 0; i < pageSize; i++ {
		profiles = append(profiles, types.StudentProfile{
			Id:              int64(page*pageSize + i),
			UserId:          1,
			Name:            "Student " + stringx.RandId(),
			Education:       req.Education,
			Major:           req.Major,
			GraduationYear:  2025,
			Completeness:    float64(rand.Intn(41) + 60),
			Competitiveness: float64(rand.Intn(51) + 50),
			CreatedAt:       time.Now().Unix(),
			UpdatedAt:       time.Now().Unix(),
		})
	}

	return &types.StudentListResultResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
		Data: &types.StudentListResp{
			Total: 100,
			List:  profiles,
		},
	}, nil
}

type UploadResumeLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewUploadResumeLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UploadResumeLogic {
	return &UploadResumeLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *UploadResumeLogic) UploadResume(req *types.ResumeUploadReq) (*types.StudentResp, error) {
	_, err := l.svcCtx.AIProvider.GenerateStudentProfile(l.ctx, req.FileContent)
	if err != nil {
		logx.Errorf("UploadResume failed: %v", err)
		return &types.StudentResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to process resume",
		}, nil
	}

	profile := &types.StudentProfile{
		Id:              time.Now().UnixNano(),
		UserId:          1,
		Name:            "Extracted from resume",
		Completeness:    75.0,
		Competitiveness: 65.0,
		CreatedAt:       time.Now().Unix(),
		UpdatedAt:       time.Now().Unix(),
	}

	return &types.StudentResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
		Data: profile,
	}, nil
}

type GenerateProfileLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGenerateProfileLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GenerateProfileLogic {
	return &GenerateProfileLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GenerateProfileLogic) GenerateProfile(req *types.GenerateProfileReq) (*types.StudentResp, error) {
	_, err := l.svcCtx.AIProvider.GenerateStudentProfile(l.ctx, req.ResumeContent)
	if err != nil {
		logx.Errorf("GenerateProfile failed: %v", err)
		return &types.StudentResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to generate profile",
		}, nil
	}

	profile := &types.StudentProfile{
		Id:              time.Now().UnixNano(),
		UserId:          1,
		Name:            "Generated Profile",
		Completeness:    80.0,
		Competitiveness: 70.0,
		CreatedAt:       time.Now().Unix(),
		UpdatedAt:       time.Now().Unix(),
	}

	return &types.StudentResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
		Data: profile,
	}, nil
}

type GetMyProfileLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetMyProfileLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetMyProfileLogic {
	return &GetMyProfileLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetMyProfileLogic) GetMyProfile() (*types.StudentResp, error) {
	profile := &types.StudentProfile{
		Id:             1,
		UserId:         1,
		Name:           "Current User",
		Education:      "Bachelor",
		Major:          "Computer Science",
		GraduationYear: 2025,
		Skills: []types.StudentSkill{
			{Name: "Go", Level: 4, Years: 2},
		},
		Completeness:    85.0,
		Competitiveness: 75.0,
		CreatedAt:       time.Now().Unix(),
		UpdatedAt:       time.Now().Unix(),
	}

	return &types.StudentResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
		Data: profile,
	}, nil
}
