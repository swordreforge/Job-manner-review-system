package main

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

// ChatMessage 表示对话消息
type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// OpenAIRequest 表示OpenAI API请求
type OpenAIRequest struct {
	Model       string        `json:"model"`
	Messages    []ChatMessage `json:"messages"`
	MaxTokens   int           `json:"max_tokens"`
	Temperature float64       `json:"temperature"`
	Stream      bool          `json:"stream"`
}

// StreamChoice 表示流式响应的选择
type StreamChoice struct {
	Index int `json:"index"`
	Delta struct {
		Content string `json:"content"`
	} `json:"delta"`
	FinishReason *string `json:"finish_reason"`
}

// OpenAIStreamResponse 表示OpenAI流式响应
type OpenAIStreamResponse struct {
	Choices []StreamChoice `json:"choices"`
	Error   *AIError       `json:"error,omitempty"`
}

// AIError 表示API错误
type AIError struct {
	Message string `json:"message"`
	Code    string `json:"code,omitempty"`
}

// InterviewSession 表示面试会话
type InterviewSession struct {
	History   []ChatMessage
	Question  string
	Answer    string
	Score     float64
	Feedback  string
	StartTime time.Time
}

// InterviewAI 面试AI服务
type InterviewAI struct {
	apiKey  string
	baseURL string
	model   string
	timeout time.Duration
	client  *http.Client
}

// NewInterviewAI 创建面试AI服务
func NewInterviewAI(apiKey, baseURL, model string, timeout time.Duration) *InterviewAI {
	return &InterviewAI{
		apiKey:  apiKey,
		baseURL: baseURL,
		model:   model,
		timeout: timeout,
		client: &http.Client{
			Timeout: timeout,
		},
	}
}

// InterviewQuestion 面试问题结构
type InterviewQuestion struct {
	Question string
	Content  string
}

// InterviewStream 流式面试
func (ai *InterviewAI) InterviewStream(ctx context.Context, session *InterviewSession, userMessage string) (<-chan string, <-chan error, <-chan InterviewQuestion) {
	contentChan := make(chan string, 100)
	errChan := make(chan error, 1)
	questionChan := make(chan InterviewQuestion, 1)

	go func() {
		defer close(contentChan)
		defer close(errChan)
		defer close(questionChan)

		// 添加用户消息到历史
		session.History = append(session.History, ChatMessage{
			Role:    "user",
			Content: userMessage,
		})

		// 构建系统提示词
		systemPrompt := `你是一名专业的面试官。你的任务是：
1. 根据用户的回答，给出一个相关问题
2. 对用户的回答进行评分（0-100分）
3. 提供反馈建议

请严格按照以下JSON格式返回每个回答：
{
  "question": "你的问题内容",
  "score": 分数,
  "feedback": "反馈内容"
}

要求：
- question: 面试官的下一个问题
- score: 对用户回答的评分（0-100）
- feedback: 对用户回答的反馈和建议
- 返回纯JSON，不要有任何其他文字或markdown标记`

		messages := []ChatMessage{
			{Role: "system", Content: systemPrompt},
		}
		messages = append(messages, session.History...)

		req := OpenAIRequest{
			Model:       ai.model,
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

		httpReq, err := http.NewRequestWithContext(ctx, "POST", ai.baseURL+"/chat/completions", bytes.NewReader(body))
		if err != nil {
			errChan <- fmt.Errorf("create request failed: %v", err)
			return
		}

		httpReq.Header.Set("Content-Type", "application/json")
		httpReq.Header.Set("Authorization", "Bearer "+ai.apiKey)
		httpReq.Header.Set("Accept", "text/event-stream")

		resp, err := ai.client.Do(httpReq)
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
		var fullResponse strings.Builder

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
					fullResponse.WriteString(content)
				}
				if streamResp.Choices[0].FinishReason != nil {
					break
				}
			}
		}

		// 解析完整的JSON响应
		var response struct {
			Question string  `json:"question"`
			Score    float64 `json:"score"`
			Feedback string  `json:"feedback"`
		}

		if err := json.Unmarshal([]byte(fullResponse.String()), &response); err != nil {
			errChan <- fmt.Errorf("parse response failed: %v", err)
			return
		}

		// 保存结果到会话
		session.Score = response.Score
		session.Feedback = response.Feedback
		session.Question = response.Question

		// 添加AI回复到历史
		session.History = append(session.History, ChatMessage{
			Role:    "assistant",
			Content: fullResponse.String(),
		})

		// 发送下一个问题
		questionChan <- InterviewQuestion{
			Question: response.Question,
			Content:  fmt.Sprintf("评分: %.1f\n反馈: %s\n\n下一个问题: %s", response.Score, response.Feedback, response.Question),
		}
	}()

	return contentChan, errChan, questionChan
}

func main() {
	// 从环境变量获取API密钥
	apiKey := os.Getenv("DEEPSEEK_API_KEY")
	if apiKey == "" {
		fmt.Println("❌ 错误: 未设置 DEEPSEEK_API_KEY 环境变量")
		fmt.Println("请先设置环境变量: export DEEPSEEK_API_KEY=your_api_key")
		os.Exit(1)
	}

	// 初始化面试AI服务
	ai := NewInterviewAI(
		apiKey,
		"https://api.deepseek.com/v1",
		"deepseek-chat",
		60*time.Second,
	)

	fmt.Println("🎤 欢迎使用面试模拟系统")
	fmt.Println("📝 这是一个传统的打字问答面试系统")
	fmt.Println("💡 输入 'quit' 或 'exit' 退出")
	fmt.Println(strings.Repeat("=", 50))

	// 创建面试会话
	session := &InterviewSession{
		History:   []ChatMessage{},
		StartTime: time.Now(),
	}

	// 第一个问题
	fmt.Println("\n🤔 面试官: 请先做一个简单的自我介绍")
	fmt.Print("👤 你: ")

	reader := bufio.NewReader(os.Stdin)
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// 开始对话循环
	for {
		userInput, err := reader.ReadString('\n')
		if err != nil {
			fmt.Printf("❌ 读取输入失败: %v\n", err)
			break
		}

		userInput = strings.TrimSpace(userInput)

		// 检查退出命令
		if strings.ToLower(userInput) == "quit" || strings.ToLower(userInput) == "exit" {
			fmt.Println("\n👋 面试结束，感谢参与！")
			duration := time.Since(session.StartTime)
			fmt.Printf("⏱️  面试时长: %v\n", duration)
			break
		}

		if userInput == "" {
			fmt.Println("❌ 请输入有效的内容")
			fmt.Print("👤 你: ")
			continue
		}

		// 流式调用AI
		fmt.Print("\n🤔 面试官: ")
		contentChan, errChan, questionChan := ai.InterviewStream(ctx, session, userInput)

		// 实时显示流式输出
		var fullContent strings.Builder
		ticker := time.NewTicker(50 * time.Millisecond)
		defer ticker.Stop()

		done := false
		var nextQuestion InterviewQuestion
		var streamErr error

		for !done {
			select {
			case content, ok := <-contentChan:
				if !ok {
					done = true
				} else {
					fmt.Print(content)
					fullContent.WriteString(content)
				}
			case err := <-errChan:
				if err != nil {
					streamErr = err
					done = true
				}
			case question, ok := <-questionChan:
				if ok {
					nextQuestion = question
					done = true
				}
			case <-ticker.C:
				// 定期刷新缓冲区
			}
		}

		fmt.Println() // 换行

		if streamErr != nil {
			fmt.Printf("❌ API错误: %v\n", streamErr)
			break
		}

		// 显示下一个问题
		fmt.Println("\n" + strings.Repeat("-", 50))
		fmt.Println(nextQuestion.Content)
		fmt.Println(strings.Repeat("-", 50))
		fmt.Print("\n👤 你: ")
	}
}
