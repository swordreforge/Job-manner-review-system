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

func TestJobsModel_Insert(t *testing.T) {
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	conn := sqlx.NewSqlConnFromSession(sqlx.NewSqlConnFromDB(db))
	model := NewJobsModel(conn)

	mock.ExpectExec("insert into `jobs`").
		WithArgs("Software Engineer", sql.NullString{}, sql.NullString{}, sql.NullString{}, sql.NullString{}, sql.NullString{}, sql.NullString{}, sql.NullString{}, sql.NullString{}, sql.NullString{}, sql.NullString{}, sqlmock.AnyArg(), sqlmock.AnyArg()).
		WillReturnResult(sqlmock.NewResult(1, 1))

	ctx := context.Background()
	job := &Jobs{
		Name: "Software Engineer",
	}

	result, err := model.Insert(ctx, job)
	assert.NoError(t, err)
	id, err := result.LastInsertId()
	assert.Equal(t, int64(1), id)
}

func TestJobsModel_FindOne(t *testing.T) {
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	conn := sqlx.NewSqlConnFromSession(sqlx.NewSqlConnFromDB(db))
	model := NewJobsModel(conn)

	rows := sqlmock.NewRows([]string{"id", "name", "description", "company", "industry", "location", "salary_range", "skills", "certificates", "soft_skills", "requirements", "growth_potential", "created_at", "updated_at"}).
		AddRow(1, "Software Engineer", "", "Google", "Tech", "Remote", "100k-150k", "{}", "{}", "{}", "{}", "High", 1234567890, 1234567890)

	mock.ExpectQuery("select .* from `jobs`").
		WithArgs(1).
		WillReturnRows(rows)

	ctx := context.Background()
	result, err := model.FindOne(ctx, 1)
	assert.NoError(t, err)
	assert.Equal(t, int64(1), result.Id)
	assert.Equal(t, "Software Engineer", result.Name)
}

func TestJobsModel_FindOne_NotFound(t *testing.T) {
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	conn := sqlx.NewSqlConnFromSession(sqlx.NewSqlConnFromDB(db))
	model := NewJobsModel(conn)

	mock.ExpectQuery("select .* from `jobs`").
		WithArgs(999).
		WillReturnError(sqlx.ErrNotFound)

	ctx := context.Background()
	result, err := model.FindOne(ctx, 999)
	assert.Nil(t, result)
	assert.Equal(t, ErrNotFound, err)
}

func TestJobsModel_Update(t *testing.T) {
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	conn := sqlx.NewSqlConnFromSession(sqlx.NewSqlConnFromDB(db))
	model := NewJobsModel(conn)

	mock.ExpectExec("update `jobs`").
		WithArgs("Senior Software Engineer", sql.NullString{}, sql.NullString{}, sql.NullString{}, sql.NullString{}, sql.NullString{}, sql.NullString{}, sql.NullString{}, sql.NullString{}, sql.NullString{}, sql.NullString{}, 1).
		WillReturnResult(sqlmock.NewResult(1, 1))

	ctx := context.Background()
	job := &Jobs{
		Id:   1,
		Name: "Senior Software Engineer",
	}

	err = model.Update(ctx, job)
	assert.NoError(t, err)
}

func TestJobsModel_Delete(t *testing.T) {
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	conn := sqlx.NewSqlConnFromSession(sqlx.NewSqlConnFromDB(db))
	model := NewJobsModel(conn)

	mock.ExpectExec("delete from `jobs`").
		WithArgs(1).
		WillReturnResult(sqlmock.NewResult(0, 1))

	ctx := context.Background()
	err = model.Delete(ctx, 1)
	assert.NoError(t, err)
}

func TestJobsModel_withSession(t *testing.T) {
	db, _, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	conn := sqlx.NewSqlConnFromSession(sqlx.NewSqlConnFromDB(db))
	model := NewJobsModel(conn)

	sessionModel := model.withSession(conn)
	assert.NotNil(t, sessionModel)
}

func TestJobsModel_Insert_Error(t *testing.T) {
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	conn := sqlx.NewSqlConnFromSession(sqlx.NewSqlConnFromDB(db))
	model := NewJobsModel(conn)

	mock.ExpectExec("insert into `jobs`").
		WillReturnError(errors.New("database error"))

	ctx := context.Background()
	job := &Jobs{
		Name: "Software Engineer",
	}

	_, err = model.Insert(ctx, job)
	assert.Error(t, err)
}
