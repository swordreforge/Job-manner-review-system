package logic

import (
	"context"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/zeromicro/go-zero/core/logx"

	"career-api/common/errors"
	"career-api/internal/model"
	"career-api/internal/pkg"
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

	// 创建学生档案（时间戳由Model的Insert方法自动设置）
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
	}

	result, err := l.svcCtx.StudentModel.Insert(l.ctx, student)
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

	// 查询学生档案以获取完整数据（包括created_at和updated_at）
	studentInfo, err := l.svcCtx.StudentModel.FindOne(l.ctx, studentId)
	if err != nil {
		logx.Errorf("FindOne failed: %v", err)
		return &types.StudentResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to get student info",
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
			CreatedAt:       studentInfo.CreatedAt,
			UpdatedAt:       studentInfo.UpdatedAt,
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
	var suggestions []string

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
	if student.Suggestions.Valid {
		json.Unmarshal([]byte(student.Suggestions.String), &suggestions)
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
			Suggestions:     suggestions,
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
	var suggestions []string

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
	if student.Suggestions.Valid {
		json.Unmarshal([]byte(student.Suggestions.String), &suggestions)
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
			Suggestions:     suggestions,
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

	// 从数据库查询学生列表
	students, total, err := l.svcCtx.StudentModel.FindAll(l.ctx, page, pageSize, req.Education, req.Major)
	if err != nil {
		logx.Errorf("FindAll failed: %v", err)
		return &types.StudentListResultResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to list students",
		}, nil
	}

	// 转换为响应格式
	profiles := make([]types.StudentProfile, 0, len(students))
	for _, student := range students {
		// 反序列化JSON字段
		var skills []types.StudentSkill
		var certificates []types.StudentCert
		var softSkills types.SoftSkills
		var internship []types.Internship
		var projects []types.Project
		var suggestions []string

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
		if student.Suggestions.Valid {
			json.Unmarshal([]byte(student.Suggestions.String), &suggestions)
		}

		graduationYear := 0
		if student.GraduationYear.Valid {
			graduationYear = int(student.GraduationYear.Int64)
		}

		profiles = append(profiles, types.StudentProfile{
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
			Suggestions:     suggestions,
			CreatedAt:       student.CreatedAt,
			UpdatedAt:       student.UpdatedAt,
		})
	}

	return &types.StudentListResultResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
		Data: &types.StudentListResp{
			Total: total,
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

// 合并策略函数

// calculateCompletenessFromMergedData 基于合并后的数据计算完整度
func calculateCompletenessFromMergedData(
	skills []types.StudentSkill,
	certificates []types.StudentCert,
	internships []types.Internship,
	projects []types.Project,
	name string,
	education string,
	major string,
) float64 {
	score := 0.0
	total := 7.0

	if name != "" {
		score += 1
	}
	if education != "" {
		score += 1
	}
	if major != "" {
		score += 1
	}
	if len(skills) > 0 {
		score += 1
	}
	if len(certificates) > 0 {
		score += 1
	}
	if len(internships) > 0 {
		score += 1
	}
	if len(projects) > 0 {
		score += 1
	}

	return score / total * 100
}

// calculateCompetitivenessFromMergedData 基于合并后的数据计算竞争力
func calculateCompetitivenessFromMergedData(
	skills []types.StudentSkill,
	certificates []types.StudentCert,
	internships []types.Internship,
	projects []types.Project,
) float64 {
	score := 50.0

	if len(skills) > 5 {
		score += 10
	}
	if len(certificates) > 3 {
		score += 10
	}
	if len(internships) > 1 {
		score += 15
	}
	if len(projects) > 2 {
		score += 15
	}

	return score
}

// mergeSkills 合并技能列表，去重并保留更高的掌握程度
func mergeSkills(existing []types.StudentSkill, newSkills []types.StudentSkill) []types.StudentSkill {
	skillMap := make(map[string]types.StudentSkill)

	// 添加现有技能
	for _, skill := range existing {
		skillMap[skill.Name] = skill
	}

	// 合并新技能（保留更高的掌握程度）
	for _, skill := range newSkills {
		if existingSkill, ok := skillMap[skill.Name]; ok {
			// 保留更高的评分
			if skill.Level > existingSkill.Level {
				skillMap[skill.Name] = skill
			} else if skill.Years > existingSkill.Years {
				// 如果评分相同，保留更长的年限
				updatedSkill := existingSkill
				updatedSkill.Years = skill.Years
				skillMap[skill.Name] = updatedSkill
			}
		} else {
			skillMap[skill.Name] = skill
		}
	}

	// 转换为切片
	result := make([]types.StudentSkill, 0, len(skillMap))
	for _, skill := range skillMap {
		result = append(result, skill)
	}

	return result
}

// mergeCertificates 合并证书列表，去重（使用"名称+等级"作为唯一标识）
func mergeCertificates(existing []types.StudentCert, newCerts []types.StudentCert) []types.StudentCert {
	certMap := make(map[string]types.StudentCert)

	// 添加现有证书
	for _, cert := range existing {
		key := fmt.Sprintf("%s-%s", cert.Name, cert.Level)
		certMap[key] = cert
	}

	// 添加新证书
	for _, cert := range newCerts {
		key := fmt.Sprintf("%s-%s", cert.Name, cert.Level)
		if _, ok := certMap[key]; !ok {
			certMap[key] = cert
		}
	}

	// 转换为切片
	result := make([]types.StudentCert, 0, len(certMap))
	for _, cert := range certMap {
		result = append(result, cert)
	}

	return result
}

// mergeInternships 合并实习经历（基于公司名称和职位去重）
func mergeInternships(existing []types.Internship, newInternships []types.Internship) []types.Internship {
	internshipMap := make(map[string]types.Internship)

	// 添加现有实习经历
	for _, internship := range existing {
		key := fmt.Sprintf("%s-%s", internship.Company, internship.Position)
		internshipMap[key] = internship
	}

	// 添加新实习经历
	for _, internship := range newInternships {
		key := fmt.Sprintf("%s-%s", internship.Company, internship.Position)
		if existingIntern, ok := internshipMap[key]; ok {
			// 如果描述更长，使用更详细的描述
			if len(internship.Description) > len(existingIntern.Description) {
				internshipMap[key] = internship
			}
		} else {
			internshipMap[key] = internship
		}
	}

	// 转换为切片
	result := make([]types.Internship, 0, len(internshipMap))
	for _, internship := range internshipMap {
		result = append(result, internship)
	}

	return result
}

// mergeProjects 合并项目经历（基于项目名称去重）
func mergeProjects(existing []types.Project, newProjects []types.Project) []types.Project {
	projectMap := make(map[string]types.Project)

	// 添加现有项目经历
	for _, project := range existing {
		projectMap[project.Name] = project
	}

	// 添加新项目经历
	for _, project := range newProjects {
		if existingProject, ok := projectMap[project.Name]; ok {
			// 如果描述更长，使用更详细的描述
			if len(project.Description) > len(existingProject.Description) {
				projectMap[project.Name] = project
			} else if len(project.Technologies) > 0 {
				// 合并技术栈（去重）
				techMap := make(map[string]bool)
				for _, tech := range existingProject.Technologies {
					techMap[tech] = true
				}
				for _, tech := range project.Technologies {
					techMap[tech] = true
				}
				mergedTechs := make([]string, 0, len(techMap))
				for tech := range techMap {
					mergedTechs = append(mergedTechs, tech)
				}
				// 创建更新的项目
				updatedProject := existingProject
				updatedProject.Technologies = mergedTechs
				projectMap[project.Name] = updatedProject
			}
		} else {
			projectMap[project.Name] = project
		}
	}

	// 转换为切片
	result := make([]types.Project, 0, len(projectMap))
	for _, project := range projectMap {
		result = append(result, project)
	}

	return result
}

// mergeSuggestions 合并优化建议（去重）
func mergeSuggestions(existing []string, newSuggestions []string) []string {
	suggestionMap := make(map[string]bool)

	// 添加现有建议
	for _, suggestion := range existing {
		suggestionMap[suggestion] = true
	}

	// 添加新建议
	for _, suggestion := range newSuggestions {
		suggestionMap[suggestion] = true
	}

	// 转换为切片
	result := make([]string, 0, len(suggestionMap))
	for suggestion := range suggestionMap {
		result = append(result, suggestion)
	}

	return result
}

func (l *UploadResumeLogic) UploadResume(req *types.ResumeUploadReq) (*types.StudentResp, error) {
	// 1. 验证参数
	if req.FileContent == "" || req.FileName == "" {
		logx.Errorf("Invalid params: fileContent or fileName is empty")
		return &types.StudentResp{
			Code: errors.CodeInvalidParams,
			Msg:  "fileContent and fileName are required",
		}, nil
	}

	// 2. 验证文件格式
	fileName := strings.ToLower(req.FileName)
	if !strings.HasSuffix(fileName, ".pdf") && !strings.HasSuffix(fileName, ".docx") {
		logx.Errorf("Unsupported file format: %s", req.FileName)
		return &types.StudentResp{
			Code: errors.CodeInvalidParams,
			Msg:  "unsupported file format, only PDF and DOCX are supported",
		}, nil
	}

	// 3. 验证文件大小（base64 编码后大约比原文件大 33%，限制 10MB）
	maxBase64Size := int64(10 * 1024 * 1024 * 4 / 3)
	if int64(len(req.FileContent)) > maxBase64Size {
		logx.Errorf("File size exceeds limit: %d bytes", len(req.FileContent))
		return &types.StudentResp{
			Code: errors.CodeInvalidParams,
			Msg:  "file size exceeds 10MB limit",
		}, nil
	}

	// 4. 解码 Base64
	fileData, err := base64.StdEncoding.DecodeString(req.FileContent)
	if err != nil {
		logx.Errorf("Failed to decode base64: %v", err)
		return &types.StudentResp{
			Code: errors.CodeInvalidParams,
			Msg:  "invalid base64 content",
		}, nil
	}

	// 5. 保存临时文件（跨平台，避免 Windows 下 /tmp 路径不存在）
	ext := filepath.Ext(req.FileName)
	tempFile, err := os.CreateTemp("", "resume_*"+ext)
	if err != nil {
		logx.Errorf("Failed to create temp file: %v", err)
		return &types.StudentResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to save file",
		}, nil
	}
	tempFilePath := tempFile.Name()
	if _, err := tempFile.Write(fileData); err != nil {
		_ = tempFile.Close()
		_ = os.Remove(tempFilePath)
		logx.Errorf("Failed to save temp file: %v", err)
		return &types.StudentResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to save file",
		}, nil
	}
	if err := tempFile.Close(); err != nil {
		_ = os.Remove(tempFilePath)
		logx.Errorf("Failed to close temp file: %v", err)
		return &types.StudentResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to save file",
		}, nil
	}
	defer func() {
		// 清理临时文件
		if err := os.Remove(tempFilePath); err != nil {
			logx.Errorf("Failed to remove temp file %s: %v", tempFilePath, err)
		}
	}()

	// 6. 提取文本内容
	resumeText, err := pkg.ExtractText(tempFilePath)
	if err != nil {
		logx.Errorf("Failed to extract text from file: %v", err)
		return &types.StudentResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to extract text from file",
		}, nil
	}

	// 7. 验证提取的文本内容
	if len(strings.TrimSpace(resumeText)) < 50 {
		logx.Errorf("Extracted text is too short: %d characters", len(resumeText))
		return &types.StudentResp{
			Code: errors.CodeInvalidParams,
			Msg:  "extracted text is too short, please check your file",
		}, nil
	}

	logx.Infof("Successfully extracted text from resume, length: %d characters", len(resumeText))

	// 8. 调用 AI API 解析
	aiResult, err := l.svcCtx.AIProvider.GenerateStudentProfile(l.ctx, resumeText)
	if err != nil {
		logx.Errorf("GenerateStudentProfile failed: %v", err)
		return &types.StudentResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to parse resume with AI",
		}, nil
	}

	logx.Infof("AI parsing completed, result length: %d characters", len(aiResult))

	// 9. 解析 AI 返回的 JSON
	profile, err := parseAIResult(aiResult)
	if err != nil {
		logx.Errorf("Failed to parse AI result: %v", err)
		return &types.StudentResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to parse AI result",
		}, nil
	}

	// 10. 设置元数据
	userId, ok := l.ctx.Value("userId").(int64)
	if !ok {
		userId = 1 // 默认用户ID，实际应该从认证中获取
	}

	profile.UserId = userId
	profile.CreatedAt = time.Now().Unix()
	profile.UpdatedAt = time.Now().Unix()

	// 11. 序列化数据用于数据库存储
	skillsJSON, _ := json.Marshal(profile.Skills)
	certificatesJSON, _ := json.Marshal(profile.Certificates)
	softSkillsJSON, _ := json.Marshal(profile.SoftSkills)
	internshipJSON, _ := json.Marshal(profile.Internship)
	projectsJSON, _ := json.Marshal(profile.Projects)
	suggestionsJSON, _ := json.Marshal(profile.Suggestions)

	// 12. 创建或更新学生档案
	student, err := l.svcCtx.StudentModel.FindOneByUserId(l.ctx, userId)
	var studentId int64
	if err == nil {
		// 更新现有记录 - 使用智能合并策略

		// 反序列化现有数据
		var existingSkills []types.StudentSkill
		var existingCertificates []types.StudentCert
		var existingSoftSkills types.SoftSkills
		var existingInternship []types.Internship
		var existingProjects []types.Project
		var existingSuggestions []string

		if student.Skills.Valid {
			json.Unmarshal([]byte(student.Skills.String), &existingSkills)
		}
		if student.Certificates.Valid {
			json.Unmarshal([]byte(student.Certificates.String), &existingCertificates)
		}
		if student.SoftSkills.Valid {
			json.Unmarshal([]byte(student.SoftSkills.String), &existingSoftSkills)
		}
		if student.Internship.Valid {
			json.Unmarshal([]byte(student.Internship.String), &existingInternship)
		}
		if student.Projects.Valid {
			json.Unmarshal([]byte(student.Projects.String), &existingProjects)
		}
		if student.Suggestions.Valid {
			json.Unmarshal([]byte(student.Suggestions.String), &existingSuggestions)
		}

		// 智能合并：姓名、学历、专业、毕业年份使用AI解析结果（假设是最新的）
		student.Name = profile.Name
		student.Education = sql.NullString{String: profile.Education, Valid: profile.Education != ""}
		student.Major = sql.NullString{String: profile.Major, Valid: profile.Major != ""}
		student.GraduationYear = sql.NullInt64{Int64: int64(profile.GraduationYear), Valid: profile.GraduationYear > 0}

		// 智能合并：技能列表（合并去重，保留更高的掌握程度）
		mergedSkills := mergeSkills(existingSkills, profile.Skills)
		mergedSkillsJSON, _ := json.Marshal(mergedSkills)
		student.Skills = sql.NullString{String: string(mergedSkillsJSON), Valid: len(mergedSkills) > 0}

		// 智能合并：证书列表（合并去重）
		mergedCertificates := mergeCertificates(existingCertificates, profile.Certificates)
		mergedCertificatesJSON, _ := json.Marshal(mergedCertificates)
		student.Certificates = sql.NullString{String: string(mergedCertificatesJSON), Valid: len(mergedCertificates) > 0}

		// 保留：软技能（主观性强，保留用户手动填写）
		student.SoftSkills = student.SoftSkills

		// 智能合并：实习经历（合并去重）
		mergedInternship := mergeInternships(existingInternship, profile.Internship)
		mergedInternshipJSON, _ := json.Marshal(mergedInternship)
		student.Internship = sql.NullString{String: string(mergedInternshipJSON), Valid: len(mergedInternship) > 0}

		// 智能合并：项目经历（合并去重）
		mergedProjects := mergeProjects(existingProjects, profile.Projects)
		mergedProjectsJSON, _ := json.Marshal(mergedProjects)
		student.Projects = sql.NullString{String: string(mergedProjectsJSON), Valid: len(mergedProjects) > 0}

		// 智能合并：优化建议（去重）
		mergedSuggestions := mergeSuggestions(existingSuggestions, profile.Suggestions)
		mergedSuggestionsJSON, _ := json.Marshal(mergedSuggestions)
		student.Suggestions = sql.NullString{String: string(mergedSuggestionsJSON), Valid: len(mergedSuggestions) > 0}

		// 更新简历内容
		student.ResumeContent = sql.NullString{String: resumeText, Valid: resumeText != ""}

		// 重新计算完整度和竞争力（基于合并后的数据）
		mergedCompleteness := calculateCompletenessFromMergedData(mergedSkills, mergedCertificates, mergedInternship, mergedProjects, student.Name, student.Education.String, student.Major.String)
		mergedCompetitiveness := calculateCompetitivenessFromMergedData(mergedSkills, mergedCertificates, mergedInternship, mergedProjects)
		student.CompletenessScore = mergedCompleteness
		student.CompetitivenessScore = mergedCompetitiveness

		student.UpdatedAt = time.Now().Unix()

		logx.Infof("Merged profile for user %d: %d skills, %d certificates, %d internships, %d projects",
			userId, len(mergedSkills), len(mergedCertificates), len(mergedInternship), len(mergedProjects))

		err = l.svcCtx.StudentModel.Update(l.ctx, student)
		if err != nil {
			logx.Errorf("Failed to update student profile: %v", err)
			return &types.StudentResp{
				Code: errors.CodeInternalError,
				Msg:  "failed to update student profile",
			}, nil
		}
		studentId = student.Id

		// 更新返回的profile为合并后的数据
		profile.Skills = mergedSkills
		profile.Certificates = mergedCertificates
		profile.SoftSkills = existingSoftSkills // 保留现有的软技能
		profile.Internship = mergedInternship
		profile.Projects = mergedProjects
		profile.Suggestions = mergedSuggestions
		profile.Completeness = mergedCompleteness
		profile.Competitiveness = mergedCompetitiveness
	} else {
		// 创建新记录
		newStudent := &model.Students{
			UserId:               userId,
			Name:                 profile.Name,
			Education:            sql.NullString{String: profile.Education, Valid: profile.Education != ""},
			Major:                sql.NullString{String: profile.Major, Valid: profile.Major != ""},
			GraduationYear:       sql.NullInt64{Int64: int64(profile.GraduationYear), Valid: profile.GraduationYear > 0},
			Skills:               sql.NullString{String: string(skillsJSON), Valid: len(profile.Skills) > 0},
			Certificates:         sql.NullString{String: string(certificatesJSON), Valid: len(profile.Certificates) > 0},
			SoftSkills:           sql.NullString{String: string(softSkillsJSON), Valid: true},
			Internship:           sql.NullString{String: string(internshipJSON), Valid: len(profile.Internship) > 0},
			Projects:             sql.NullString{String: string(projectsJSON), Valid: len(profile.Projects) > 0},
			CompletenessScore:    profile.Completeness,
			CompetitivenessScore: profile.Competitiveness,
			Suggestions:          sql.NullString{String: string(suggestionsJSON), Valid: len(profile.Suggestions) > 0},
			ResumeContent:        sql.NullString{String: resumeText, Valid: resumeText != ""},
			CreatedAt:            profile.CreatedAt,
			UpdatedAt:            profile.UpdatedAt,
		}

		result, err := l.svcCtx.StudentModel.Insert(l.ctx, newStudent)
		if err != nil {
			logx.Errorf("Failed to insert student profile: %v", err)
			return &types.StudentResp{
				Code: errors.CodeInternalError,
				Msg:  "failed to create student profile",
			}, nil
		}

		studentId, err = result.LastInsertId()
		if err != nil {
			logx.Errorf("Failed to get student id: %v", err)
			return &types.StudentResp{
				Code: errors.CodeInternalError,
				Msg:  "failed to get student id",
			}, nil
		}
	}

	// 13. 保存历史记录
	parsedProfileJSON, _ := json.Marshal(profile)
	history := &model.ResumeParseHistory{
		UserId:               userId,
		StudentId:            sql.NullInt64{Int64: studentId, Valid: true},
		ResumeFileName:       sql.NullString{String: req.FileName, Valid: true},
		ResumeContent:        sql.NullString{String: resumeText, Valid: true},
		ParsedProfile:        sql.NullString{String: string(parsedProfileJSON), Valid: true},
		Suggestions:          sql.NullString{String: string(suggestionsJSON), Valid: len(profile.Suggestions) > 0},
		CompletenessScore:    profile.Completeness,
		CompetitivenessScore: profile.Competitiveness,
		CreatedAt:            time.Now().Unix(),
	}

	_, err = l.svcCtx.ResumeParseHistoryModel.Insert(l.ctx, history)
	if err != nil {
		logx.Errorf("Failed to insert resume parse history: %v", err)
		// 不影响主流程，仅记录错误
	}

	// 14. 设置返回的profile的Id
	profile.Id = studentId

	logx.Infof("Successfully processed resume for user %d, extracted profile: %s, student_id: %d", userId, profile.Name, studentId)

	return &types.StudentResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
		Data: profile,
	}, nil
}

// parseAIResult 解析 AI 返回的结果
func parseAIResult(aiResult string) (*types.StudentProfile, error) {
	// 提取 JSON（可能包含 Markdown 格式）
	jsonStr := aiResult
	if strings.Contains(aiResult, "```json") {
		start := strings.Index(aiResult, "```json")
		end := strings.LastIndex(aiResult, "```")
		if start != -1 && end != -1 && end > start {
			jsonStr = strings.TrimSpace(aiResult[start+7 : end])
		}
	} else if strings.Contains(aiResult, "```") {
		// 处理没有语言标记的代码块
		start := strings.Index(aiResult, "```")
		end := strings.LastIndex(aiResult, "```")
		if start != -1 && end != -1 && end > start+3 {
			jsonStr = strings.TrimSpace(aiResult[start+3 : end])
		}
	}

	// 尝试直接解析为 JSON
	var profile types.StudentProfile
	if err := json.Unmarshal([]byte(jsonStr), &profile); err != nil {
		logx.Errorf("Failed to unmarshal JSON: %v, jsonStr: %s", err, jsonStr[:min(500, len(jsonStr))])
		return nil, fmt.Errorf("failed to unmarshal JSON: %w", err)
	}

	// 设置默认值
	if profile.Completeness == 0 {
		profile.Completeness = 50.0
	}
	if profile.Competitiveness == 0 {
		profile.Competitiveness = 50.0
	}
	if profile.Skills == nil {
		profile.Skills = []types.StudentSkill{}
	}
	if profile.Certificates == nil {
		profile.Certificates = []types.StudentCert{}
	}
	if profile.Internship == nil {
		profile.Internship = []types.Internship{}
	}
	if profile.Projects == nil {
		profile.Projects = []types.Project{}
	}
	if profile.Suggestions == nil {
		profile.Suggestions = []string{}
	}

	return &profile, nil
}

// min 返回两个整数中的较小值
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
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
	var suggestions []string

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
	if student.Suggestions.Valid {
		json.Unmarshal([]byte(student.Suggestions.String), &suggestions)
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
			Suggestions:     suggestions,
			CreatedAt:       student.CreatedAt,
			UpdatedAt:       student.UpdatedAt,
		},
	}, nil
}
