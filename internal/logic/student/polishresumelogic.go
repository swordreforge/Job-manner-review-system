package student

import (
	"context"
	"encoding/json"
	"strings"

	"career-api/common/errors"
	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type PolishResumeLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewPolishResumeLogic(ctx context.Context, svcCtx *svc.ServiceContext) *PolishResumeLogic {
	return &PolishResumeLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *PolishResumeLogic) PolishResume(req *types.ResumePolishReq) (*types.ResumePolishResp, error) {
	logx.Infof("PolishResume called: studentId=%d", req.StudentId)

	userId, ok := l.ctx.Value("userId").(int64)
	if !ok {
		return &types.ResumePolishResp{
			Code: errors.CodeUnauthorized,
			Msg:  "unauthorized",
		}, nil
	}

	student, err := l.svcCtx.StudentModel.FindOneByUserId(l.ctx, userId)
	if err != nil {
		logx.Errorf("Failed to find student: %v", err)
		return &types.ResumePolishResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to find student profile",
		}, nil
	}

	profileData := map[string]interface{}{
		"name":             student.Name,
		"education":        student.Education.String,
		"major":            student.Major.String,
		"graduationYear":   student.GraduationYear.Int64,
		"skills":           json.RawMessage(student.Skills.String),
		"certificates":     json.RawMessage(student.Certificates.String),
		"internship":       json.RawMessage(student.Internship.String),
		"projects":         json.RawMessage(student.Projects.String),
		"completeness":     student.CompletenessScore,
		"competitiveness":  student.CompetitivenessScore,
	}

	profileJSON, err := json.Marshal(profileData)
	if err != nil {
		logx.Errorf("Failed to marshal profile: %v", err)
		return &types.ResumePolishResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to marshal profile",
		}, nil
	}

	suggestions := "[]"
	if student.Suggestions.Valid && student.Suggestions.String != "" {
		suggestions = student.Suggestions.String
	}

	htmlContent, err := l.svcCtx.AIProvider.PolishResume(l.ctx, string(profileJSON), suggestions)
	if err != nil {
		logx.Errorf("PolishResume AI call failed: %v", err)
		return &types.ResumePolishResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to polish resume",
		}, nil
	}

	cleanHTML := htmlContent
	if strings.Contains(cleanHTML, "```html") {
		start := strings.Index(cleanHTML, "```html")
		end := strings.LastIndex(cleanHTML, "```")
		if start != -1 && end != -1 && end > start {
			cleanHTML = strings.TrimSpace(cleanHTML[start+7 : end])
		}
	} else if strings.Contains(cleanHTML, "```") {
		start := strings.Index(cleanHTML, "```")
		end := strings.LastIndex(cleanHTML, "```")
		if start != -1 && end != -1 && end > start+3 {
			cleanHTML = strings.TrimSpace(cleanHTML[start+3 : end])
		}
	}

	plainText := stripHTMLTags(cleanHTML)

	return &types.ResumePolishResp{
		Code:        0,
		Msg:         "success",
		HtmlContent: cleanHTML,
		PlainText:   plainText,
	}, nil
}

func stripHTMLTags(html string) string {
	var result []rune
	inTag := false
	for _, r := range html {
		if r == '<' {
			inTag = true
			continue
		}
		if r == '>' {
			inTag = false
			continue
		}
		if !inTag {
			result = append(result, r)
		}
	}
	return string(result)
}