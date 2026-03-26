package logic

import (
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/assert"
	"github.com/zeromicro/go-zero/core/stores/sqlx"

	ai "career-api/common/pkg"
	"career-api/internal/config"
	"career-api/internal/model"
	"career-api/internal/svc"
	"career-api/internal/types"
)

type mockAIProvider struct {
	response string
	err      error
}

func (m *mockAIProvider) GenerateJobProfile(ctx context.Context, prompt string) (string, error) {
	return "mock job profile", nil
}

func (m *mockAIProvider) GenerateStudentProfile(ctx context.Context, resumeContent string) (string, error) {
	return "mock student profile", nil
}

func (m *mockAIProvider) MatchAnalysis(ctx context.Context, studentProfile, jobProfile string) (string, error) {
	return "mock match analysis", nil
}

func (m *mockAIProvider) GenerateCareerReport(ctx context.Context, req ai.ReportGenerationRequest) (string, error) {
	if m.err != nil {
		return "", m.err
	}
	return m.response, nil
}

func createTestServiceContext(t *testing.T) *svc.ServiceContext {
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)

	conn := sqlx.NewSqlConnFromSession(sqlx.NewSqlConnFromDB(db))

	cfg := &config.Config{}
	cfg.AI.Provider = "mock"
	cfg.AI.ApiKey = "test-key"
	cfg.AI.Model = "gpt-3.5"
	cfg.AI.BaseURL = "https://api.openai.com/v1"
	cfg.AI.Timeout = 30

	rows := sqlmock.NewRows([]string{"id", "user_id", "name", "education", "major", "graduation_year", "skills", "certificates", "soft_skills", "internship", "projects", "completeness_score", "competitiveness_score", "resume_url", "created_at", "updated_at"}).
		AddRow(1, 1, "Test Student", "Bachelor", "Computer Science", sql.NullInt64{Int64: 2024, Valid: true}, "{}", "{}", "{}", "{}", "{}", 85.5, 80.0, "", time.Now().Unix(), time.Now().Unix())

	mock.ExpectQuery("select .* from `students`").
		WithArgs(int64(1)).
		WillReturnRows(rows)

	return &svc.ServiceContext{
		Config: cfg,
		DB:     conn,
		StudentModel: model.NewStudentsModel(conn),
		AIProvider: &mockAIProvider{
			response: "This is a comprehensive career development report generated for the student profile.",
		},
	}
}

func TestGenerateReportStreamLogic_GenerateReportStream_Success(t *testing.T) {
	svcCtx := createTestServiceContext(t)
	ctx := context.WithValue(context.Background(), "userId", int64(1))
	logic := NewGenerateReportStreamLogic(ctx, svcCtx)

	req := &types.GenerateReportStreamReq{
		StudentId: 1,
		Track:     "bigtech",
	}

	w := httptest.NewRecorder()
	logic.GenerateReportStream(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, "text/event-stream", w.Header().Get("Content-Type"))

	body := w.Body.String()
	assert.Contains(t, body, "event: status")
	assert.Contains(t, body, "开始生成职业规划报告")
	assert.Contains(t, body, "event: content")
	assert.Contains(t, body, "event: done")
	assert.Contains(t, body, "报告生成完成")
}

func TestGenerateReportStreamLogic_GenerateReportStream_Unauthorized(t *testing.T) {
	svcCtx := createTestServiceContext(t)
	ctx := context.Background()
	logic := NewGenerateReportStreamLogic(ctx, svcCtx)

	req := &types.GenerateReportStreamReq{
		StudentId: 1,
		Track:     "bigtech",
	}

	w := httptest.NewRecorder()
	logic.GenerateReportStream(w, req)

	body := w.Body.String()
	assert.Contains(t, body, "event: error")
	assert.Contains(t, body, "unauthorized")
}

func TestGenerateReportStreamLogic_GenerateReportStream_StudentNotFound(t *testing.T) {
	svcCtx := createTestServiceContext(t)
	ctx := context.WithValue(context.Background(), "userId", int64(999))
	logic := NewGenerateReportStreamLogic(ctx, svcCtx)

	req := &types.GenerateReportStreamReq{
		StudentId: 999,
		Track:     "bigtech",
	}

	w := httptest.NewRecorder()
	logic.GenerateReportStream(w, req)

	body := w.Body.String()
	assert.Contains(t, body, "event: error")
	assert.Contains(t, body, "student profile not found")
}

func TestGenerateReportStreamLogic_GenerateReportStream_AIError(t *testing.T) {
	svcCtx := createTestServiceContext(t)
	mockProvider := svcCtx.AIProvider.(*mockAIProvider)
	mockProvider.err = assert.AnError

	ctx := context.WithValue(context.Background(), "userId", int64(1))
	logic := NewGenerateReportStreamLogic(ctx, svcCtx)

	req := &types.GenerateReportStreamReq{
		StudentId: 1,
		Track:     "bigtech",
	}

	w := httptest.NewRecorder()
	logic.GenerateReportStream(w, req)

	body := w.Body.String()
	assert.Contains(t, body, "event: error")
	assert.Contains(t, body, "failed to generate report")
}

func TestGenerateReportStreamLogic_sendSSEEvent(t *testing.T) {
	svcCtx := createTestServiceContext(t)
	ctx := context.Background()
	logic := NewGenerateReportStreamLogic(ctx, svcCtx)

	w := httptest.NewRecorder()

	data := map[string]interface{}{
		"type":    "test",
		"message": "test message",
	}

	flusher := &testFlusher{w: w}
	logic.sendSSEEvent(w, flusher, "test", data)

	body := w.Body.String()
	lines := strings.Split(body, "\n")

	assert.Contains(t, lines[0], "event: test")
	assert.Contains(t, lines[1], "data:")
}

type testFlusher struct {
	w *httptest.ResponseRecorder
}

func (f *testFlusher) Flush() {
	f.w.Flush()
}

func TestGenerateReportStreamLogic_SSEStreaming(t *testing.T) {
	longContent := strings.Repeat("a", 200)
	svcCtx := createTestServiceContext(t)
	svcCtx.AIProvider.(*mockAIProvider).response = longContent

	ctx := context.WithValue(context.Background(), "userId", int64(1))
	logic := NewGenerateReportStreamLogic(ctx, svcCtx)

	req := &types.GenerateReportStreamReq{
		StudentId: 1,
		Track:     "gov",
	}

	w := httptest.NewRecorder()
	logic.GenerateReportStream(w, req)

	body := w.Body.String()

	contentCount := strings.Count(body, `event: content`)
	assert.Greater(t, contentCount, 1, "Should have multiple content events for long content")

	var contentEvents []map[string]string
	lines := strings.Split(body, "\n")
	for i := 0; i < len(lines); i++ {
		if strings.HasPrefix(lines[i], "event: content") && i+1 < len(lines) && strings.HasPrefix(lines[i+1], "data:") {
			dataLine := strings.TrimPrefix(lines[i+1], "data: ")
			var eventData map[string]string
			if err := json.Unmarshal([]byte(dataLine), &eventData); err == nil {
				contentEvents = append(contentEvents, eventData)
			}
		}
	}

	assert.Greater(t, len(contentEvents), 0, "Should have parsed content events")
}

func TestGenerateReportStreamLogic_GenerateReportStream_GovTrack(t *testing.T) {
	svcCtx := createTestServiceContext(t)
	ctx := context.WithValue(context.Background(), "userId", int64(1))
	logic := NewGenerateReportStreamLogic(ctx, svcCtx)

	req := &types.GenerateReportStreamReq{
		StudentId: 1,
		Track:     "gov",
	}

	w := httptest.NewRecorder()
	logic.GenerateReportStream(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	body := w.Body.String()
	assert.Contains(t, body, "event: status")
	assert.Contains(t, body, "event: done")
}

func TestGenerateReportStreamLogic_GenerateReportStream_WithTargetJob(t *testing.T) {
	svcCtx := createTestServiceContext(t)
	ctx := context.WithValue(context.Background(), "userId", int64(1))
	logic := NewGenerateReportStreamLogic(ctx, svcCtx)

	req := &types.GenerateReportStreamReq{
		StudentId:   1,
		Track:       "bigtech",
		TargetJobId: 5,
	}

	w := httptest.NewRecorder()
	logic.GenerateReportStream(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	body := w.Body.String()
	assert.Contains(t, body, "event: status")
}