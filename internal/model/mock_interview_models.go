package model

import (
	"context"
	"database/sql"

	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

type MockInterviewSessionsModel struct {
	FindRunningResult *InterviewSessions
	FindRunningErr    error
	FindByIdResult    []*InterviewSessions
	FindByIdTotal     int64
	FindByIdErr       error
	NextId            int64
	InsertErr         error
}

type mockSessionsResult struct {
	id int64
}

func (r *mockSessionsResult) LastInsertId() (int64, error) { return r.id, nil }
func (r *mockSessionsResult) RowsAffected() (int64, error)  { return 1, nil }

func (m *MockInterviewSessionsModel) Insert(ctx context.Context, data *InterviewSessions) (sql.Result, error) {
	m.NextId++
	return &mockSessionsResult{id: m.NextId}, m.InsertErr
}

func (m *MockInterviewSessionsModel) FindOne(ctx context.Context, id int64) (*InterviewSessions, error) {
	return nil, ErrNotFound
}

func (m *MockInterviewSessionsModel) Update(ctx context.Context, data *InterviewSessions) error {
	return nil
}

func (m *MockInterviewSessionsModel) Delete(ctx context.Context, id int64) error {
	return nil
}

func (m *MockInterviewSessionsModel) withSession(session sqlx.Session) InterviewSessionsModel {
	return m
}

func (m *MockInterviewSessionsModel) FindOneByUserId(ctx context.Context, userId int64, sessionId int64) (*InterviewSessions, error) {
	return nil, ErrNotFound
}

func (m *MockInterviewSessionsModel) FindByUserId(ctx context.Context, userId int64, page, pageSize int, status, mode string) ([]*InterviewSessions, int64, error) {
	return m.FindByIdResult, m.FindByIdTotal, m.FindByIdErr
}

func (m *MockInterviewSessionsModel) FindRunningByUserId(ctx context.Context, userId int64) (*InterviewSessions, error) {
	return m.FindRunningResult, m.FindRunningErr
}

func (m *MockInterviewSessionsModel) UpdateStats(ctx context.Context, sessionId int64, score float64) error {
	return nil
}

func (m *MockInterviewSessionsModel) EndSession(ctx context.Context, sessionId int64, duration int, status string) error {
	return nil
}

func (m *MockInterviewSessionsModel) FindCompletedWithoutReports(ctx context.Context) ([]*InterviewSessions, error) {
	return nil, nil
}

type MockInterviewMessagesModel struct{}

type mockMessagesResult struct{}

func (r *mockMessagesResult) LastInsertId() (int64, error) { return 1, nil }
func (r *mockMessagesResult) RowsAffected() (int64, error)  { return 1, nil }

func (m *MockInterviewMessagesModel) Insert(ctx context.Context, data *InterviewMessages) (sql.Result, error) {
	return &mockMessagesResult{}, nil
}

func (m *MockInterviewMessagesModel) FindOne(ctx context.Context, id int64) (*InterviewMessages, error) {
	return nil, ErrNotFound
}

func (m *MockInterviewMessagesModel) Update(ctx context.Context, data *InterviewMessages) error {
	return nil
}

func (m *MockInterviewMessagesModel) Delete(ctx context.Context, id int64) error {
	return nil
}

func (m *MockInterviewMessagesModel) withSession(session sqlx.Session) InterviewMessagesModel {
	return m
}

func (m *MockInterviewMessagesModel) FindBySessionId(ctx context.Context, sessionId int64) ([]*InterviewMessages, error) {
	return nil, nil
}

func (m *MockInterviewMessagesModel) InsertWithTimestamp(ctx context.Context, data *InterviewMessages) (sql.Result, error) {
	return &mockMessagesResult{}, nil
}

type MockInterviewReportsModel struct{}

type mockReportsResult struct{}

func (r *mockReportsResult) LastInsertId() (int64, error) { return 1, nil }
func (r *mockReportsResult) RowsAffected() (int64, error)  { return 1, nil }

func (m *MockInterviewReportsModel) Insert(ctx context.Context, data *InterviewReports) (sql.Result, error) {
	return &mockReportsResult{}, nil
}

func (m *MockInterviewReportsModel) FindOne(ctx context.Context, id int64) (*InterviewReports, error) {
	return nil, ErrNotFound
}

func (m *MockInterviewReportsModel) Update(ctx context.Context, data *InterviewReports) error {
	return nil
}

func (m *MockInterviewReportsModel) Delete(ctx context.Context, id int64) error {
	return nil
}

func (m *MockInterviewReportsModel) withSession(session sqlx.Session) InterviewReportsModel {
	return m
}

func (m *MockInterviewReportsModel) FindBySessionId(ctx context.Context, sessionId int64) (*InterviewReports, error) {
	return nil, ErrNotFound
}

func (m *MockInterviewReportsModel) FindByUserId(ctx context.Context, userId int64) ([]*InterviewReports, error) {
	return nil, nil
}

func (m *MockInterviewReportsModel) InsertWithTimestamp(ctx context.Context, data *InterviewReports) (sql.Result, error) {
	return &mockReportsResult{}, nil
}