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

func TestMatchRecordsModel_Insert(t *testing.T) {
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	conn := sqlx.NewSqlConnFromSession(sqlx.NewSqlConnFromDB(db))
	model := NewMatchRecordsModel(conn)

	mock.ExpectExec("insert into `match_records`").
		WithArgs(int64(1), int64(1), sql.NullFloat64{}, sql.NullFloat64{}, sql.NullFloat64{}, sql.NullFloat64{}, sql.NullFloat64{}, sql.NullString{}, sqlmock.AnyArg()).
		WillReturnResult(sqlmock.NewResult(1, 1))

	ctx := context.Background()
	record := &MatchRecords{
		StudentId: 1,
		JobId:     1,
	}

	result, err := model.Insert(ctx, record)
	assert.NoError(t, err)
	id, err := result.LastInsertId()
	assert.Equal(t, int64(1), id)
}

func TestMatchRecordsModel_FindOne(t *testing.T) {
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	conn := sqlx.NewSqlConnFromSession(sqlx.NewSqlConnFromDB(db))
	model := NewMatchRecordsModel(conn)

	rows := sqlmock.NewRows([]string{"id", "student_id", "job_id", "overall_score", "skills_match", "certs_match", "soft_skills_match", "experience_match", "gap_analysis", "created_at"}).
		AddRow(1, 1, 1, 85.5, 90.0, 80.0, 85.0, 75.0, "{}", 1234567890)

	mock.ExpectQuery("select .* from `match_records`").
		WithArgs(1).
		WillReturnRows(rows)

	ctx := context.Background()
	result, err := model.FindOne(ctx, 1)
	assert.NoError(t, err)
	assert.Equal(t, int64(1), result.Id)
	assert.Equal(t, float64(85.5), result.OverallScore.Float64)
}

func TestMatchRecordsModel_FindOne_NotFound(t *testing.T) {
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	conn := sqlx.NewSqlConnFromSession(sqlx.NewSqlConnFromDB(db))
	model := NewMatchRecordsModel(conn)

	mock.ExpectQuery("select .* from `match_records`").
		WithArgs(999).
		WillReturnError(sqlx.ErrNotFound)

	ctx := context.Background()
	result, err := model.FindOne(ctx, 999)
	assert.Nil(t, result)
	assert.Equal(t, ErrNotFound, err)
}

func TestMatchRecordsModel_Update(t *testing.T) {
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	conn := sqlx.NewSqlConnFromSession(sqlx.NewSqlConnFromDB(db))
	model := NewMatchRecordsModel(conn)

	mock.ExpectExec("update `match_records`").
		WithArgs(int64(1), int64(2), sql.NullFloat64{}, sql.NullFloat64{}, sql.NullFloat64{}, sql.NullFloat64{}, sql.NullFloat64{}, sql.NullString{}, 1).
		WillReturnResult(sqlmock.NewResult(1, 1))

	ctx := context.Background()
	record := &MatchRecords{
		Id:        1,
		StudentId: 1,
		JobId:     2,
	}

	err = model.Update(ctx, record)
	assert.NoError(t, err)
}

func TestMatchRecordsModel_Delete(t *testing.T) {
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	conn := sqlx.NewSqlConnFromSession(sqlx.NewSqlConnFromDB(db))
	model := NewMatchRecordsModel(conn)

	mock.ExpectExec("delete from `match_records`").
		WithArgs(1).
		WillReturnResult(sqlmock.NewResult(0, 1))

	ctx := context.Background()
	err = model.Delete(ctx, 1)
	assert.NoError(t, err)
}

func TestMatchRecordsModel_withSession(t *testing.T) {
	db, _, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	conn := sqlx.NewSqlConnFromSession(sqlx.NewSqlConnFromDB(db))
	model := NewMatchRecordsModel(conn)

	sessionModel := model.withSession(conn)
	assert.NotNil(t, sessionModel)
}

func TestMatchRecordsModel_Insert_Error(t *testing.T) {
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	conn := sqlx.NewSqlConnFromSession(sqlx.NewSqlConnFromDB(db))
	model := NewMatchRecordsModel(conn)

	mock.ExpectExec("insert into `match_records`").
		WillReturnError(errors.New("database error"))

	ctx := context.Background()
	record := &MatchRecords{
		StudentId: 1,
		JobId:     1,
	}

	_, err = model.Insert(ctx, record)
	assert.Error(t, err)
}
