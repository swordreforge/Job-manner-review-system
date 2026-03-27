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
	prompt := `你是一名专业的职业规划顾问。请分析以下简历内容，提取学生的能力、技能和个人信息，并提供简历优化建议。

请严格按照以下 JSON 格式返回，不要包含任何其他文字，不要使用 Markdown 代码块标记：

{
  "name": "姓名",
  "education": "学历枚举值",
  "major": "专业名称",
  "graduationYear": 毕业年份,
  "skills": [{"name": "技能名称", "level": 掌握程度, "years": 掌握年限}],
  "certificates": [{"name": "证书名称", "level": "等级", "year": 获得年份}],
  "softSkills": {"innovation": 创新能力, "learning": 学习能力, "pressure": 抗压能力, "communication": 沟通能力, "teamwork": 团队合作},
  "internship": [{"company": "公司名称", "position": "职位", "duration": 实习时长, "description": "工作描述"}],
  "projects": [{"name": "项目名称", "role": "角色", "description": "项目描述", "technologies": ["技术栈"]}],
  "completeness": 完整度,
  "competitiveness": 竞争力,
  "suggestions": ["优化建议1", "优化建议2", "优化建议3"]
}

字段说明：
- name: 学生姓名（字符串）
- education: 学历，必须是以下枚举值之一：high_school, bachelor, master, phd
- major: 专业名称（字符串）
- graduationYear: 毕业年份（整数，如 2025）
- skills: 技能列表，每个技能包含 name（字符串）、level（0-100整数）、years（整数）
- certificates: 证书列表，每个证书包含 name（字符串）、level（字符串）、year（整数）
- softSkills: 软技能，包含 innovation、learning、pressure、communication、teamwork（均为0-100整数）
- internship: 实习经历，包含 company、position、duration（月）、description（均为字符串，duration为整数）
- projects: 项目经历，包含 name、role、description（字符串）和 technologies（字符串数组）
- completeness: 完整度评估（0-100整数），基于简历信息的完整性
- competitiveness: 竞争力评估（0-100整数），基于简历质量和竞争力
- suggestions: 简历优化建议数组（3-5条字符串），每条建议应具体、可操作，包括但不限于：
  * 内容方面：补充缺失的重要信息（如实习经历、项目经验等）
  * 格式方面：优化简历结构和排版
  * 技能方面：建议学习或强调的技能
  * 表达方面：改善描述的清晰度和专业性

注意事项：
1. 只返回有效的 JSON，不要包含任何其他文字
2. 不要使用 Markdown 代码块标记，直接返回纯 JSON 文本
3. 如果某些字段无法提取，使用 null 或空数组
4. education 字段必须使用枚举值：high_school, bachelor, master, phd
5. 所有数值字段必须是有效的 JSON 数字
6. 所有字符串字段必须是有效的 JSON 字符串
7. suggestions 字段必须提供3-5条具体的优化建议，不能为空数组

现在分析以下简历内容：

%s`

	req := OpenAIRequest{
		Model: p.model,
		Messages: []ChatMessage{
			{Role: "system", Content: "你是一名专业的职业规划顾问，擅长分析简历并提取结构化信息。请严格按照指定的 JSON 格式返回结果，不要包含任何其他文字，不要使用 Markdown 代码块标记。"},
			{Role: "user", Content: fmt.Sprintf(prompt, resumeContent)},
		},
		MaxTokens:   3500,
		Temperature: 0.5,
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

		// 添加调试日志
		logx.Infof("Calling AI API: URL=%s, Model=%s, APIKey=%s", p.baseURL+"/chat/completions", p.model, p.apiKey[:10]+"...")

		c := &http.Client{Timeout: p.timeout}
		httpReq, _ := http.NewRequestWithContext(ctx, "POST", p.baseURL+"/chat/completions", bytes.NewReader(body))
		httpReq.Header.Set("Content-Type", "application/json")
		httpReq.Header.Set("Authorization", "Bearer "+p.apiKey)
		httpReq.Header.Set("Accept", "text/event-stream") // 添加 Accept 头

		resp, err := c.Do(httpReq)
		if err != nil {
			errChan <- fmt.Errorf("http request failed: %v", err)
			return
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			// 读取响应体获取详细错误信息
			body, _ := io.ReadAll(resp.Body)
			logx.Errorf("AI API error: status=%d, body=%s", resp.StatusCode, string(body))
			errChan <- fmt.Errorf("AI API error: status=%d, body=%s", resp.StatusCode, string(body))
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
