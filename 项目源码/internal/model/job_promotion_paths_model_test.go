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

func TestJobPromotionPathsModel_Insert(t *testing.T) {
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	conn := sqlx.NewSqlConnFromSession(sqlx.NewSqlConnFromDB(db))
	model := NewJobPromotionPathsModel(conn)

	mock.ExpectExec("insert into `job_promotion_paths`").
		WithArgs(int64(1), int64(2), sql.NullFloat64{}, sql.NullString{}, sql.NullString{}).
		WillReturnResult(sqlmock.NewResult(1, 1))

	ctx := context.Background()
	path := &JobPromotionPaths{
		FromJobId: 1,
		ToJobId:   2,
	}

	result, err := model.Insert(ctx, path)
	assert.NoError(t, err)
	id, err := result.LastInsertId()
	assert.Equal(t, int64(1), id)
}

func TestJobPromotionPathsModel_FindOne(t *testing.T) {
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	conn := sqlx.NewSqlConnFromSession(sqlx.NewSqlConnFromDB(db))
	model := NewJobPromotionPathsModel(conn)

	rows := sqlmock.NewRows([]string{"id", "from_job_id", "to_job_id", "match_score", "transfer_skills", "learning_path"}).
		AddRow(1, 1, 2, 85.5, "{}", "[]")

	mock.ExpectQuery("select .* from `job_promotion_paths`").
		WithArgs(1).
		WillReturnRows(rows)

	ctx := context.Background()
	result, err := model.FindOne(ctx, 1)
	assert.NoError(t, err)
	assert.Equal(t, int64(1), result.Id)
	assert.Equal(t, int64(1), result.FromJobId)
	assert.Equal(t, int64(2), result.ToJobId)
}

func TestJobPromotionPathsModel_FindOne_NotFound(t *testing.T) {
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	conn := sqlx.NewSqlConnFromSession(sqlx.NewSqlConnFromDB(db))
	model := NewJobPromotionPathsModel(conn)

	mock.ExpectQuery("select .* from `job_promotion_paths`").
		WithArgs(999).
		WillReturnError(sqlx.ErrNotFound)

	ctx := context.Background()
	result, err := model.FindOne(ctx, 999)
	assert.Nil(t, result)
	assert.Equal(t, ErrNotFound, err)
}

func TestJobPromotionPathsModel_Update(t *testing.T) {
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	conn := sqlx.NewSqlConnFromSession(sqlx.NewSqlConnFromDB(db))
	model := NewJobPromotionPathsModel(conn)

	mock.ExpectExec("update `job_promotion_paths`").
		WithArgs(int64(1), int64(3), sql.NullFloat64{}, sql.NullString{}, sql.NullString{}, 1).
		WillReturnResult(sqlmock.NewResult(1, 1))

	ctx := context.Background()
	path := &JobPromotionPaths{
		Id:        1,
		FromJobId: 1,
		ToJobId:   3,
	}

	err = model.Update(ctx, path)
	assert.NoError(t, err)
}

func TestJobPromotionPathsModel_Delete(t *testing.T) {
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	conn := sqlx.NewSqlConnFromSession(sqlx.NewSqlConnFromDB(db))
	model := NewJobPromotionPathsModel(conn)

	mock.ExpectExec("delete from `job_promotion_paths`").
		WithArgs(1).
		WillReturnResult(sqlmock.NewResult(0, 1))

	ctx := context.Background()
	err = model.Delete(ctx, 1)
	assert.NoError(t, err)
}

func TestJobPromotionPathsModel_withSession(t *testing.T) {
	db, _, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	conn := sqlx.NewSqlConnFromSession(sqlx.NewSqlConnFromDB(db))
	model := NewJobPromotionPathsModel(conn)

	sessionModel := model.withSession(conn)
	assert.NotNil(t, sessionModel)
}

func TestJobPromotionPathsModel_Insert_Error(t *testing.T) {
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	conn := sqlx.NewSqlConnFromSession(sqlx.NewSqlConnFromDB(db))
	model := NewJobPromotionPathsModel(conn)

	mock.ExpectExec("insert into `job_promotion_paths`").
		WillReturnError(errors.New("database error"))

	ctx := context.Background()
	path := &JobPromotionPaths{
		FromJobId: 1,
		ToJobId:   2,
	}

	_, err = model.Insert(ctx, path)
	assert.Error(t, err)
}
