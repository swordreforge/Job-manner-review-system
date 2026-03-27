package main

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"
)

type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type OpenAIRequest struct {
	Model     string        `json:"model"`
	Messages  []ChatMessage `json:"messages"`
	MaxTokens int           `json:"max_tokens"`
	Stream    bool          `json:"stream"` // 新增流式标志
}

type OpenAIResponse struct {
	Choices []Choice `json:"choices"`
	Error   *AIError `json:"error,omitempty"`
}

type Choice struct {
	Message      ChatMessage `json:"message"`
	Delta        ChatMessage `json:"delta"`         // 流式响应中使用的增量内容
	FinishReason string      `json:"finish_reason"`
}

type AIError struct {
	Message string `json:"message"`
}

func main() {
	apiKey := os.Getenv("DEEPSEEK_API_KEY")
	if apiKey == "" {
		fmt.Println("Error: DEEPSEEK_API_KEY environment variable not set")
		os.Exit(1)
	}

	baseURL := "https://api.deepseek.com/v1"
	model := "deepseek-chat"

	req := OpenAIRequest{
		Model: model,
		Messages: []ChatMessage{
			{Role: "system", Content: "You are a helpful assistant."},
			{Role: "user", Content: "Say hello and confirm you are DeepSeek!"},
		},
		MaxTokens: 100,
		Stream:    true, // 启用流式传输
	}

	body, err := json.Marshal(req)
	if err != nil {
		fmt.Printf("Error marshaling request: %v\n", err)
		os.Exit(1)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	httpReq, _ := http.NewRequestWithContext(ctx, "POST", baseURL+"/chat/completions", bytes.NewReader(body))
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+apiKey)
	// 重要：告知服务端我们希望接收流式响应（SSE）
	httpReq.Header.Set("Accept", "text/event-stream")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		fmt.Printf("Error making request: %v\n", err)
		os.Exit(1)
	}
	defer resp.Body.Close()

	// 检查响应状态码
	if resp.StatusCode != http.StatusOK {
		// 非流式错误时，可能返回 JSON 错误体
		var errResp OpenAIResponse
		if err := json.NewDecoder(resp.Body).Decode(&errResp); err == nil && errResp.Error != nil {
			fmt.Printf("API Error: %s\n", errResp.Error.Message)
		} else {
			fmt.Printf("HTTP error: %s\n", resp.Status)
		}
		os.Exit(1)
	}

	// 逐行读取 SSE 数据流
	reader := bufio.NewReader(resp.Body)
	for {
		line, err := reader.ReadString('\n')
		if err != nil {
			break // 流结束或出错
		}
		line = strings.TrimSpace(line)
		// SSE 格式：以 "data: " 开头
		if strings.HasPrefix(line, "data: ") {
			data := strings.TrimPrefix(line, "data: ")
			if data == "[DONE]" {
				fmt.Println("\n[Stream finished]")
				break
			}
			var chunk OpenAIResponse
			if err := json.Unmarshal([]byte(data), &chunk); err != nil {
				fmt.Printf("Error parsing chunk: %v\n", err)
				continue
			}
			// 处理流式数据块
			if len(chunk.Choices) > 0 {
				// 增量内容在 Delta 中
				delta := chunk.Choices[0].Delta.Content
				if delta != "" {
					fmt.Print(delta) // 实时打印，不换行
				}
				// 如果设置了结束原因，可以在此处理
				if chunk.Choices[0].FinishReason != "" {
					fmt.Println() // 最后换行
				}
			}
		}
	}
}
