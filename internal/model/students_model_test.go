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

func TestStudentsModel_Insert(t *testing.T) {
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	conn := sqlx.NewSqlConnFromSession(sqlx.NewSqlConnFromDB(db))
	model := NewStudentsModel(conn)

	mock.ExpectExec("insert into `students`").
		WithArgs(int64(1), "John Doe", sql.NullString{}, sql.NullString{}, sql.NullInt64{}, sql.NullString{}, sql.NullString{}, sql.NullString{}, sql.NullString{}, sql.NullString{}, float64(0), float64(0), sql.NullString{}).
		WillReturnResult(sqlmock.NewResult(1, 1))

	ctx := context.Background()
	student := &Students{
		UserId: 1,
		Name:   "John Doe",
	}

	result, err := model.Insert(ctx, student)
	assert.NoError(t, err)
	id, err := result.LastInsertId()
	assert.Equal(t, int64(1), id)
}

func TestStudentsModel_FindOne(t *testing.T) {
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	conn := sqlx.NewSqlConnFromSession(sqlx.NewSqlConnFromDB(db))
	model := NewStudentsModel(conn)

	rows := sqlmock.NewRows([]string{"id", "user_id", "name", "education", "major", "graduation_year", "skills", "certificates", "soft_skills", "internship", "projects", "completeness_score", "competitiveness_score", "resume_url", "created_at", "updated_at"}).
		AddRow(1, 1, "John Doe", "Bachelor", "Computer Science", sql.NullInt64{Int64: 2024, Valid: true}, "{}", "{}", "{}", "{}", "{}", 85.5, 80.0, "", 1234567890, 1234567890)

	mock.ExpectQuery("select .* from `students`").
		WithArgs(1).
		WillReturnRows(rows)

	ctx := context.Background()
	result, err := model.FindOne(ctx, 1)
	assert.NoError(t, err)
	assert.Equal(t, int64(1), result.Id)
	assert.Equal(t, "John Doe", result.Name)
}

func TestStudentsModel_FindOne_NotFound(t *testing.T) {
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	conn := sqlx.NewSqlConnFromSession(sqlx.NewSqlConnFromDB(db))
	model := NewStudentsModel(conn)

	mock.ExpectQuery("select .* from `students`").
		WithArgs(999).
		WillReturnError(sqlx.ErrNotFound)

	ctx := context.Background()
	result, err := model.FindOne(ctx, 999)
	assert.Nil(t, result)
	assert.Equal(t, ErrNotFound, err)
}

func TestStudentsModel_Update(t *testing.T) {
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	conn := sqlx.NewSqlConnFromSession(sqlx.NewSqlConnFromDB(db))
	model := NewStudentsModel(conn)

	mock.ExpectExec("update `students`").
		WithArgs(int64(1), "John Updated", sql.NullString{}, sql.NullString{}, sql.NullInt64{}, sql.NullString{}, sql.NullString{}, sql.NullString{}, sql.NullString{}, sql.NullString{}, float64(90), float64(85), sql.NullString{}, 1).
		WillReturnResult(sqlmock.NewResult(1, 1))

	ctx := context.Background()
	student := &Students{
		Id:                   1,
		UserId:               1,
		Name:                 "John Updated",
		CompletenessScore:    90,
		CompetitivenessScore: 85,
	}

	err = model.Update(ctx, student)
	assert.NoError(t, err)
}

func TestStudentsModel_Delete(t *testing.T) {
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	conn := sqlx.NewSqlConnFromSession(sqlx.NewSqlConnFromDB(db))
	model := NewStudentsModel(conn)

	mock.ExpectExec("delete from `students`").
		WithArgs(1).
		WillReturnResult(sqlmock.NewResult(0, 1))

	ctx := context.Background()
	err = model.Delete(ctx, 1)
	assert.NoError(t, err)
}

func TestStudentsModel_withSession(t *testing.T) {
	db, _, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	conn := sqlx.NewSqlConnFromSession(sqlx.NewSqlConnFromDB(db))
	model := NewStudentsModel(conn)

	sessionModel := model.withSession(conn)
	assert.NotNil(t, sessionModel)
}

func TestStudentsModel_Insert_Error(t *testing.T) {
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	conn := sqlx.NewSqlConnFromSession(sqlx.NewSqlConnFromDB(db))
	model := NewStudentsModel(conn)

	mock.ExpectExec("insert into `students`").
		WillReturnError(errors.New("database error"))

	ctx := context.Background()
	student := &Students{
		UserId: 1,
		Name:   "John Doe",
	}

	_, err = model.Insert(ctx, student)
	assert.Error(t, err)
}
