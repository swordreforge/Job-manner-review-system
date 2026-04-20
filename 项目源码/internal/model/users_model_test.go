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

func TestUsersModel_Insert(t *testing.T) {
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	conn := sqlx.NewSqlConnFromSession(sqlx.NewSqlConnFromDB(db))
	model := NewUsersModel(conn)

	mock.ExpectExec("insert into `users`").
		WithArgs("testuser", "password123", "test@example.com", sql.NullString{}, "user", sqlmock.AnyArg(), sqlmock.AnyArg()).
		WillReturnResult(sqlmock.NewResult(1, 1))

	ctx := context.Background()
	user := &Users{
		Username: "testuser",
		Password: "password123",
		Email:    "test@example.com",
		Role:     "user",
	}

	result, err := model.Insert(ctx, user)
	assert.NoError(t, err)
	id, err := result.LastInsertId()
	assert.Equal(t, int64(1), id)
}

func TestUsersModel_FindOne(t *testing.T) {
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	conn := sqlx.NewSqlConnFromSession(sqlx.NewSqlConnFromDB(db))
	model := NewUsersModel(conn)

	rows := sqlmock.NewRows([]string{"id", "username", "password", "email", "phone", "role", "created_at", "updated_at"}).
		AddRow(1, "testuser", "password123", "test@example.com", "", "user", 1234567890, 1234567890)

	mock.ExpectQuery("select .* from `users`").
		WithArgs(1).
		WillReturnRows(rows)

	ctx := context.Background()
	result, err := model.FindOne(ctx, 1)
	assert.NoError(t, err)
	assert.Equal(t, int64(1), result.Id)
	assert.Equal(t, "testuser", result.Username)
}

func TestUsersModel_FindOne_NotFound(t *testing.T) {
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	conn := sqlx.NewSqlConnFromSession(sqlx.NewSqlConnFromDB(db))
	model := NewUsersModel(conn)

	mock.ExpectQuery("select .* from `users`").
		WithArgs(999).
		WillReturnError(sqlx.ErrNotFound)

	ctx := context.Background()
	result, err := model.FindOne(ctx, 999)
	assert.Nil(t, result)
	assert.Equal(t, ErrNotFound, err)
}

func TestUsersModel_FindOneByEmail(t *testing.T) {
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	conn := sqlx.NewSqlConnFromSession(sqlx.NewSqlConnFromDB(db))
	model := NewUsersModel(conn)

	rows := sqlmock.NewRows([]string{"id", "username", "password", "email", "phone", "role", "created_at", "updated_at"}).
		AddRow(1, "testuser", "password123", "test@example.com", "", "user", 1234567890, 1234567890)

	mock.ExpectQuery("select .* from `users`").
		WithArgs("test@example.com").
		WillReturnRows(rows)

	ctx := context.Background()
	result, err := model.FindOneByEmail(ctx, "test@example.com")
	assert.NoError(t, err)
	assert.Equal(t, "test@example.com", result.Email)
}

func TestUsersModel_FindOneByUsername(t *testing.T) {
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	conn := sqlx.NewSqlConnFromSession(sqlx.NewSqlConnFromDB(db))
	model := NewUsersModel(conn)

	rows := sqlmock.NewRows([]string{"id", "username", "password", "email", "phone", "role", "created_at", "updated_at"}).
		AddRow(1, "testuser", "password123", "test@example.com", "", "user", 1234567890, 1234567890)

	mock.ExpectQuery("select .* from `users`").
		WithArgs("testuser").
		WillReturnRows(rows)

	ctx := context.Background()
	result, err := model.FindOneByUsername(ctx, "testuser")
	assert.NoError(t, err)
	assert.Equal(t, "testuser", result.Username)
}

func TestUsersModel_Update(t *testing.T) {
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	conn := sqlx.NewSqlConnFromSession(sqlx.NewSqlConnFromDB(db))
	model := NewUsersModel(conn)

	mock.ExpectExec("update `users`").
		WithArgs("testuser", "newpassword", "test@example.com", sql.NullString{}, "admin", 1).
		WillReturnResult(sqlmock.NewResult(1, 1))

	ctx := context.Background()
	user := &Users{
		Id:       1,
		Username: "testuser",
		Password: "newpassword",
		Email:    "test@example.com",
		Role:     "admin",
	}

	err = model.Update(ctx, user)
	assert.NoError(t, err)
}

func TestUsersModel_Delete(t *testing.T) {
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	conn := sqlx.NewSqlConnFromSession(sqlx.NewSqlConnFromDB(db))
	model := NewUsersModel(conn)

	mock.ExpectExec("delete from `users`").
		WithArgs(1).
		WillReturnResult(sqlmock.NewResult(0, 1))

	ctx := context.Background()
	err = model.Delete(ctx, 1)
	assert.NoError(t, err)
}

func TestUsersModel_withSession(t *testing.T) {
	db, _, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	conn := sqlx.NewSqlConnFromSession(sqlx.NewSqlConnFromDB(db))
	model := NewUsersModel(conn)

	sessionModel := model.withSession(conn)
	assert.NotNil(t, sessionModel)
}

func TestUsersModel_Insert_Error(t *testing.T) {
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()

	conn := sqlx.NewSqlConnFromSession(sqlx.NewSqlConnFromDB(db))
	model := NewUsersModel(conn)

	mock.ExpectExec("insert into `users`").
		WillReturnError(errors.New("database error"))

	ctx := context.Background()
	user := &Users{
		Username: "testuser",
		Password: "password123",
		Email:    "test@example.com",
		Role:     "user",
	}

	_, err = model.Insert(ctx, user)
	assert.Error(t, err)
}
