// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package student

import (
	"context"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"
	"unicode"

	"career-api/common/errors"
	"career-api/internal/model"
	"career-api/internal/pkg"
	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type UploadResumeLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// Upload resume and generate profile via AI
func NewUploadResumeLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UploadResumeLogic {
	return &UploadResumeLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *UploadResumeLogic) UploadResume(req *types.ResumeUploadReq) (resp *types.StudentResp, err error) {
	logx.Infof("UploadResume called: fileName=%s, contentLen=%d", req.FileName, len(req.FileContent))

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

	// 对 AI 导入的经历做合法性检查与清洗。
	sanitizeAIImportedExperiences(profile)

	// 10. 设置元数据
	userId, ok := l.ctx.Value("userId").(int64)
	if !ok {
		userId = 1 // 默认用户ID，实际应该从认证中获取
	}

	profile.Id = time.Now().UnixNano()
	profile.UserId = userId
	profile.CreatedAt = time.Now().Unix()
	profile.UpdatedAt = time.Now().Unix()

	logx.Infof("Successfully processed resume for user %d, extracted profile: %s", userId, profile.Name)

	// 11. 保存到数据库

	// 11.1 序列化 profile JSON
	profileJSON, err := json.Marshal(profile)
	if err != nil {
		logx.Errorf("Failed to marshal profile to JSON: %v", err)
		return &types.StudentResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to save profile",
		}, nil
	}

	// 11.2 序列化 suggestions JSON
	var suggestionsJSON []byte
	if len(profile.Suggestions) > 0 {
		suggestionsJSON, err = json.Marshal(profile.Suggestions)
		if err != nil {
			logx.Errorf("Failed to marshal suggestions to JSON: %v", err)
		}
	}

	// 11.3 序列化其他字段
	skillsJSON, _ := json.Marshal(profile.Skills)
	certificatesJSON, _ := json.Marshal(profile.Certificates)
	softSkillsJSON, _ := json.Marshal(profile.SoftSkills)
	internshipJSON, _ := json.Marshal(profile.Internship)
	projectsJSON, _ := json.Marshal(profile.Projects)

	// 11.4 保存到 resume_parse_history 表
	historyData := &model.ResumeParseHistory{
		UserId:               userId,
		ResumeFileName:       sql.NullString{String: req.FileName, Valid: req.FileName != ""},
		ResumeContent:        sql.NullString{String: resumeText, Valid: resumeText != ""},
		ParsedProfile:        sql.NullString{String: string(profileJSON), Valid: true},
		Suggestions:          sql.NullString{String: string(suggestionsJSON), Valid: len(suggestionsJSON) > 0},
		CompletenessScore:    profile.Completeness,
		CompetitivenessScore: profile.Competitiveness,
		CreatedAt:            time.Now().Unix(),
	}

	_, err = l.svcCtx.ResumeParseHistoryModel.Insert(l.ctx, historyData)
	if err != nil {
		logx.Errorf("Failed to insert into resume_parse_history: %v", err)
		return &types.StudentResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to save history",
		}, nil
	}
	logx.Infof("Successfully saved to resume_parse_history table")

	// 11.5 更新或创建 students 记录
	// 先查找是否已有记录
	existingStudent, err := l.svcCtx.StudentModel.FindOneByUserId(l.ctx, userId)
	var studentId int64

	if err == nil {
		// 更新现有记录
		studentId = existingStudent.Id

		// 基础信息采用“缺失才补全”策略，避免 AI 空值覆盖已有数据。
		if strings.TrimSpace(existingStudent.Name) == "" && strings.TrimSpace(profile.Name) != "" {
			existingStudent.Name = profile.Name
		}
		if (!existingStudent.Education.Valid || strings.TrimSpace(existingStudent.Education.String) == "") && strings.TrimSpace(profile.Education) != "" {
			existingStudent.Education = sql.NullString{String: profile.Education, Valid: true}
		}
		if (!existingStudent.Major.Valid || strings.TrimSpace(existingStudent.Major.String) == "") && strings.TrimSpace(profile.Major) != "" {
			existingStudent.Major = sql.NullString{String: profile.Major, Valid: true}
		}
		if (!existingStudent.GraduationYear.Valid || existingStudent.GraduationYear.Int64 <= 0) && profile.GraduationYear > 0 {
			existingStudent.GraduationYear = sql.NullInt64{Int64: int64(profile.GraduationYear), Valid: true}
		}
		// 技能改为追加+判重，避免覆盖已有内容。
		if len(profile.Skills) > 0 {
			existingSkills := make([]types.StudentSkill, 0)
			if existingStudent.Skills.Valid && strings.TrimSpace(existingStudent.Skills.String) != "" {
				_ = json.Unmarshal([]byte(existingStudent.Skills.String), &existingSkills)
			}

			mergedSkills := dedupeSkills(append(existingSkills, profile.Skills...))
			mergedSkillsJSON, _ := json.Marshal(mergedSkills)
			existingStudent.Skills = sql.NullString{String: string(mergedSkillsJSON), Valid: len(mergedSkills) > 0}
		}

		// 证书改为追加+判重，避免覆盖已有内容。
		if len(profile.Certificates) > 0 {
			existingCertificates := make([]types.StudentCert, 0)
			if existingStudent.Certificates.Valid && strings.TrimSpace(existingStudent.Certificates.String) != "" {
				_ = json.Unmarshal([]byte(existingStudent.Certificates.String), &existingCertificates)
			}

			mergedCertificates := dedupeCertificates(append(existingCertificates, profile.Certificates...))
			mergedCertificatesJSON, _ := json.Marshal(mergedCertificates)
			existingStudent.Certificates = sql.NullString{String: string(mergedCertificatesJSON), Valid: len(mergedCertificates) > 0}
		}
		existingStudent.SoftSkills = sql.NullString{String: string(softSkillsJSON), Valid: true}
		// 如果 AI 解析到实习经历，则追加到已有经历（去重），而不是覆盖。
		if len(profile.Internship) > 0 {
			existingInternships := make([]types.Internship, 0)
			if existingStudent.Internship.Valid && strings.TrimSpace(existingStudent.Internship.String) != "" {
				_ = json.Unmarshal([]byte(existingStudent.Internship.String), &existingInternships)
			}

			mergedInternships := dedupeInternships(append(existingInternships, profile.Internship...))
			mergedInternshipJSON, _ := json.Marshal(mergedInternships)
			existingStudent.Internship = sql.NullString{String: string(mergedInternshipJSON), Valid: len(mergedInternships) > 0}
		}
		// 如果 AI 解析到项目经历，则追加到已有项目（去重），而不是覆盖。
		if len(profile.Projects) > 0 {
			existingProjects := make([]types.Project, 0)
			if existingStudent.Projects.Valid && strings.TrimSpace(existingStudent.Projects.String) != "" {
				_ = json.Unmarshal([]byte(existingStudent.Projects.String), &existingProjects)
			}

			mergedProjects := dedupeProjects(append(existingProjects, profile.Projects...))
			mergedProjectsJSON, _ := json.Marshal(mergedProjects)
			existingStudent.Projects = sql.NullString{String: string(mergedProjectsJSON), Valid: len(mergedProjects) > 0}
		}
		existingStudent.CompletenessScore = profile.Completeness
		existingStudent.CompetitivenessScore = profile.Competitiveness
		existingStudent.Suggestions = sql.NullString{String: string(suggestionsJSON), Valid: len(suggestionsJSON) > 0}
		existingStudent.ResumeContent = sql.NullString{String: resumeText, Valid: resumeText != ""}
		existingStudent.UpdatedAt = time.Now().Unix()

		err = l.svcCtx.StudentModel.Update(l.ctx, existingStudent)
		if err != nil {
			logx.Errorf("Failed to update student record: %v", err)
		} else {
			logx.Infof("Successfully updated student record for user %d", userId)
		}
	} else {
		// 创建新记录
		newStudent := &model.Students{
			UserId:               userId,
			Name:                 profile.Name,
			Education:            sql.NullString{String: profile.Education, Valid: profile.Education != ""},
			Major:                sql.NullString{String: profile.Major, Valid: profile.Major != ""},
			GraduationYear:       sql.NullInt64{Int64: int64(profile.GraduationYear), Valid: profile.GraduationYear > 0},
			Skills:               sql.NullString{String: string(skillsJSON), Valid: true},
			Certificates:         sql.NullString{String: string(certificatesJSON), Valid: true},
			SoftSkills:           sql.NullString{String: string(softSkillsJSON), Valid: true},
			Internship:           sql.NullString{String: string(internshipJSON), Valid: true},
			Projects:             sql.NullString{String: string(projectsJSON), Valid: true},
			CompletenessScore:    profile.Completeness,
			CompetitivenessScore: profile.Competitiveness,
			Suggestions:          sql.NullString{String: string(suggestionsJSON), Valid: len(suggestionsJSON) > 0},
			ResumeContent:        sql.NullString{String: resumeText, Valid: resumeText != ""},
			CreatedAt:            time.Now().Unix(),
			UpdatedAt:            time.Now().Unix(),
		}

		result, err := l.svcCtx.StudentModel.Insert(l.ctx, newStudent)
		if err != nil {
			logx.Errorf("Failed to insert student record: %v", err)
		} else {
			studentId, _ = result.LastInsertId()
			logx.Infof("Successfully created student record for user %d, id: %d", userId, studentId)
		}
	}

	// 11.6 更新历史记录的 student_id
	if studentId > 0 {
		historyData.StudentId = sql.NullInt64{Int64: studentId, Valid: true}
		// 注意：这里可能需要更新操作，但由于已经插入，暂时省略
	}

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
		logx.Errorf("Failed to unmarshal JSON: %v, jsonStr: %s", err, jsonStr[:minInt(500, len(jsonStr))])
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

	return &profile, nil
}

// min 返回两个整数中的较小值
func minInt(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func sanitizeAIImportedExperiences(profile *types.StudentProfile) {
	if profile == nil {
		return
	}

	originalInternships := len(profile.Internship)
	validInternships := make([]types.Internship, 0, originalInternships)
	for _, item := range profile.Internship {
		// 合法性：实习时长必须大于 0 个月，且至少有公司或岗位信息。
		if item.Duration <= 0 {
			continue
		}
		if normalizeText(item.Company) == "" && normalizeText(item.Position) == "" {
			continue
		}
		validInternships = append(validInternships, item)
	}
	profile.Internship = dedupeInternships(validInternships)

	originalProjects := len(profile.Projects)
	validProjects := make([]types.Project, 0, originalProjects)
	for _, item := range profile.Projects {
		// 合法性：项目至少需要项目名和角色。
		if normalizeText(item.Name) == "" || normalizeText(item.Role) == "" {
			continue
		}
		validProjects = append(validProjects, item)
	}
	profile.Projects = dedupeProjects(validProjects)

	if len(profile.Internship) != originalInternships || len(profile.Projects) != originalProjects {
		logx.Infof(
			"AI import sanitized: internships %d -> %d, projects %d -> %d",
			originalInternships,
			len(profile.Internship),
			originalProjects,
			len(profile.Projects),
		)
	}
}

func dedupeSkills(items []types.StudentSkill) []types.StudentSkill {
	merged := make(map[string]types.StudentSkill, len(items))
	for _, item := range items {
		name := normalizeText(item.Name)
		if name == "" {
			continue
		}

		current, ok := merged[name]
		if !ok {
			merged[name] = item
			continue
		}

		if item.Level > current.Level {
			current.Level = item.Level
		}
		if item.Years > current.Years {
			current.Years = item.Years
		}
		if strings.TrimSpace(current.Name) == "" {
			current.Name = item.Name
		}
		merged[name] = current
	}

	result := make([]types.StudentSkill, 0, len(merged))
	for _, v := range merged {
		result = append(result, v)
	}
	sort.Slice(result, func(i, j int) bool {
		return normalizeText(result[i].Name) < normalizeText(result[j].Name)
	})
	return result
}

func dedupeCertificates(items []types.StudentCert) []types.StudentCert {
	seen := make(map[string]struct{}, len(items))
	result := make([]types.StudentCert, 0, len(items))

	for _, item := range items {
		key := certificateKey(item)
		if key == "" {
			continue
		}
		if _, ok := seen[key]; ok {
			continue
		}
		seen[key] = struct{}{}
		result = append(result, item)
	}

	sort.Slice(result, func(i, j int) bool {
		return certificateKey(result[i]) < certificateKey(result[j])
	})
	return result
}

func certificateKey(item types.StudentCert) string {
	name := normalizeText(item.Name)
	level := normalizeText(item.Level)
	if name == "" {
		return ""
	}
	return fmt.Sprintf("%s|%s|%d", name, level, item.Year)
}

func dedupeInternships(items []types.Internship) []types.Internship {
	seen := make(map[string]struct{}, len(items))
	result := make([]types.Internship, 0, len(items))
	for _, item := range items {
		key := internshipKey(item)
		if key == "" {
			continue
		}
		if _, ok := seen[key]; ok {
			continue
		}
		seen[key] = struct{}{}
		result = append(result, item)
	}
	return result
}

func internshipKey(item types.Internship) string {
	company := normalizeText(item.Company)
	position := normalizeText(item.Position)
	description := normalizeText(item.Description)

	if company == "" && position == "" && description == "" {
		return ""
	}

	return fmt.Sprintf("%s|%s|%d|%s", company, position, item.Duration, description)
}

func dedupeProjects(items []types.Project) []types.Project {
	seen := make(map[string]struct{}, len(items))
	result := make([]types.Project, 0, len(items))
	for _, item := range items {
		key := projectKey(item)
		if key == "" {
			continue
		}
		if _, ok := seen[key]; ok {
			continue
		}
		seen[key] = struct{}{}
		result = append(result, item)
	}
	return result
}

func projectKey(item types.Project) string {
	name := normalizeText(item.Name)
	role := normalizeText(item.Role)
	description := normalizeText(item.Description)
	technologies := normalizeTechnologies(item.Technologies)

	if name == "" && role == "" && description == "" && len(technologies) == 0 {
		return ""
	}

	return fmt.Sprintf("%s|%s|%s|%s", name, role, description, strings.Join(technologies, ","))
}

func normalizeText(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	if s == "" {
		return ""
	}

	parts := strings.FieldsFunc(s, func(r rune) bool {
		return !unicode.IsLetter(r) && !unicode.IsNumber(r) && !unicode.Is(unicode.Han, r)
	})
	return strings.Join(parts, "")
}

func normalizeTechnologies(items []string) []string {
	set := make(map[string]struct{}, len(items))
	for _, item := range items {
		n := normalizeText(item)
		if n != "" {
			set[n] = struct{}{}
		}
	}
	result := make([]string, 0, len(set))
	for k := range set {
		result = append(result, k)
	}
	sort.Strings(result)
	return result
}
