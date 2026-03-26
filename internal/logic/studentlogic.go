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
	if req.Name == "" {
		return &types.StudentResp{
			Code: errors.CodeInvalidParams,
			Msg:  "name is required",
		}, nil
	}

	// 从上下文获取userId
	userId, ok := l.ctx.Value("userId").(int64)
	if !ok {
		return &types.StudentResp{
			Code: errors.CodeUnauthorized,
			Msg:  "unauthorized",
		}, nil
	}

	completeness := calculateCompleteness(req)
	competitiveness := calculateCompetitiveness(req)

	// 序列化JSON字段
	skillsJSON, _ := json.Marshal(req.Skills)
	certificatesJSON, _ := json.Marshal(req.Certificates)
	softSkillsJSON, _ := json.Marshal(req.SoftSkills)
	internshipJSON, _ := json.Marshal(req.Internship)
	projectsJSON, _ := json.Marshal(req.Projects)

	now := time.Now().Unix()
	student := &model.Students{
		UserId:               userId,
		Name:                 req.Name,
		Education:            sql.NullString{String: req.Education, Valid: req.Education != ""},
		Major:                sql.NullString{String: req.Major, Valid: req.Major != ""},
		GraduationYear:       sql.NullInt64{Int64: int64(req.GraduationYear), Valid: req.GraduationYear > 0},
		Skills:               sql.NullString{String: string(skillsJSON), Valid: len(req.Skills) > 0},
		Certificates:         sql.NullString{String: string(certificatesJSON), Valid: len(req.Certificates) > 0},
		SoftSkills:           sql.NullString{String: string(softSkillsJSON), Valid: true},
		Internship:           sql.NullString{String: string(internshipJSON), Valid: len(req.Internship) > 0},
		Projects:             sql.NullString{String: string(projectsJSON), Valid: len(req.Projects) > 0},
		CompletenessScore:    completeness,
		CompetitivenessScore: competitiveness,
		CreatedAt:            now,
		UpdatedAt:            now,
	}

	result, err := l.svcCtx.StudentModel.InsertWithTimestamp(l.ctx, student)
	if err != nil {
		logx.Errorf("Insert student failed: %v", err)
		return &types.StudentResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to create student profile",
		}, nil
	}

	studentId, err := result.LastInsertId()
	if err != nil {
		logx.Errorf("Get last insert id failed: %v", err)
		return &types.StudentResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to get student id",
		}, nil
	}

	logx.Infof("Created student profile for: %s (id: %d)", req.Name, studentId)

	return &types.StudentResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
		Data: &types.StudentProfile{
			Id:              studentId,
			UserId:          userId,
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
			CreatedAt:       now,
			UpdatedAt:       now,
		},
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

	// 从数据库查询学生信息
	student, err := l.svcCtx.StudentModel.FindOne(l.ctx, req.Id)
	if err != nil {
		logx.Errorf("FindOne failed: %v", err)
		return &types.StudentResp{
			Code: errors.CodeInternalError,
			Msg:  "student not found",
		}, nil
	}

	// 检查权限
	userId, ok := l.ctx.Value("userId").(int64)
	if !ok || student.UserId != userId {
		return &types.StudentResp{
			Code: errors.CodeUnauthorized,
			Msg:  "unauthorized",
		}, nil
	}

	// 更新字段
	if req.Name != "" {
		student.Name = req.Name
	}
	if req.Education != "" {
		student.Education = sql.NullString{String: req.Education, Valid: true}
	}
	if req.Major != "" {
		student.Major = sql.NullString{String: req.Major, Valid: true}
	}
	if req.GraduationYear > 0 {
		student.GraduationYear = sql.NullInt64{Int64: int64(req.GraduationYear), Valid: true}
	}
	if len(req.Skills) > 0 {
		skillsJSON, _ := json.Marshal(req.Skills)
		student.Skills = sql.NullString{String: string(skillsJSON), Valid: true}
	}
	if len(req.Certificates) > 0 {
		certificatesJSON, _ := json.Marshal(req.Certificates)
		student.Certificates = sql.NullString{String: string(certificatesJSON), Valid: true}
	}
	if req.SoftSkills.Innovation > 0 {
		softSkillsJSON, _ := json.Marshal(req.SoftSkills)
		student.SoftSkills = sql.NullString{String: string(softSkillsJSON), Valid: true}
	}
	if len(req.Internship) > 0 {
		internshipJSON, _ := json.Marshal(req.Internship)
		student.Internship = sql.NullString{String: string(internshipJSON), Valid: true}
	}
	if len(req.Projects) > 0 {
		projectsJSON, _ := json.Marshal(req.Projects)
		student.Projects = sql.NullString{String: string(projectsJSON), Valid: true}
	}

	// 重新计算完整度
	completeness := calculateCompleteness(&types.CreateStudentReq{
		Name:         req.Name,
		Education:    student.Education.String,
		Major:        student.Major.String,
		Skills:       req.Skills,
		Certificates: req.Certificates,
		Internship:   req.Internship,
		Projects:     req.Projects,
	})
	student.CompletenessScore = completeness
	student.UpdatedAt = time.Now().Unix()

	err = l.svcCtx.StudentModel.Update(l.ctx, student)
	if err != nil {
		logx.Errorf("Update failed: %v", err)
		return &types.StudentResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to update student profile",
		}, nil
	}

	// 反序列化返回数据
	var skills []types.StudentSkill
	var certificates []types.StudentCert
	var softSkills types.SoftSkills
	var internship []types.Internship
	var projects []types.Project

	if student.Skills.Valid {
		json.Unmarshal([]byte(student.Skills.String), &skills)
	}
	if student.Certificates.Valid {
		json.Unmarshal([]byte(student.Certificates.String), &certificates)
	}
	if student.SoftSkills.Valid {
		json.Unmarshal([]byte(student.SoftSkills.String), &softSkills)
	}
	if student.Internship.Valid {
		json.Unmarshal([]byte(student.Internship.String), &internship)
	}
	if student.Projects.Valid {
		json.Unmarshal([]byte(student.Projects.String), &projects)
	}

	graduationYear := 0
	if student.GraduationYear.Valid {
		graduationYear = int(student.GraduationYear.Int64)
	}

	return &types.StudentResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
		Data: &types.StudentProfile{
			Id:              student.Id,
			UserId:          student.UserId,
			Name:            student.Name,
			Education:       student.Education.String,
			Major:           student.Major.String,
			GraduationYear:  graduationYear,
			Skills:          skills,
			Certificates:    certificates,
			SoftSkills:      softSkills,
			Internship:      internship,
			Projects:        projects,
			Completeness:    completeness,
			Competitiveness: student.CompetitivenessScore,
			CreatedAt:       student.CreatedAt,
			UpdatedAt:       student.UpdatedAt,
		},
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
	student, err := l.svcCtx.StudentModel.FindOne(l.ctx, id)
	if err != nil {
		logx.Errorf("FindOne failed: %v", err)
		return &types.StudentResp{
			Code: errors.CodeInternalError,
			Msg:  "student not found",
		}, nil
	}

	// 反序列化JSON字段
	var skills []types.StudentSkill
	var certificates []types.StudentCert
	var softSkills types.SoftSkills
	var internship []types.Internship
	var projects []types.Project

	if student.Skills.Valid {
		json.Unmarshal([]byte(student.Skills.String), &skills)
	}
	if student.Certificates.Valid {
		json.Unmarshal([]byte(student.Certificates.String), &certificates)
	}
	if student.SoftSkills.Valid {
		json.Unmarshal([]byte(student.SoftSkills.String), &softSkills)
	}
	if student.Internship.Valid {
		json.Unmarshal([]byte(student.Internship.String), &internship)
	}
	if student.Projects.Valid {
		json.Unmarshal([]byte(student.Projects.String), &projects)
	}

	graduationYear := 0
	if student.GraduationYear.Valid {
		graduationYear = int(student.GraduationYear.Int64)
	}

	return &types.StudentResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
		Data: &types.StudentProfile{
			Id:              student.Id,
			UserId:          student.UserId,
			Name:            student.Name,
			Education:       student.Education.String,
			Major:           student.Major.String,
			GraduationYear:  graduationYear,
			Skills:          skills,
			Certificates:    certificates,
			SoftSkills:      softSkills,
			Internship:      internship,
			Projects:        projects,
			Completeness:    student.CompletenessScore,
			Competitiveness: student.CompetitivenessScore,
			CreatedAt:       student.CreatedAt,
			UpdatedAt:       student.UpdatedAt,
		},
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
	// 从数据库查询学生信息
	student, err := l.svcCtx.StudentModel.FindOne(l.ctx, id)
	if err != nil {
		logx.Errorf("FindOne failed: %v", err)
		return &types.StudentResp{
			Code: errors.CodeInternalError,
			Msg:  "student not found",
		}, nil
	}

	// 检查权限
	userId, ok := l.ctx.Value("userId").(int64)
	if !ok || student.UserId != userId {
		return &types.StudentResp{
			Code: errors.CodeUnauthorized,
			Msg:  "unauthorized",
		}, nil
	}

	err = l.svcCtx.StudentModel.Delete(l.ctx, id)
	if err != nil {
		logx.Errorf("Delete failed: %v", err)
		return &types.StudentResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to delete student profile",
		}, nil
	}

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
	// 从上下文获取userId
	userId, ok := l.ctx.Value("userId").(int64)
	if !ok {
		return &types.StudentResp{
			Code: errors.CodeUnauthorized,
			Msg:  "unauthorized",
		}, nil
	}

	// 查询学生的档案
	student, err := l.svcCtx.StudentModel.FindOneByUserId(l.ctx, userId)
	if err != nil {
		logx.Errorf("FindOneByUserId failed: %v", err)
		return &types.StudentResp{
			Code: errors.CodeInternalError,
			Msg:  "student profile not found",
		}, nil
	}

	// 反序列化JSON字段
	var skills []types.StudentSkill
	var certificates []types.StudentCert
	var softSkills types.SoftSkills
	var internship []types.Internship
	var projects []types.Project

	if student.Skills.Valid {
		json.Unmarshal([]byte(student.Skills.String), &skills)
	}
	if student.Certificates.Valid {
		json.Unmarshal([]byte(student.Certificates.String), &certificates)
	}
	if student.SoftSkills.Valid {
		json.Unmarshal([]byte(student.SoftSkills.String), &softSkills)
	}
	if student.Internship.Valid {
		json.Unmarshal([]byte(student.Internship.String), &internship)
	}
	if student.Projects.Valid {
		json.Unmarshal([]byte(student.Projects.String), &projects)
	}

	graduationYear := 0
	if student.GraduationYear.Valid {
		graduationYear = int(student.GraduationYear.Int64)
	}

	return &types.StudentResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
		Data: &types.StudentProfile{
			Id:              student.Id,
			UserId:          student.UserId,
			Name:            student.Name,
			Education:       student.Education.String,
			Major:           student.Major.String,
			GraduationYear:  graduationYear,
			Skills:          skills,
			Certificates:    certificates,
			SoftSkills:      softSkills,
			Internship:      internship,
			Projects:        projects,
			Completeness:    student.CompletenessScore,
			Competitiveness: student.CompetitivenessScore,
			CreatedAt:       student.CreatedAt,
			UpdatedAt:       student.UpdatedAt,
		},
	}, nil
}
