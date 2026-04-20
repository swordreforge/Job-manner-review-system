package model

import (
	"context"
	"database/sql"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
	"github.com/stretchr/testify/assert"
)

func TestResumeParseHistoryModel_Insert(t *testing.T) {
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	conn := sqlx.NewSqlConnFromSession(sqlx.NewSqlConnFromDB(db))
	model := NewResumeParseHistoryModel(conn)

	mock.ExpectExec("insert into `resume_parse_history`").
		WithArgs(int64(1), sql.NullInt64{Int64: 1, Valid: true}, sql.NullString{String: "resume.pdf", Valid: true}, sql.NullString{String: "content", Valid: true}, sql.NullString{String: "{}", Valid: true}, sql.NullString{String: "[]", Valid: true}, 80.0, 75.0, sqlmock.AnyArg()).
		WillReturnResult(sqlmock.NewResult(1, 1))

	ctx := context.Background()
	history := &ResumeParseHistory{
		UserId:               1,
		StudentId:            sql.NullInt64{Int64: 1, Valid: true},
		ResumeFileName:       sql.NullString{String: "resume.pdf", Valid: true},
		ResumeContent:        sql.NullString{String: "content", Valid: true},
		ParsedProfile:        sql.NullString{String: "{}", Valid: true},
		Suggestions:          sql.NullString{String: "[]", Valid: true},
		CompletenessScore:    80.0,
		CompetitivenessScore: 75.0,
	}

	result, err := model.Insert(ctx, history)
	assert.NoError(t, err)
	id, err := result.LastInsertId()
	assert.Equal(t, int64(1), id)
}

func TestResumeParseHistoryModel_FindOne(t *testing.T) {
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	conn := sqlx.NewSqlConnFromSession(sqlx.NewSqlConnFromDB(db))
	model := NewResumeParseHistoryModel(conn)

	rows := sqlmock.NewRows([]string{"id", "user_id", "student_id", "resume_file_name", "resume_content", "parsed_profile", "suggestions", "completeness_score", "competitiveness_score", "created_at"}).
		AddRow(1, 1, sql.NullInt64{Int64: 1, Valid: true}, sql.NullString{String: "resume.pdf", Valid: true}, sql.NullString{String: "content", Valid: true}, sql.NullString{String: "{}", Valid: true}, sql.NullString{String: "[]", Valid: true}, 80.0, 75.0, 1234567890)

	mock.ExpectQuery("select \\* from `resume_parse_history`").
		WithArgs(1).
		WillReturnRows(rows)

	ctx := context.Background()
	result, err := model.FindOne(ctx, 1)
	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, int64(1), result.Id)
}

func TestResumeParseHistoryModel_Delete(t *testing.T) {
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	conn := sqlx.NewSqlConnFromSession(sqlx.NewSqlConnFromDB(db))
	model := NewResumeParseHistoryModel(conn)

	mock.ExpectExec("delete from `resume_parse_history`").
		WithArgs(1).
		WillReturnResult(sqlmock.NewResult(0, 1))

	ctx := context.Background()
	err = model.Delete(ctx, 1)
	assert.NoError(t, err)
}
