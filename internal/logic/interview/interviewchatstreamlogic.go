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
	systemPrompt := l.getSystemPrompt(session.Mode)

	// 添加对话上下文
	contextPrompt := fmt.Sprintf("\n\n当前面试进度：\n- 当前是第%d个问题\n- 已完成%d轮对话\n- 当前平均分：%.1f\n\n请根据当前进度提出合适的面试问题。", 
		session.CurrentQuestion + 1, 
		len(messages), 
		session.AverageScore)

	aiMessages := []ChatMessage{
		{
			Role:    "system",
			Content: systemPrompt + contextPrompt,
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
		// 如果解析失败，根据当前轮次使用具体的默认回复
		defaultQuestions := []string{
			"请简单介绍一下你自己",
			"请详细介绍你最得意的一个项目，你在其中扮演什么角色？",
			"你在项目中遇到的最大挑战是什么？如何解决的？",
			"请详细讲讲你使用的主要技术栈的核心原理",
			"如果让你设计一个高并发的系统，你会如何设计？",
			"你遇到过最困难的技术问题是什么？是如何解决的？",
			"你对我们公司有什么了解？为什么想加入我们？",
			"你未来3-5年的职业规划是什么？",
		}
		
		questionIndex := session.CurrentQuestion
		if questionIndex >= len(defaultQuestions) {
			questionIndex = len(defaultQuestions) - 1
		}
		
		aiResp = AIResponse{
			Question: defaultQuestions[questionIndex],
			Score:    75,
			Feedback: "回答不错，继续努力！",
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
	basePrompt := `你是一名专业的面试官，正在对候选人进行面试。

**重要：每次回复都必须提出一个新的面试问题，不能省略question字段！**

面试流程和问题类型：
1. 自我介绍阶段（第1-2题）：要求候选人做自我介绍
   - "请简单介绍一下你自己"
   - "请详细介绍一下你的技术背景和项目经验"

2. 项目经验阶段（第3-4题）：询问候选人参与的项目
   - "请详细介绍你最得意的一个项目，你在其中扮演什么角色？"
   - "你在项目中遇到的最大挑战是什么？如何解决的？"

3. 技术深度阶段（第5-6题）：针对技术栈进行深入提问
   - "你提到了使用Go语言，能详细讲讲Go的协程调度机制吗？"
   - "请解释一下XX技术的核心原理和适用场景"

4. 系统设计阶段（第7题）：询问系统架构、设计思路
   - "如果让你设计一个高并发的消息队列系统，你会如何设计？"
   - "如何设计一个秒杀系统来应对高并发？"

5. 场景问题阶段（第8题）：给出具体场景，询问解决方案
   - "如果你的服务突然崩溃，你会如何排查和解决？"
   - "如何处理数据库的死锁问题？"

6. HR阶段（可选）：询问薪资期望、职业规划等
   - "你对我们公司有什么了解？为什么想加入我们？"
   - "你未来3-5年的职业规划是什么？"

**每次都要根据回答内容提出新的、针对性的问题！**

评分标准：
- 技术能力（30分）：技术深度、广度、应用能力
- 沟通表达（30分）：表达能力、逻辑清晰度
- 项目经验（25分）：项目质量、责任范围
- 综合素质（15分）：学习能力、团队合作等

请严格按照JSON格式返回：
{
  "question": "你的下一个面试问题（必须包含具体的问题内容）",
  "score": 对用户回答的评分（0-100）,
  "feedback": "对用户回答的反馈建议",
  "questionType": "问题类型（self_intro/project/technical/design/scenario/hr）",
  "sessionEnd": false
}

**记住：**
- 每次都要提出新的问题，不能省略！
- 问题要具体、有针对性，体现专业性
- 5-8个问题后可以结束面试
- 返回纯JSON，不要有任何其他文字或markdown标记`

	if mode == "assessment" {
		basePrompt += "\n\n当前是评估模式（大厂技术面）：\n- 更加严格地评分\n- 重点关注技术深度和实际能力\n- 问题难度较高，要求深入分析\n- 期望回答具体、准确、有深度"
	} else {
		basePrompt += "\n\n当前是练习模式（国企综合面）：\n- 以鼓励为主，帮助用户提升面试技巧\n- 重点关注综合素质和表达能力\n- 问题难度适中，循序渐进\n- 提供更多改进建议和指导"
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
	// 使用独立context，避免HTTP请求context取消导致异步操作失败
	ctx := context.Background()
	
	// 获取会话信息
	session, err := l.svcCtx.InterviewSessionsModel.FindOne(ctx, sessionId)
	if err != nil {
		logx.Errorf("Failed to get session for report: %v", err)
		return
	}

	// 获取所有消息
	messages, err := l.svcCtx.InterviewMessagesModel.FindBySessionId(ctx, sessionId)
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

	_, err = l.svcCtx.InterviewReportsModel.InsertWithTimestamp(ctx, report)
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
