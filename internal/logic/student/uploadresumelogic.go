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
	"strings"
	"time"

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

	// 5. 保存临时文件
	tempDir := "/tmp"
	tempFile := filepath.Join(tempDir, fmt.Sprintf("resume_%d%s", time.Now().UnixNano(), filepath.Ext(req.FileName)))
	if err := os.WriteFile(tempFile, fileData, 0644); err != nil {
		logx.Errorf("Failed to save temp file: %v", err)
		return &types.StudentResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to save file",
		}, nil
	}
	defer func() {
		// 清理临时文件
		if err := os.Remove(tempFile); err != nil {
			logx.Errorf("Failed to remove temp file %s: %v", tempFile, err)
		}
	}()

	// 6. 提取文本内容
	resumeText, err := pkg.ExtractText(tempFile)
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
		existingStudent.Name = profile.Name
		existingStudent.Education = sql.NullString{String: profile.Education, Valid: profile.Education != ""}
		existingStudent.Major = sql.NullString{String: profile.Major, Valid: profile.Major != ""}
		existingStudent.GraduationYear = sql.NullInt64{Int64: int64(profile.GraduationYear), Valid: profile.GraduationYear > 0}
		existingStudent.Skills = sql.NullString{String: string(skillsJSON), Valid: true}
		existingStudent.Certificates = sql.NullString{String: string(certificatesJSON), Valid: true}
		existingStudent.SoftSkills = sql.NullString{String: string(softSkillsJSON), Valid: true}
		existingStudent.Internship = sql.NullString{String: string(internshipJSON), Valid: true}
		existingStudent.Projects = sql.NullString{String: string(projectsJSON), Valid: true}
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

	return &profile, nil
}

// min 返回两个整数中的较小值
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
