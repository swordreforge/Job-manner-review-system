package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
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
}

type OpenAIResponse struct {
	Choices []Choice `json:"choices"`
	Error   *AIError `json:"error,omitempty"`
}

type Choice struct {
	Message ChatMessage `json:"message"`
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

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		fmt.Printf("Error making request: %v\n", err)
		os.Exit(1)
	}
	defer resp.Body.Close()

	var openAIResp OpenAIResponse
	if err := json.NewDecoder(resp.Body).Decode(&openAIResp); err != nil {
		fmt.Printf("Error decoding response: %v\n", err)
		os.Exit(1)
	}

	if openAIResp.Error != nil {
		fmt.Printf("API Error: %s\n", openAIResp.Error.Message)
		os.Exit(1)
	}

	if len(openAIResp.Choices) > 0 {
		fmt.Println("✅ DeepSeek API Connection Successful!")
		fmt.Printf("Model: %s\n", model)
		fmt.Printf("Response: %s\n", openAIResp.Choices[0].Message.Content)
	} else {
		fmt.Println("❌ No response received")
		os.Exit(1)
	}
}
