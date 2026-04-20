package logic

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"

	"career-api/common/errors"
	"career-api/internal/config"
	"career-api/internal/svc"
	"career-api/internal/types"
)

func createTestServiceContextForInterview(t *testing.T) *svc.ServiceContext {
	cfg := &config.Config{}
	cfg.AI.Provider = "mock"
	cfg.AI.ApiKey = "test-key"
	cfg.AI.Model = "gpt-3.5"
	cfg.AI.BaseURL = "https://api.openai.com/v1"
	cfg.AI.Timeout = 30

	return &svc.ServiceContext{
		Config: cfg,
	}
}

func TestStartInterviewLogic_StartInterview_Success(t *testing.T) {
	svcCtx := createTestServiceContextForInterview(t)
	ctx := context.WithValue(context.Background(), "userId", int64(1))
	logic := NewStartInterviewLogic(ctx, svcCtx)

	req := &types.StartInterviewReq{
		Mode: "bigtech",
	}

	resp, err := logic.StartInterview(req)

	assert.NoError(t, err)
	assert.Equal(t, errors.CodeSuccess, resp.Code)
	assert.NotNil(t, resp.Data)
	assert.Equal(t, "bigtech", resp.Data.Mode)
	assert.Equal(t, "running", resp.Data.Status)
	assert.Greater(t, resp.Data.Id, int64(0))
}

func TestStartInterviewLogic_StartInterview_Unauthorized(t *testing.T) {
	svcCtx := createTestServiceContextForInterview(t)
	ctx := context.Background()
	logic := NewStartInterviewLogic(ctx, svcCtx)

	req := &types.StartInterviewReq{
		Mode: "bigtech",
	}

	resp, err := logic.StartInterview(req)

	assert.NoError(t, err)
	assert.Equal(t, errors.CodeUnauthorized, resp.Code)
	assert.Equal(t, "unauthorized", resp.Msg)
}

func TestStartInterviewLogic_StartInterview_GovMode(t *testing.T) {
	svcCtx := createTestServiceContextForInterview(t)
	ctx := context.WithValue(context.Background(), "userId", int64(1))
	logic := NewStartInterviewLogic(ctx, svcCtx)

	req := &types.StartInterviewReq{
		Mode: "gov",
	}

	resp, err := logic.StartInterview(req)

	assert.NoError(t, err)
	assert.Equal(t, errors.CodeSuccess, resp.Code)
	assert.Equal(t, "gov", resp.Data.Mode)
}

func TestInterviewChatStreamLogic_InterviewChatStream_Success(t *testing.T) {
	svcCtx := createTestServiceContextForInterview(t)
	ctx := context.WithValue(context.Background(), "userId", int64(1))
	logic := NewInterviewChatStreamLogic(ctx, svcCtx)

	req := &types.InterviewChatStreamReq{
		Message: "I have 3 years of experience in Go development",
	}

	w := httptest.NewRecorder()
	logic.InterviewChatStream(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, "text/event-stream", w.Header().Get("Content-Type"))

	body := w.Body.String()
	assert.Contains(t, body, "event: question")
	assert.Contains(t, body, "请介绍一下你的项目经验")
	assert.Contains(t, body, "event: score")
	assert.Contains(t, body, "event: feedback")
	assert.Contains(t, body, "event: done")
}

func TestInterviewChatStreamLogic_InterviewChatStream_Unauthorized(t *testing.T) {
	svcCtx := createTestServiceContextForInterview(t)
	ctx := context.Background()
	logic := NewInterviewChatStreamLogic(ctx, svcCtx)

	req := &types.InterviewChatStreamReq{
		Message: "test",
	}

	w := httptest.NewRecorder()
	logic.InterviewChatStream(w, req)

	body := w.Body.String()
	assert.Contains(t, body, "event: error")
	assert.Contains(t, body, "unauthorized")
}

func TestInterviewChatStreamLogic_InterviewChatStream_MultipleQuestions(t *testing.T) {
	svcCtx := createTestServiceContextForInterview(t)
	ctx := context.WithValue(context.Background(), "userId", int64(1))
	logic := NewInterviewChatStreamLogic(ctx, svcCtx)

	req := &types.InterviewChatStreamReq{
		Message: "I am ready for the interview",
	}

	w := httptest.NewRecorder()
	logic.InterviewChatStream(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	body := w.Body.String()

	questionCount := strings.Count(body, "event: question")
	assert.GreaterOrEqual(t, questionCount, 2, "Should have at least 2 questions")

	scoreCount := strings.Count(body, "event: score")
	assert.GreaterOrEqual(t, scoreCount, 2, "Should have at least 2 scores")

	feedbackCount := strings.Count(body, "event: feedback")
	assert.GreaterOrEqual(t, feedbackCount, 2, "Should have at least 2 feedbacks")
}

func TestInterviewChatStreamLogic_sendSSEEvent(t *testing.T) {
	svcCtx := createTestServiceContextForInterview(t)
	ctx := context.Background()
	logic := NewInterviewChatStreamLogic(ctx, svcCtx)

	w := httptest.NewRecorder()

	data := map[string]interface{}{
		"type":    "question",
		"content": "test question",
	}

	flusher := &responseRecorderFlusher{w: w}
	logic.sendSSEEvent(w, flusher, "question", data)

	body := w.Body.String()
	lines := strings.Split(body, "\n")

	assert.Contains(t, lines[0], "event: question")
	assert.Contains(t, lines[1], "data:")
	assert.Contains(t, lines[1], "test question")
}

type responseRecorderFlusher struct {
	w *httptest.ResponseRecorder
}

func (f *responseRecorderFlusher) Flush() {
	f.w.Flush()
}

func TestGetInterviewHistoryLogic_GetInterviewHistory_Success(t *testing.T) {
	svcCtx := createTestServiceContextForInterview(t)
	ctx := context.WithValue(context.Background(), "userId", int64(1))
	logic := NewGetInterviewHistoryLogic(ctx, svcCtx)

	resp, err := logic.GetInterviewHistory()

	assert.NoError(t, err)
	assert.Equal(t, errors.CodeSuccess, resp.Code)
	assert.NotNil(t, resp.Data)
	assert.Equal(t, int64(2), resp.Data.Total)
	assert.Len(t, resp.Data.List, 2)
}

func TestGetInterviewHistoryLogic_GetInterviewHistory_Unauthorized(t *testing.T) {
	svcCtx := createTestServiceContextForInterview(t)
	ctx := context.Background()
	logic := NewGetInterviewHistoryLogic(ctx, svcCtx)

	resp, err := logic.GetInterviewHistory()

	assert.NoError(t, err)
	assert.Equal(t, errors.CodeUnauthorized, resp.Code)
	assert.Equal(t, "unauthorized", resp.Msg)
}

func TestGetInterviewHistoryLogic_GetInterviewHistory_ContainsCorrectData(t *testing.T) {
	svcCtx := createTestServiceContextForInterview(t)
	ctx := context.WithValue(context.Background(), "userId", int64(1))
	logic := NewGetInterviewHistoryLogic(ctx, svcCtx)

	resp, err := logic.GetInterviewHistory()

	assert.NoError(t, err)
	assert.Equal(t, errors.CodeSuccess, resp.Code)

	if resp.Data != nil && len(resp.Data.List) > 0 {
		assert.Contains(t, []string{"bigtech", "gov"}, resp.Data.List[0].Mode)
		assert.Greater(t, resp.Data.List[0].Score, 0.0)
		assert.Equal(t, "completed", resp.Data.List[0].Status)
		assert.Greater(t, resp.Data.List[0].Id, int64(0))
		assert.Greater(t, resp.Data.List[0].CreatedAt, int64(0))
	}
}

func TestStartInterviewLogic_StartInterview_SessionIdUnique(t *testing.T) {
	svcCtx := createTestServiceContextForInterview(t)
	ctx := context.WithValue(context.Background(), "userId", int64(1))

	logic1 := NewStartInterviewLogic(ctx, svcCtx)
	req1 := &types.StartInterviewReq{Mode: "bigtech"}
	resp1, _ := logic1.StartInterview(req1)

	logic2 := NewStartInterviewLogic(ctx, svcCtx)
	req2 := &types.StartInterviewReq{Mode: "gov"}
	resp2, _ := logic2.StartInterview(req2)

	assert.NotEqual(t, resp1.Data.Id, resp2.Data.Id, "Session IDs should be unique")
}