package svc

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/zeromicro/go-zero/core/logx"
	"github.com/zeromicro/go-zero/core/stores/redis"
	"github.com/zeromicro/go-zero/core/stores/sqlx"

	"career-api/common/errors"
	ai "career-api/common/pkg"
	"career-api/internal/config"
	"career-api/internal/model"
)

type ServiceContext struct {
	Config             *config.Config
	Redis              *redis.Redis
	DB                 sqlx.SqlConn
	AIProvider         ai.AIProvider
	AITimeout          time.Duration
	UserModel          model.UsersModel
	JobModel           model.JobsModel
	StudentModel       model.StudentsModel
	ReportModel        model.CareerReportsModel
	MatchModel         model.MatchRecordsModel
	PromotionPathModel model.JobPromotionPathsModel
}

func NewServiceContext(c *config.Config) *ServiceContext {
	mysqlConn := sqlx.NewMysql(c.Mysql.DataSource)

	redisClient := redis.New(c.Redis.Host)

	aiProvider := ai.NewOpenAIProvider(
		c.AI.ApiKey,
		c.AI.Model,
		c.AI.BaseURL,
		time.Duration(c.AI.Timeout)*time.Second,
	)

	return &ServiceContext{
		Config:             c,
		Redis:              redisClient,
		DB:                 mysqlConn,
		AIProvider:         aiProvider,
		AITimeout:          time.Duration(c.AI.Timeout) * time.Second,
		UserModel:          model.NewUsersModel(mysqlConn),
		JobModel:           model.NewJobsModel(mysqlConn),
		StudentModel:       model.NewStudentsModel(mysqlConn),
		ReportModel:        model.NewCareerReportsModel(mysqlConn),
		MatchModel:         model.NewMatchRecordsModel(mysqlConn),
		PromotionPathModel: model.NewJobPromotionPathsModel(mysqlConn),
	}
}

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

func (s *ServiceContext) CallAI(ctx context.Context, prompt string) (string, error) {
	req := OpenAIRequest{
		Model: s.Config.AI.Model,
		Messages: []ChatMessage{
			{Role: "system", Content: "You are a professional career planning assistant."},
			{Role: "user", Content: prompt},
		},
		MaxTokens: 2000,
	}

	body, err := json.Marshal(req)
	if err != nil {
		return "", err
	}

	c := &http.Client{Timeout: time.Duration(s.Config.AI.Timeout) * time.Second}
	httpReq, _ := http.NewRequestWithContext(ctx, "POST", s.Config.AI.BaseURL+"/chat/completions", bytes.NewReader(body))
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+s.Config.AI.ApiKey)

	resp, err := c.Do(httpReq)
	if err != nil {
		logx.Errorf("CallAI failed: %v", err)
		return "", err
	}
	defer resp.Body.Close()

	var openAIResp OpenAIResponse
	if err := json.NewDecoder(resp.Body).Decode(&openAIResp); err != nil {
		return "", err
	}

	if openAIResp.Error != nil {
		return "", fmt.Errorf("AI error: %s", openAIResp.Error.Message)
	}

	if len(openAIResp.Choices) == 0 {
		return "", errors.ErrGenerationFailed
	}

	return openAIResp.Choices[0].Message.Content, nil
}
