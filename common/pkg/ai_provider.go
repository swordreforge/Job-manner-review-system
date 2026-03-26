package pkg

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/zeromicro/go-zero/core/logx"
)

type AIProvider interface {
	GenerateJobProfile(ctx context.Context, prompt string) (string, error)
	GenerateStudentProfile(ctx context.Context, resumeContent string) (string, error)
	MatchAnalysis(ctx context.Context, studentProfile, jobProfile string) (string, error)
	GenerateCareerReport(ctx context.Context, req ReportGenerationRequest) (string, error)
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
