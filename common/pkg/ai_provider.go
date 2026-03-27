package pkg

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/zeromicro/go-zero/core/logx"
)

type AIProvider interface {
	GenerateJobProfile(ctx context.Context, prompt string) (string, error)
	GenerateStudentProfile(ctx context.Context, resumeContent string) (string, error)
	MatchAnalysis(ctx context.Context, studentProfile, jobProfile string) (string, error)
	GenerateCareerReport(ctx context.Context, req ReportGenerationRequest) (string, error)
	GenerateCareerReportStream(ctx context.Context, req ReportGenerationRequest) (<-chan string, <-chan error)
}

type ReportGenerationRequest struct {
	StudentProfile string
	JobProfile     string
	MatchResult    string
	Options        ReportOptions
}

type ReportOptions struct {
	IncludeGapAnalysis bool
	IncludeActionPlan  bool
	DetailedLevel      int
}

type OpenAIProvider struct {
	apiKey  string
	model   string
	baseURL string
	timeout time.Duration
}

func NewOpenAIProvider(apiKey, model, baseURL string, timeout time.Duration) *OpenAIProvider {
	return &OpenAIProvider{
		apiKey:  apiKey,
		model:   model,
		baseURL: baseURL,
		timeout: timeout,
	}
}

type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type OpenAIRequest struct {
	Model       string        `json:"model"`
	Messages    []ChatMessage `json:"messages"`
	MaxTokens   int           `json:"max_tokens"`
	Temperature float64       `json:"temperature"`
	Stream      bool          `json:"stream"`
}

type StreamChoice struct {
	Index int `json:"index"`
	Delta struct {
		Content string `json:"content"`
	} `json:"delta"`
	FinishReason *string `json:"finish_reason"`
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
	Code    string `json:"code,omitempty"`
}

func (p *OpenAIProvider) callAPI(ctx context.Context, req OpenAIRequest) (string, error) {
	body, err := json.Marshal(req)
	if err != nil {
		return "", err
	}

	c := &http.Client{Timeout: p.timeout}
	httpReq, _ := http.NewRequestWithContext(ctx, "POST", p.baseURL+"/chat/completions", bytes.NewReader(body))
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+p.apiKey)

	resp, err := c.Do(httpReq)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var openAIResp OpenAIResponse
	if err := json.NewDecoder(resp.Body).Decode(&openAIResp); err != nil {
		return "", err
	}

	if openAIResp.Error != nil {
		return "", fmt.Errorf("openai error: %s", openAIResp.Error.Message)
	}

	if len(openAIResp.Choices) == 0 {
		return "", fmt.Errorf("no choices returned")
	}

	return openAIResp.Choices[0].Message.Content, nil
}

func (p *OpenAIProvider) GenerateJobProfile(ctx context.Context, prompt string) (string, error) {
	req := OpenAIRequest{
		Model: p.model,
		Messages: []ChatMessage{
			{Role: "system", Content: "You are a professional HR analyst. Generate job profiles based on the provided information."},
			{Role: "user", Content: prompt},
		},
		MaxTokens:   2000,
		Temperature: 0.7,
	}

	content, err := p.callAPI(ctx, req)
	if err != nil {
		logx.Errorf("GenerateJobProfile failed: %v", err)
		return "", err
	}

	return content, nil
}

func (p *OpenAIProvider) GenerateStudentProfile(ctx context.Context, resumeContent string) (string, error) {
	req := OpenAIRequest{
		Model: p.model,
		Messages: []ChatMessage{
			{Role: "system", Content: "You are a career advisor. Analyze the resume and extract student capabilities, skills, and profile information."},
			{Role: "user", Content: resumeContent},
		},
		MaxTokens:   2000,
		Temperature: 0.7,
	}

	content, err := p.callAPI(ctx, req)
	if err != nil {
		logx.Errorf("GenerateStudentProfile failed: %v", err)
		return "", err
	}

	return content, nil
}

func (p *OpenAIProvider) MatchAnalysis(ctx context.Context, studentProfile, jobProfile string) (string, error) {
	prompt := fmt.Sprintf("Student Profile:\n%s\n\nJob Profile:\n%s\n\nAnalyze the match between student and job.", studentProfile, jobProfile)

	req := OpenAIRequest{
		Model: p.model,
		Messages: []ChatMessage{
			{Role: "system", Content: "You are a career matching expert. Analyze job-student compatibility and provide detailed matching scores."},
			{Role: "user", Content: prompt},
		},
		MaxTokens:   1500,
		Temperature: 0.5,
	}

	content, err := p.callAPI(ctx, req)
	if err != nil {
		logx.Errorf("MatchAnalysis failed: %v", err)
		return "", err
	}

	return content, nil
}

func (p *OpenAIProvider) GenerateCareerReport(ctx context.Context, req ReportGenerationRequest) (string, error) {
	prompt := fmt.Sprintf("Generate a comprehensive career development report based on:\n\nStudent Profile:\n%s\n\nTarget Job:\n%s\n\nMatch Analysis:\n%s\n\nOptions: IncludeGapAnalysis=%v, IncludeActionPlan=%v, DetailedLevel=%d",
		req.StudentProfile, req.JobProfile, req.MatchResult, req.Options.IncludeGapAnalysis, req.Options.IncludeActionPlan, req.Options.DetailedLevel)

	apiReq := OpenAIRequest{
		Model: p.model,
		Messages: []ChatMessage{
			{Role: "system", Content: "You are a professional career planning expert. Generate detailed, actionable career development reports."},
			{Role: "user", Content: prompt},
		},
		MaxTokens:   4000,
		Temperature: 0.7,
	}

	content, err := p.callAPI(ctx, apiReq)
	if err != nil {
		logx.Errorf("GenerateCareerReport failed: %v", err)
		return "", err
	}

	return content, nil
}

// GenerateCareerReportStream 流式生成职业规划报告
func (p *OpenAIProvider) GenerateCareerReportStream(ctx context.Context, req ReportGenerationRequest) (<-chan string, <-chan error) {
	contentChan := make(chan string, 100)
	errChan := make(chan error, 1)

	go func() {
		defer close(contentChan)
		defer close(errChan)

		prompt := fmt.Sprintf(`You are a professional career planning expert. Generate a comprehensive career development report in JSON format based on:

Student Profile:
%s

Please analyze and generate a report with the following JSON structure:
{
  "skills": [
    {"name": "技能名称", "level": 0-100, "status": "已掌握/学习中/待学习"}
  ],
  "timeline": [
    {"date": "时间", "title": "标题", "desc": "描述"}
  ],
  "completeness": 0-100,
  "competitiveness": 0-100
}

Requirements:
1. Provide 5-8 key skills with realistic levels
2. Create a career development timeline with 5-7 milestones
3. Calculate realistic completeness and competitiveness scores
4. Return ONLY valid JSON, no other text
`, req.StudentProfile)

		apiReq := OpenAIRequest{
			Model: p.model,
			Messages: []ChatMessage{
				{Role: "system", Content: "You are a career planning expert who responds in valid JSON format."},
				{Role: "user", Content: prompt},
			},
			MaxTokens:   4000,
			Temperature: 0.7,
			Stream:      true, // 启用流式输出
		}

		body, err := json.Marshal(apiReq)
		if err != nil {
			errChan <- fmt.Errorf("marshal request failed: %v", err)
			return
		}

		c := &http.Client{Timeout: p.timeout}
		httpReq, _ := http.NewRequestWithContext(ctx, "POST", p.baseURL+"/chat/completions", bytes.NewReader(body))
		httpReq.Header.Set("Content-Type", "application/json")
		httpReq.Header.Set("Authorization", "Bearer "+p.apiKey)

		resp, err := c.Do(httpReq)
		if err != nil {
			errChan <- fmt.Errorf("http request failed: %v", err)
			return
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			errChan <- fmt.Errorf("unexpected status code: %d", resp.StatusCode)
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
			var streamResp struct {
				Choices []StreamChoice `json:"choices"`
				Error   *AIError       `json:"error,omitempty"`
			}

			if err := json.Unmarshal([]byte(data), &streamResp); err != nil {
				logx.Errorf("unmarshal stream data failed: %v", err)
				continue
			}

			if streamResp.Error != nil {
				errChan <- fmt.Errorf("api error: %s", streamResp.Error.Message)
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

		logx.Infof("Stream generation completed")
	}()

	return contentChan, errChan
}
