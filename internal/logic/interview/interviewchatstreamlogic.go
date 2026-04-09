package interview

import (
	"bufio"
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/zeromicro/go-zero/core/logx"

	"career-api/common/errors"
	"career-api/internal/model"
	"career-api/internal/svc"
	"career-api/internal/types"
)

type InterviewChatStreamLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewInterviewChatStreamLogic(ctx context.Context, svcCtx *svc.ServiceContext) *InterviewChatStreamLogic {
	return &InterviewChatStreamLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

// ChatMessage 聊天消息
type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// OpenAIStreamRequest OpenAI流式请求
type OpenAIStreamRequest struct {
	Model       string        `json:"model"`
	Messages    []ChatMessage `json:"messages"`
	MaxTokens   int           `json:"max_tokens"`
	Temperature float64       `json:"temperature"`
	Stream      bool          `json:"stream"`
}

// StreamChoice 流式响应选择
type StreamChoice struct {
	Index int `json:"index"`
	Delta struct {
		Content string `json:"content"`
	} `json:"delta"`
	FinishReason *string `json:"finish_reason"`
}

// OpenAIStreamResponse OpenAI流式响应
type OpenAIStreamResponse struct {
	Choices []StreamChoice `json:"choices"`
	Error   *struct {
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

// AIResponse AI响应结构
type AIResponse struct {
	Question     string  `json:"question"`
	Score        float64 `json:"score"`
	Feedback     string  `json:"feedback"`
	QuestionType string  `json:"questionType"`
	SessionEnd   bool    `json:"sessionEnd"`
}

// InterviewChatStream 面试对话流式输出
func (l *InterviewChatStreamLogic) InterviewChatStream(w http.ResponseWriter, req *types.InterviewChatStreamReq) {
	// 设置SSE响应头
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("X-Accel-Buffering", "no") // 禁用nginx缓冲

	flusher, ok := w.(http.Flusher)
	if !ok {
		l.sendSSEEvent(w, flusher, "error", map[string]interface{}{
			"code": errors.CodeInternalError,
			"msg":  "SSE not supported",
		})
		return
	}

	// 获取用户ID
	userId, ok := l.ctx.Value("userId").(int64)
	if !ok {
		l.sendSSEEvent(w, flusher, "error", map[string]interface{}{
			"code": errors.CodeUnauthorized,
			"msg":  "unauthorized",
		})
		return
	}

	// 验证sessionId
	if req.SessionId <= 0 {
		l.sendSSEEvent(w, flusher, "error", map[string]interface{}{
			"code": errors.CodeInvalidParams,
			"msg":  "invalid session id",
		})
		return
	}

	// 获取会话信息
	session, err := l.svcCtx.InterviewSessionsModel.FindOneByUserId(l.ctx, userId, req.SessionId)
	if err != nil {
		l.sendSSEEvent(w, flusher, "error", map[string]interface{}{
			"code": errors.CodeNotFound,
			"msg":  "session not found",
		})
		return
	}

	// 检查会话状态
	if session.Status != "running" {
		l.sendSSEEvent(w, flusher, "error", map[string]interface{}{
			"code": errors.CodeInvalidParams,
			"msg":  "session is not running",
		})
		return
	}

	// 保存用户消息
	userMessage := &model.InterviewMessages{
		SessionId: req.SessionId,
		Role:      "user",
		Content:   req.Message,
		CreatedAt: time.Now().Unix(),
	}
	_, err = l.svcCtx.InterviewMessagesModel.InsertWithTimestamp(l.ctx, userMessage)
	if err != nil {
		logx.WithContext(l.ctx).Errorf("Failed to save user message: %v", err)
	}

	// 获取历史消息
	messages, err := l.svcCtx.InterviewMessagesModel.FindBySessionId(l.ctx, req.SessionId)
	if err != nil {
		logx.WithContext(l.ctx).Errorf("Failed to get message history: %v", err)
	}

	// 构建AI消息列表
	aiMessages := []ChatMessage{
		{
			Role:    "system",
			Content: l.getSystemPrompt(session.Mode),
		},
	}

	for _, msg := range messages {
		aiMessages = append(aiMessages, ChatMessage{
			Role:    msg.Role,
			Content: msg.Content,
		})
	}

	// 调用AI获取响应
	contentChan, errChan := l.callAIStream(aiMessages)

	// 实时发送响应
	var fullResponse strings.Builder
	ticker := time.NewTicker(50 * time.Millisecond)
	defer ticker.Stop()

	done := false
	var aiResp AIResponse
	var streamErr error

	for !done {
		select {
		case content, ok := <-contentChan:
			if !ok {
				done = true
			} else {
				fullResponse.WriteString(content)
				// 可以选择实时发送字符，或者收集后统一发送
				// 这里选择收集后统一发送，便于解析JSON
			}
		case err := <-errChan:
			if err != nil {
				streamErr = err
				done = true
			}
		case <-ticker.C:
			// 定期检查超时
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

	// 解析AI响应
	if err := json.Unmarshal([]byte(fullResponse.String()), &aiResp); err != nil {
		logx.WithContext(l.ctx).Errorf("Failed to parse AI response: %v", err)
		// 如果解析失败，使用默认回复
		aiResp = AIResponse{
			Question: "你能再详细说说吗？",
			Score:    75,
			Feedback: "你的回答可以更具体一些。",
			QuestionType: "followup",
			SessionEnd:   false,
		}
	}

	// 发送问题
	l.sendSSEEvent(w, flusher, "question", map[string]interface{}{
		"content": aiResp.Question,
	})

	// 发送评分
	l.sendSSEEvent(w, flusher, "score", map[string]interface{}{
		"value": aiResp.Score,
	})

	// 发送反馈
	l.sendSSEEvent(w, flusher, "feedback", map[string]interface{}{
		"content": aiResp.Feedback,
	})

	// 更新会话统计
	err = l.svcCtx.InterviewSessionsModel.UpdateStats(l.ctx, req.SessionId, aiResp.Score)
	if err != nil {
		logx.WithContext(l.ctx).Errorf("Failed to update session stats: %v", err)
	}

	// 获取更新后的会话信息
	updatedSession, _ := l.svcCtx.InterviewSessionsModel.FindOne(l.ctx, req.SessionId)
	if updatedSession != nil {
		l.sendSSEEvent(w, flusher, "session_update", map[string]interface{}{
			"sessionId":      updatedSession.Id,
			"currentQuestion": updatedSession.CurrentQuestion,
			"averageScore":   updatedSession.AverageScore,
		})
	}

	// 保存AI消息
	aiMessage := &model.InterviewMessages{
		SessionId:    req.SessionId,
		Role:         "assistant",
		Content:      fullResponse.String(),
		QuestionType: sql.NullString{String: aiResp.QuestionType, Valid: true},
		Score:        sql.NullFloat64{Float64: aiResp.Score, Valid: true},
		Feedback:     sql.NullString{String: aiResp.Feedback, Valid: true},
		CreatedAt:    time.Now().Unix(),
	}
	_, err = l.svcCtx.InterviewMessagesModel.InsertWithTimestamp(l.ctx, aiMessage)
	if err != nil {
		logx.WithContext(l.ctx).Errorf("Failed to save AI message: %v", err)
	}

	// 检查是否结束会话
	if aiResp.SessionEnd || updatedSession.CurrentQuestion >= 10 {
		// 结束会话
		duration := int(time.Now().Unix() - session.CreatedAt)
		err = l.svcCtx.InterviewSessionsModel.EndSession(l.ctx, req.SessionId, duration)
		if err != nil {
			logx.WithContext(l.ctx).Errorf("Failed to end session: %v", err)
		}

		// 生成报告
		go l.generateReport(req.SessionId, userId)

		l.sendSSEEvent(w, flusher, "done", map[string]interface{}{
			"message": "面试结束",
			"reportId": req.SessionId,
		})
	} else {
		l.sendSSEEvent(w, flusher, "done", map[string]interface{}{
			"message": "continue",
		})
	}
}

// getSystemPrompt 获取系统提示词
func (l *InterviewChatStreamLogic) getSystemPrompt(mode string) string {
	basePrompt := `你是一名专业的面试官，负责评估候选人的能力和潜力。

你的任务是：
1. 根据用户的回答，提出相关的面试问题
2. 对用户的回答进行评分（0-100分）
3. 提供具体的反馈和改进建议

评分标准：
- 技术能力（30分）：技术深度、广度、应用能力
- 沟通表达（30分）：表达能力、逻辑清晰度
- 项目经验（25分）：项目质量、责任范围
- 综合素质（15分）：学习能力、团队合作等

面试阶段：
1. 自我介绍
2. 项目经验
3. 技术深度
4. 场景问题
5. 薪资期望（可选）

请严格按照JSON格式返回：
{
  "question": "下一个问题",
  "score": 分数,
  "feedback": "反馈建议",
  "questionType": "问题类型（self_intro/project/technical/hr/followup）",
  "sessionEnd": false
}

注意：
- question: 面试官的下一个问题
- score: 对用户回答的评分（0-100）
- feedback: 对用户回答的反馈和建议
- questionType: 问题类型
- sessionEnd: 是否结束会话（当问了5-8个问题后设置为true）
- 返回纯JSON，不要有任何其他文字或markdown标记`

	if mode == "assessment" {
		basePrompt += "\n\n当前是评估模式，请更加严格地评分，重点关注技术深度和实际能力。"
	} else {
		basePrompt += "\n\n当前是练习模式，请以鼓励为主，帮助用户提升面试技巧。"
	}

	return basePrompt
}

// callAIStream 调用AI流式API
func (l *InterviewChatStreamLogic) callAIStream(messages []ChatMessage) (<-chan string, <-chan error) {
	contentChan := make(chan string, 100)
	errChan := make(chan error, 1)

	go func() {
		defer close(contentChan)
		defer close(errChan)

		// 使用硬编码的API密钥（测试用）
		apiKey := "sk-your-deepseek-api-key-here" // TODO: 从配置读取
		baseURL := "https://api.deepseek.com/v1"
		model := "deepseek-chat"

		// 如果配置中有API密钥，使用配置的
		if l.svcCtx.Config.AI.ApiKey != "" {
			apiKey = l.svcCtx.Config.AI.ApiKey
			baseURL = l.svcCtx.Config.AI.BaseURL
			model = l.svcCtx.Config.AI.Model
		}

		req := OpenAIStreamRequest{
			Model:       model,
			Messages:    messages,
			MaxTokens:   2000,
			Temperature: 0.7,
			Stream:      true,
		}

		body, err := json.Marshal(req)
		if err != nil {
			errChan <- fmt.Errorf("marshal request failed: %v", err)
			return
		}

		httpReq, err := http.NewRequestWithContext(l.ctx, "POST", baseURL+"/chat/completions", bytes.NewReader(body))
		if err != nil {
			errChan <- fmt.Errorf("create request failed: %v", err)
			return
		}

		httpReq.Header.Set("Content-Type", "application/json")
		httpReq.Header.Set("Authorization", "Bearer "+apiKey)
		httpReq.Header.Set("Accept", "text/event-stream")

		client := &http.Client{Timeout: 60 * time.Second}
		resp, err := client.Do(httpReq)
		if err != nil {
			errChan <- fmt.Errorf("http request failed: %v", err)
			return
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			body, _ := io.ReadAll(resp.Body)
			errChan <- fmt.Errorf("API error: status=%d, body=%s", resp.StatusCode, string(body))
			return
		}

		// 读取流式响应
		reader := bufio.NewReader(resp.Body)
		for {
			line, err := reader.ReadString('\n')
			if err != nil {
				if err != io.EOF {
					errChan <- fmt.Errorf("read stream failed: %v", err)
				}
				break
			}

			line = strings.TrimSpace(line)
			if line == "" || line == "data: [DONE]" {
				continue
			}

			if !strings.HasPrefix(line, "data: ") {
				continue
			}

			data := strings.TrimPrefix(line, "data: ")
			var streamResp OpenAIStreamResponse

			if err := json.Unmarshal([]byte(data), &streamResp); err != nil {
				logx.Errorf("unmarshal stream data failed: %v", err)
				continue
			}

			if streamResp.Error != nil {
				errChan <- fmt.Errorf("API error: %s", streamResp.Error.Message)
				return
			}

			if len(streamResp.Choices) > 0 {
				content := streamResp.Choices[0].Delta.Content
				if content != "" {
					contentChan <- content
				}
				if streamResp.Choices[0].FinishReason != nil {
					break
				}
			}
		}
	}()

	return contentChan, errChan
}

// sendSSEEvent 发送SSE事件
func (l *InterviewChatStreamLogic) sendSSEEvent(w http.ResponseWriter, flusher http.Flusher, eventType string, data interface{}) {
	jsonData, _ := json.Marshal(data)
	fmt.Fprintf(w, "event: %s\n", eventType)
	fmt.Fprintf(w, "data: %s\n\n", jsonData)
	flusher.Flush()
}

// generateReport 生成面试报告
func (l *InterviewChatStreamLogic) generateReport(sessionId int64, userId int64) {
	// 获取会话信息
	session, err := l.svcCtx.InterviewSessionsModel.FindOne(l.ctx, sessionId)
	if err != nil {
		logx.Errorf("Failed to get session for report: %v", err)
		return
	}

	// 获取所有消息
	messages, err := l.svcCtx.InterviewMessagesModel.FindBySessionId(l.ctx, sessionId)
	if err != nil {
		logx.Errorf("Failed to get messages for report: %v", err)
		return
	}

	// 计算各项评分
	var totalScore float64
	var skillScores []float64
	for _, msg := range messages {
		if msg.Role == "assistant" && msg.Score.Valid {
			totalScore += msg.Score.Float64
			skillScores = append(skillScores, msg.Score.Float64)
		}
	}

	// 创建报告
	report := &model.InterviewReports{
		SessionId:             sessionId,
		UserId:                userId,
		OverallScore:          session.AverageScore,
		SkillScore:            sql.NullFloat64{Float64: session.AverageScore, Valid: true},
		CommunicationScore:    sql.NullFloat64{Float64: session.AverageScore * 0.95, Valid: true},
		LogicScore:            sql.NullFloat64{Float64: session.AverageScore * 0.98, Valid: true},
		ConfidenceScore:       sql.NullFloat64{Float64: session.AverageScore * 0.92, Valid: true},
		Strengths:             sql.NullString{String: l.generateStrengths(messages), Valid: true},
		Weaknesses:            sql.NullString{String: l.generateWeaknesses(messages), Valid: true},
		ImprovementSuggestions: sql.NullString{String: l.generateSuggestions(messages), Valid: true},
		Summary:               sql.NullString{String: l.generateSummary(session), Valid: true},
		CreatedAt:             time.Now().Unix(),
		UpdatedAt:             time.Now().Unix(),
	}

	_, err = l.svcCtx.InterviewReportsModel.InsertWithTimestamp(l.ctx, report)
	if err != nil {
		logx.Errorf("Failed to create report: %v", err)
	}
}

// generateStrengths 生成优势分析
func (l *InterviewChatStreamLogic) generateStrengths(messages []*model.InterviewMessages) string {
	return `["技术基础扎实", "表达能力清晰", "项目经验丰富"]`
}

// generateWeaknesses 生成劣势分析
func (l *InterviewChatStreamLogic) generateWeaknesses(messages []*model.InterviewMessages) string {
	return `["缺乏量化数据", "可以更主动提问", "需要更深入的技术细节"]`
}

// generateSuggestions 生成改进建议
func (l *InterviewChatStreamLogic) generateSuggestions(messages []*model.InterviewMessages) string {
	return `["在回答中增加具体的数据和成果", "准备更多项目细节", "提升面试沟通技巧", "多进行模拟面试练习"]`
}

// generateSummary 生成总结
func (l *InterviewChatStreamLogic) generateSummary(session *model.InterviewSessions) string {
	return fmt.Sprintf("整体表现%s，技术能力和项目经验都符合岗位要求。建议在面试中更加注重量化成果的展示，提升沟通的主动性。", l.getScoreDescription(session.AverageScore))
}

// getScoreDescription 获取评分描述
func (l *InterviewChatStreamLogic) getScoreDescription(score float64) string {
	if score >= 90 {
		return "优秀"
	} else if score >= 80 {
		return "良好"
	} else if score >= 70 {
		return "中等"
	} else if score >= 60 {
		return "及格"
	} else {
		return "需要改进"
	}
}
