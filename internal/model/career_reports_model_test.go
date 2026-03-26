package model

import (
	"context"
	"database/sql"
	"errors"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/assert"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

func TestCareerReportsModel_Insert(t *testing.T) {
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	conn := sqlx.NewSqlConnFromSession(sqlx.NewSqlConnFromDB(db))
	model := NewCareerReportsModel(conn)

	mock.ExpectExec("insert into `career_reports`").
		WithArgs(int64(1), sql.NullInt64{}, sql.NullString{}, sql.NullString{}, sql.NullString{}, sql.NullString{}, sql.NullString{}, sql.NullString{}, "draft").
		WillReturnResult(sqlmock.NewResult(1, 1))

	ctx := context.Background()
	report := &CareerReports{
		StudentId: 1,
		Status:    "draft",
	}

	result, err := model.Insert(ctx, report)
	assert.NoError(t, err)
	id, err := result.LastInsertId()
	assert.Equal(t, int64(1), id)
}

func TestCareerReportsModel_FindOne(t *testing.T) {
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	conn := sqlx.NewSqlConnFromSession(sqlx.NewSqlConnFromDB(db))
	model := NewCareerReportsModel(conn)

	rows := sqlmock.NewRows([]string{"id", "student_id", "target_job_id", "title", "content", "overview", "match_analysis", "career_path", "action_plan", "status", "created_at", "updated_at"}).
		AddRow(1, 1, sql.NullInt64{Int64: 1, Valid: true}, "Career Report", "Content", "Overview", "Match", "Path", "Plan", "draft", 1234567890, 1234567890)

	mock.ExpectQuery("select .* from `career_reports`").
		WithArgs(1).
		WillReturnRows(rows)

	ctx := context.Background()
	result, err := model.FindOne(ctx, 1)
	assert.NoError(t, err)
	assert.Equal(t, int64(1), result.Id)
	assert.Equal(t, "draft", result.Status)
}

func TestCareerReportsModel_FindOne_NotFound(t *testing.T) {
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	conn := sqlx.NewSqlConnFromSession(sqlx.NewSqlConnFromDB(db))
	model := NewCareerReportsModel(conn)

	mock.ExpectQuery("select .* from `career_reports`").
		WithArgs(999).
		WillReturnError(sqlx.ErrNotFound)

	ctx := context.Background()
	result, err := model.FindOne(ctx, 999)
	assert.Nil(t, result)
	assert.Equal(t, ErrNotFound, err)
}

func TestCareerReportsModel_Update(t *testing.T) {
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	conn := sqlx.NewSqlConnFromSession(sqlx.NewSqlConnFromDB(db))
	model := NewCareerReportsModel(conn)

	mock.ExpectExec("update `career_reports`").
		WithArgs(int64(1), sql.NullInt64{}, sql.NullString{}, sql.NullString{}, sql.NullString{}, sql.NullString{}, sql.NullString{}, sql.NullString{}, "completed", 1).
		WillReturnResult(sqlmock.NewResult(1, 1))

	ctx := context.Background()
	report := &CareerReports{
		Id:        1,
		StudentId: 1,
		Status:    "completed",
	}

	err = model.Update(ctx, report)
	assert.NoError(t, err)
}

func TestCareerReportsModel_Delete(t *testing.T) {
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	conn := sqlx.NewSqlConnFromSession(sqlx.NewSqlConnFromDB(db))
	model := NewCareerReportsModel(conn)

	mock.ExpectExec("delete from `career_reports`").
		WithArgs(1).
		WillReturnResult(sqlmock.NewResult(0, 1))

	ctx := context.Background()
	err = model.Delete(ctx, 1)
	assert.NoError(t, err)
}

func TestCareerReportsModel_withSession(t *testing.T) {
	db, _, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	conn := sqlx.NewSqlConnFromSession(sqlx.NewSqlConnFromDB(db))
	model := NewCareerReportsModel(conn)

	sessionModel := model.withSession(conn)
	assert.NotNil(t, sessionModel)
}

func TestCareerReportsModel_Insert_Error(t *testing.T) {
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	conn := sqlx.NewSqlConnFromSession(sqlx.NewSqlConnFromDB(db))
	model := NewCareerReportsModel(conn)

	mock.ExpectExec("insert into `career_reports`").
		WillReturnError(errors.New("database error"))

	ctx := context.Background()
	report := &CareerReports{
		StudentId: 1,
		Status:    "draft",
	}

	_, err = model.Insert(ctx, report)
	assert.Error(t, err)
}
