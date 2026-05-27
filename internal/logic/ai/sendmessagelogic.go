package ai

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	pkg "career-api/common/pkg"
	apperrors "career-api/common/errors"
	"career-api/internal/model"
	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type SendAIMessageLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewSendAIMessageLogic(ctx context.Context, svcCtx *svc.ServiceContext) *SendAIMessageLogic {
	return &SendAIMessageLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *SendAIMessageLogic) SendMessage(w http.ResponseWriter, conversationId int64, req *types.SendAIMessageReq) {
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("X-Accel-Buffering", "no")

	flusher, ok := w.(http.Flusher)
	if !ok {
		l.sendSSEEvent(w, flusher, "error", map[string]interface{}{
			"code": apperrors.CodeInternalError,
			"msg":  "SSE not supported",
		})
		return
	}

	user, err := resolveCurrentUser(l.ctx)
	if err != nil {
		l.sendSSEEvent(w, flusher, "error", map[string]interface{}{
			"code": apperrors.CodeUnauthorized,
			"msg":  "unauthorized",
		})
		return
	}

	db, err := getDB(l.ctx, l.svcCtx)
	if err != nil {
		l.sendSSEEvent(w, flusher, "error", map[string]interface{}{
			"code": apperrors.CodeInternalError,
			"msg":  "internal error",
		})
		return
	}

	var count int64
	if err := db.QueryRowContext(l.ctx,
		`SELECT COUNT(1) FROM chat_group_members WHERE group_id = ? AND user_id = ? AND user_type = ?`,
		conversationId, user.id, normalizeUserType(user.role)).Scan(&count); err != nil || count == 0 {
		l.sendSSEEvent(w, flusher, "error", map[string]interface{}{
			"code": apperrors.CodeNotFound,
			"msg":  "对话不存在",
		})
		return
	}

	var chatType string
	var interviewSessionId sql.NullInt64
	err = db.QueryRowContext(l.ctx,
		`SELECT chat_type, interview_session_id FROM chat_groups WHERE id = ?`,
		conversationId).Scan(&chatType, &interviewSessionId)
	if err != nil {
		l.sendSSEEvent(w, flusher, "error", map[string]interface{}{
			"code": apperrors.CodeNotFound,
			"msg":  "对话不存在",
		})
		return
	}

	if chatType == "interview_review" {
		l.sendMessageInterview(w, flusher, db, conversationId, interviewSessionId, req, user)
		return
	}

	l.sendMessageAssistant(w, flusher, db, conversationId, req, user)
}

func (l *SendAIMessageLogic) sendMessageAssistant(w http.ResponseWriter, flusher http.Flusher, db *sql.DB, conversationId int64, req *types.SendAIMessageReq, user currentUser) {
	now := nowUnix()
	result, err := db.ExecContext(l.ctx,
		`INSERT INTO chat_messages (group_id, sender_id, sender_type, sender_name, content, created_at)
		 VALUES (?, ?, ?, ?, ?, ?)`,
		conversationId, user.id, normalizeUserType(user.role), user.name, req.Content, now)
	if err != nil {
		l.sendSSEEvent(w, flusher, "error", map[string]interface{}{
			"code": apperrors.CodeInternalError,
			"msg":  "保存消息失败",
		})
		return
	}
	userMsgId, _ := result.LastInsertId()

	l.sendSSEEvent(w, flusher, "user_message", map[string]interface{}{
		"id":         userMsgId,
		"groupId":    conversationId,
		"senderId":   user.id,
		"senderType": normalizeUserType(user.role),
		"senderName": user.name,
		"content":    req.Content,
		"createdAt":  now,
	})

	messages := []pkg.ChatMessage{
		{Role: "system", Content: systemPrompt},
	}

	rows, err := db.QueryContext(l.ctx,
		`SELECT sender_type, content FROM chat_messages WHERE group_id = ? ORDER BY created_at ASC, id ASC`, conversationId)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var senderType, content string
			if rows.Scan(&senderType, &content) == nil {
				role := "user"
				if senderType == "assistant" {
					role = "assistant"
				}
				messages = append(messages, pkg.ChatMessage{Role: role, Content: content})
			}
		}
	}

	contentChan, errChan := l.svcCtx.AIProvider.ChatStream(l.ctx, messages)

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
			}
			done = true
		case <-l.ctx.Done():
			done = true
		}
	}

	if streamErr != nil {
		logx.Errorf("AI stream error: %v", streamErr)
		l.sendSSEEvent(w, flusher, "error", map[string]interface{}{
			"code": apperrors.CodeInternalError,
			"msg":  streamErr.Error(),
		})
		return
	}

	aiContent := fullResponse.String()
	if aiContent != "" {
		aiResult, err := db.ExecContext(l.ctx,
			`INSERT INTO chat_messages (group_id, sender_id, sender_type, sender_name, content, created_at)
			 VALUES (?, 0, 'assistant', '职途助手', ?, ?)`,
			conversationId, aiContent, nowUnix())
		if err != nil {
			logx.Errorf("save AI message failed: %v", err)
		}
		aiMsgId, _ := aiResult.LastInsertId()
		l.sendSSEEvent(w, flusher, "ai_message", map[string]interface{}{
			"id":         aiMsgId,
			"groupId":    conversationId,
			"senderId":   0,
			"senderType": "assistant",
			"senderName": "职途助手",
			"content":    aiContent,
			"createdAt":  nowUnix(),
		})
	}

	_, _ = db.ExecContext(l.ctx, `UPDATE chat_groups SET updated_at = ? WHERE id = ?`, nowUnix(), conversationId)

	l.sendSSEEvent(w, flusher, "done", map[string]interface{}{
		"message": "ok",
	})
}

type interviewAIResponse struct {
	Question     string  `json:"question"`
	Score        float64 `json:"score"`
	Feedback     string  `json:"feedback"`
	QuestionType string  `json:"questionType"`
	SessionEnd   bool    `json:"sessionEnd"`
}

func (l *SendAIMessageLogic) sendMessageInterview(w http.ResponseWriter, flusher http.Flusher, db *sql.DB, conversationId int64, interviewSessionId sql.NullInt64, req *types.SendAIMessageReq, user currentUser) {
	if !interviewSessionId.Valid || interviewSessionId.Int64 <= 0 {
		l.sendSSEEvent(w, flusher, "error", map[string]interface{}{
			"code": apperrors.CodeNotFound,
			"msg":  "未关联面试会话",
		})
		return
	}

	sessionId := interviewSessionId.Int64

	session, err := l.svcCtx.InterviewSessionsModel.FindOneByUserId(l.ctx, user.id, sessionId)
	if err != nil || session == nil {
		l.sendSSEEvent(w, flusher, "error", map[string]interface{}{
			"code": apperrors.CodeNotFound,
			"msg":  "面试会话不存在",
		})
		return
	}

	if session.Status != "running" {
		l.sendSSEEvent(w, flusher, "error", map[string]interface{}{
			"code": apperrors.CodeInvalidParams,
			"msg":  "面试已结束",
		})
		return
	}

	now := nowUnix()
	result, err := db.ExecContext(l.ctx,
		`INSERT INTO chat_messages (group_id, sender_id, sender_type, sender_name, content, created_at)
		 VALUES (?, ?, ?, ?, ?, ?)`,
		conversationId, user.id, normalizeUserType(user.role), user.name, req.Content, now)
	if err != nil {
		l.sendSSEEvent(w, flusher, "error", map[string]interface{}{
			"code": apperrors.CodeInternalError,
			"msg":  "保存消息失败",
		})
		return
	}
	userMsgId, _ := result.LastInsertId()

	l.sendSSEEvent(w, flusher, "user_message", map[string]interface{}{
		"id":         userMsgId,
		"groupId":    conversationId,
		"senderId":   user.id,
		"senderType": normalizeUserType(user.role),
		"senderName": user.name,
		"content":    req.Content,
		"createdAt":  now,
	})

	_, _ = l.svcCtx.InterviewMessagesModel.InsertWithTimestamp(l.ctx, &model.InterviewMessages{
		SessionId: sessionId,
		Role:      "user",
		Content:   req.Content,
		CreatedAt: now,
	})

	interviewMessages, _ := l.svcCtx.InterviewMessagesModel.FindBySessionId(l.ctx, sessionId)

	systemPromptContent := getInterviewSystemPrompt(session.Mode)
	contextPrompt := fmt.Sprintf("\n\n当前面试进度：\n- 当前是第%d个问题\n- 已完成%d轮对话\n- 当前平均分：%.1f\n\n请根据当前进度提出合适的面试问题。",
		session.CurrentQuestion+1,
		len(interviewMessages),
		session.AverageScore)

	aiMessages := []pkg.ChatMessage{
		{Role: "system", Content: systemPromptContent + contextPrompt},
	}

	for _, msg := range interviewMessages {
		aiMessages = append(aiMessages, pkg.ChatMessage{
			Role:    msg.Role,
			Content: msg.Content,
		})
	}

	contentChan, errChan := l.svcCtx.AIProvider.ChatStream(l.ctx, aiMessages)

	var fullResponse strings.Builder
	done := false
	var streamErr error
	lastExtractedText := ""

	for !done {
		select {
		case content, ok := <-contentChan:
			if !ok {
				done = true
			} else {
				fullResponse.WriteString(content)
				extractedText := extractTextFromPartialJSON(fullResponse.String())
				if extractedText != lastExtractedText {
					newContent := extractedText[len(lastExtractedText):]
					if newContent != "" {
						l.sendSSEEvent(w, flusher, "chunk", map[string]interface{}{
							"content": newContent,
						})
					}
					lastExtractedText = extractedText
				}
			}
		case err := <-errChan:
			if err != nil {
				streamErr = err
			}
			done = true
		case <-l.ctx.Done():
			done = true
		}
	}

	if streamErr != nil {
		logx.Errorf("Interview AI stream error: %v", streamErr)
		l.sendSSEEvent(w, flusher, "error", map[string]interface{}{
			"code": apperrors.CodeInternalError,
			"msg":  streamErr.Error(),
		})
		return
	}

	var aiResp interviewAIResponse
	if err := json.Unmarshal([]byte(fullResponse.String()), &aiResp); err != nil {
		logx.Errorf("Failed to parse interview AI response: %v", err)
		defaultQuestions := []string{
			"请简单介绍一下你自己",
			"请详细介绍你最得意的一个项目，你在其中扮演什么角色？",
			"你在项目中遇到的最大挑战是什么？如何解决的？",
			"请详细讲讲你使用的主要技术栈的核心原理",
			"如果让你设计一个高并发的系统，你会如何设计？",
		}
		questionIndex := int(session.CurrentQuestion)
		if questionIndex >= len(defaultQuestions) {
			questionIndex = len(defaultQuestions) - 1
		}
		aiResp = interviewAIResponse{
			Question:     defaultQuestions[questionIndex],
			Score:        75,
			Feedback:     "回答不错，继续努力！",
			QuestionType: "followup",
			SessionEnd:   false,
		}
	}

	l.sendSSEEvent(w, flusher, "question", map[string]interface{}{
		"content": aiResp.Question,
	})

	l.sendSSEEvent(w, flusher, "score", map[string]interface{}{
		"value": aiResp.Score,
	})

	l.sendSSEEvent(w, flusher, "feedback", map[string]interface{}{
		"content": aiResp.Feedback,
	})

	if aiResp.Score > 0 {
		_ = l.svcCtx.InterviewSessionsModel.UpdateStats(l.ctx, sessionId, aiResp.Score)
	}

	updatedSession, _ := l.svcCtx.InterviewSessionsModel.FindOne(l.ctx, sessionId)
	if updatedSession != nil {
		l.sendSSEEvent(w, flusher, "session_update", map[string]interface{}{
			"sessionId":      updatedSession.Id,
			"currentQuestion": updatedSession.CurrentQuestion,
			"averageScore":   updatedSession.AverageScore,
		})
	}

	aiContent := aiResp.Question
	_, _ = db.ExecContext(l.ctx,
		`INSERT INTO chat_messages (group_id, sender_id, sender_type, sender_name, content, created_at)
		 VALUES (?, 0, 'assistant', '面试官', ?, ?)`,
		conversationId, aiContent, nowUnix())

	_, _ = l.svcCtx.InterviewMessagesModel.InsertWithTimestamp(l.ctx, &model.InterviewMessages{
		SessionId:    sessionId,
		Role:         "assistant",
		Content:      fullResponse.String(),
		QuestionType: sql.NullString{String: aiResp.QuestionType, Valid: true},
		Score:        sql.NullFloat64{Float64: aiResp.Score, Valid: true},
		Feedback:     sql.NullString{String: aiResp.Feedback, Valid: true},
		CreatedAt:    nowUnix(),
	})

	if aiResp.SessionEnd || (updatedSession != nil && updatedSession.CurrentQuestion >= 10) {
		duration := int(nowUnix() - session.CreatedAt)
		_ = l.svcCtx.InterviewSessionsModel.EndSession(l.ctx, sessionId, duration, "completed")
		l.sendSSEEvent(w, flusher, "done", map[string]interface{}{
			"message":     "面试结束",
			"reportId":    sessionId,
			"sessionEnd":  true,
		})
	} else {
		l.sendSSEEvent(w, flusher, "done", map[string]interface{}{
			"message": "ok",
		})
	}

	_, _ = db.ExecContext(l.ctx, `UPDATE chat_groups SET updated_at = ? WHERE id = ?`, nowUnix(), conversationId)
}

func (l *SendAIMessageLogic) sendSSEEvent(w http.ResponseWriter, flusher http.Flusher, eventType string, data interface{}) {
	jsonData, _ := json.Marshal(data)
	fmt.Fprintf(w, "event: %s\n", eventType)
	fmt.Fprintf(w, "data: %s\n\n", jsonData)
	flusher.Flush()
}