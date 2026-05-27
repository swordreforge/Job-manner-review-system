package assistant

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/zeromicro/go-zero/core/logx"

	"career-api/common/errors"
	"career-api/common/pkg"
	"career-api/internal/model"
	"career-api/internal/svc"
	"career-api/internal/types"
)

type AssistantChatStreamLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewAssistantChatStreamLogic(ctx context.Context, svcCtx *svc.ServiceContext) *AssistantChatStreamLogic {
	return &AssistantChatStreamLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *AssistantChatStreamLogic) AssistantChatStream(w http.ResponseWriter, req *types.AssistantChatStreamReq) {
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")

	flusher, ok := w.(http.Flusher)
	if !ok {
		l.sendSSEEvent(w, nil, "error", map[string]interface{}{
			"code": errors.CodeInternalError,
			"msg":  "SSE not supported",
		})
		return
	}

	userId, ok := l.ctx.Value("userId").(int64)
	if !ok {
		l.sendSSEEvent(w, flusher, "error", map[string]interface{}{
			"code": errors.CodeUnauthorized,
			"msg":  "unauthorized",
		})
		return
	}

	if req.ConversationId <= 0 {
		l.sendSSEEvent(w, flusher, "error", map[string]interface{}{
			"code": errors.CodeInvalidParams,
			"msg":  "invalid conversation id",
		})
		return
	}

	conversation, err := l.svcCtx.AssistantConversationsModel.FindOneByUserId(l.ctx, userId, req.ConversationId)
	if err != nil {
		l.sendSSEEvent(w, flusher, "error", map[string]interface{}{
			"code": errors.CodeNotFound,
			"msg":  "conversation not found",
		})
		return
	}

	userMsg := &model.AssistantMessages{
		ConversationId: conversation.Id,
		Role:           "user",
		Content:        req.Message,
	}
	_, err = l.svcCtx.AssistantMessagesModel.InsertWithTimestamp(l.ctx, userMsg)
	if err != nil {
		logx.WithContext(l.ctx).Errorf("Failed to save user message: %v", err)
	}

	dbMessages, err := l.svcCtx.AssistantMessagesModel.FindByConversationId(l.ctx, conversation.Id)
	if err != nil {
		logx.WithContext(l.ctx).Errorf("Failed to load message history: %v", err)
	}

	systemPrompt := l.buildSystemPrompt(userId, conversation.Track)

	aiMessages := []pkg.ChatMessage{
		{Role: "system", Content: systemPrompt},
	}
	for _, msg := range dbMessages {
		aiMessages = append(aiMessages, pkg.ChatMessage{
			Role:    msg.Role,
			Content: msg.Content,
		})
	}

	contentChan, errChan := l.svcCtx.AIProvider.ChatStream(l.ctx, aiMessages)

	var fullResponse strings.Builder
	done := false
	var streamErr error

	for !done {
		select {
		case content, ok := <-contentChan:
			if !ok {
				done = true
			} else {
				fullResponse.WriteString(content)
				l.sendSSEEvent(w, flusher, "chunk", map[string]interface{}{
					"content": content,
				})
			}
		case err := <-errChan:
			if err != nil {
				streamErr = err
				done = true
			}
		case <-l.ctx.Done():
			done = true
		}
	}

	if streamErr != nil {
		l.sendSSEEvent(w, flusher, "error", map[string]interface{}{
			"code": errors.CodeInternalError,
			"msg":  streamErr.Error(),
		})
		return
	}

	assistantContent := fullResponse.String()
	assistantMsg := &model.AssistantMessages{
		ConversationId: conversation.Id,
		Role:           "assistant",
		Content:        assistantContent,
	}
	_, err = l.svcCtx.AssistantMessagesModel.InsertWithTimestamp(l.ctx, assistantMsg)
	if err != nil {
		logx.WithContext(l.ctx).Errorf("Failed to save assistant message: %v", err)
	}

	messageCount, _ := l.svcCtx.AssistantMessagesModel.FindByConversationId(l.ctx, conversation.Id)
	if len(messageCount) <= 2 {
		go l.generateTitle(conversation.Id, req.Message)
	}

	l.sendSSEEvent(w, flusher, "done", map[string]interface{}{
		"message": "success",
	})
}

func (l *AssistantChatStreamLogic) buildSystemPrompt(userId int64, track string) string {
	var sb strings.Builder

	sb.WriteString("你是一名专业的职业规划助手，帮助高中生进行职业规划、专业选择和就业指导。")
	sb.WriteString("请根据用户的情况和需求，给出专业、具体、有针对性的建议。\n\n")

	student, err := l.svcCtx.StudentModel.FindOneByUserId(l.ctx, userId)
	if err == nil && student != nil {
		sb.WriteString("## 学生信息\n")
		sb.WriteString(fmt.Sprintf("- 姓名: %s\n", student.Name))
		if student.Education.Valid {
			sb.WriteString(fmt.Sprintf("- 学历: %s\n", student.Education.String))
		}
		if student.Major.Valid {
			sb.WriteString(fmt.Sprintf("- 专业: %s\n", student.Major.String))
		}
		if student.GraduationYear.Valid {
			sb.WriteString(fmt.Sprintf("- 毕业年份: %d\n", student.GraduationYear.Int64))
		}
		if student.Skills.Valid && student.Skills.String != "" {
			sb.WriteString(fmt.Sprintf("- 技能: %s\n", student.Skills.String))
		}
		if student.Certificates.Valid && student.Certificates.String != "" {
			sb.WriteString(fmt.Sprintf("- 证书: %s\n", student.Certificates.String))
		}
		if student.SoftSkills.Valid && student.SoftSkills.String != "" {
			sb.WriteString(fmt.Sprintf("- 软技能: %s\n", student.SoftSkills.String))
		}
		if student.Internship.Valid && student.Internship.String != "" {
			sb.WriteString(fmt.Sprintf("- 实习经历: %s\n", student.Internship.String))
		}
		if student.Projects.Valid && student.Projects.String != "" {
			sb.WriteString(fmt.Sprintf("- 项目经历: %s\n", student.Projects.String))
		}
		if student.CompletenessScore > 0 {
			sb.WriteString(fmt.Sprintf("- 简历完整度: %.0f%%\n", student.CompletenessScore))
		}
		if student.CompetitivenessScore > 0 {
			sb.WriteString(fmt.Sprintf("- 竞争力: %.0f%%\n", student.CompetitivenessScore))
		}
		sb.WriteString("\n")

		hollandResults, err := l.svcCtx.HollandTestResultsModel.FindByStudentId(l.ctx, student.Id)
		if err == nil && len(hollandResults) > 0 {
			sb.WriteString("## 霍兰德测试结果\n")
			latest := hollandResults[0]
			sb.WriteString(fmt.Sprintf("- 职业代码: %s\n", latest.CareerCode))
			sb.WriteString(fmt.Sprintf("- 适合的职业: %s\n", latest.SuitableJobs))
			if latest.Description.Valid && latest.Description.String != "" {
				sb.WriteString(fmt.Sprintf("- 描述: %s\n", latest.Description.String))
			}
			sb.WriteString("\n")
		}

		matchResults, err := l.svcCtx.MatchModel.FindByStudentId(l.ctx, student.Id, 5)
		if err == nil && len(matchResults) > 0 {
			sb.WriteString("## 岗位匹配结果（Top 5）\n")
			for i, match := range matchResults {
				job, jobErr := l.svcCtx.JobModel.FindOne(l.ctx, match.JobId)
				jobName := "未知岗位"
				if jobErr == nil && job != nil {
					jobName = job.Name
				}
				score := 0.0
				if match.OverallScore.Valid {
					score = match.OverallScore.Float64
				}
				sb.WriteString(fmt.Sprintf("%d. %s (匹配度: %.0f%%)\n", i+1, jobName, score))
				if match.GapAnalysis.Valid && match.GapAnalysis.String != "" {
					sb.WriteString(fmt.Sprintf("   差距分析: %s\n", match.GapAnalysis.String))
				}
			}
			sb.WriteString("\n")
		}
	}

	if track != "" {
		sb.WriteString(fmt.Sprintf("当前对话方向: %s\n\n", track))
	}

	sb.WriteString("注意事项:\n")
	sb.WriteString("1. 回答要具体、有针对性，结合学生的实际情况给出建议\n")
	sb.WriteString("2. 如果学生信息不完整，主动询问并引导完善\n")
	sb.WriteString("3. 提供可操作的行动建议，而不仅仅是泛泛的建议\n")
	sb.WriteString("4. 用中文回答，语言亲切自然\n")

	return sb.String()
}

func (l *AssistantChatStreamLogic) generateTitle(conversationId int64, firstMessage string) {
	ctx := context.Background()

	titlePrompt := fmt.Sprintf("请根据以下对话的第一条消息，生成一个简短的对话标题（不超过10个字，不要加引号）：\n\n%s", firstMessage)

	aiMessages := []pkg.ChatMessage{
		{Role: "system", Content: "你是一个标题生成器。根据用户的第一条消息生成一个简短的对话标题。标题不超过10个字，直接输出标题文本，不要加引号或其他标点。"},
		{Role: "user", Content: titlePrompt},
	}

	contentChan, errChan := l.svcCtx.AIProvider.ChatStream(ctx, aiMessages)

	var titleBuilder strings.Builder
	done := false
	for !done {
		select {
		case content, ok := <-contentChan:
			if !ok {
				done = true
			} else {
				titleBuilder.WriteString(content)
			}
		case <-errChan:
			done = true
		}
	}

	title := strings.TrimSpace(titleBuilder.String())
	if title == "" {
		title = "新对话"
	}

	runes := []rune(title)
	if len(runes) > 20 {
		title = string(runes[:20])
	}

	err := l.svcCtx.AssistantConversationsModel.UpdateTitle(ctx, conversationId, title)
	if err != nil {
		logx.Errorf("Failed to update conversation title: %v", err)
	}
}

func (l *AssistantChatStreamLogic) sendSSEEvent(w http.ResponseWriter, flusher http.Flusher, eventType string, data map[string]interface{}) {
	data["type"] = eventType
	jsonData, _ := json.Marshal(data)
	fmt.Fprintf(w, "event: %s\ndata: %s\n\n", eventType, string(jsonData))
	if flusher != nil {
		flusher.Flush()
	}
}