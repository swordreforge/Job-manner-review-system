package pkg

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestGenerateToken(t *testing.T) {
	secret := "test-secret-key"
	userId := int64(123)
	username := "testuser"
	role := "user"
	expireSeconds := int64(3600)

	token, err := GenerateToken(userId, username, role, secret, expireSeconds)

	assert.NoError(t, err)
	assert.NotEmpty(t, token)
	assert.Greater(t, len(token), 50)
}

func TestParseToken_Success(t *testing.T) {
	secret := "test-secret-key"
	userId := int64(123)
	username := "testuser"
	role := "user"
	expireSeconds := int64(3600)

	token, err := GenerateToken(userId, username, role, secret, expireSeconds)
	assert.NoError(t, err)

	claims, err := ParseToken(token, secret)
	assert.NoError(t, err)
	assert.Equal(t, userId, claims.UserId)
	assert.Equal(t, username, claims.Username)
	assert.Equal(t, role, claims.Role)
}

func TestParseToken_InvalidToken(t *testing.T) {
	secret := "test-secret-key"
	invalidToken := "invalid.token.string"

	claims, err := ParseToken(invalidToken, secret)

	assert.Error(t, err)
	assert.Nil(t, claims)
}

func TestParseToken_WrongSecret(t *testing.T) {
	secret1 := "test-secret-key-1"
	secret2 := "test-secret-key-2"
	userId := int64(123)
	username := "testuser"
	role := "user"
	expireSeconds := int64(3600)

	token, err := GenerateToken(userId, username, role, secret1, expireSeconds)
	assert.NoError(t, err)

	claims, err := ParseToken(token, secret2)

	assert.Error(t, err)
	assert.Nil(t, claims)
}

func TestParseToken_ExpiredToken(t *testing.T) {
	secret := "test-secret-key"
	userId := int64(123)
	username := "testuser"
	role := "user"
	expireSeconds := int64(-1)

	token, err := GenerateToken(userId, username, role, secret, expireSeconds)
	assert.NoError(t, err)

	time.Sleep(10 * time.Millisecond)

	claims, err := ParseToken(token, secret)

	assert.Error(t, err)
	assert.Nil(t, claims)
}

func TestGenerateToken_WithLongExpiry(t *testing.T) {
	secret := "test-secret-key"
	userId := int64(123)
	username := "testuser"
	role := "admin"
	expireSeconds := int64(86400 * 7)

	token, err := GenerateToken(userId, username, role, secret, expireSeconds)

	assert.NoError(t, err)
	assert.NotEmpty(t, token)

	claims, err := ParseToken(token, secret)
	assert.NoError(t, err)
	assert.Equal(t, "admin", claims.Role)
}

func TestGenerateToken_WithDifferentRoles(t *testing.T) {
	secret := "test-secret-key"
	userId := int64(123)
	username := "testuser"
	expireSeconds := int64(3600)

	roles := []string{"user", "admin", "moderator"}

	for _, role := range roles {
		token, err := GenerateToken(userId, username, role, secret, expireSeconds)
		assert.NoError(t, err)

		claims, err := ParseToken(token, secret)
		assert.NoError(t, err)
		assert.Equal(t, role, claims.Role)
	}
}

func TestGenerateToken_EmptySecret(t *testing.T) {
	secret := ""
	userId := int64(123)
	username := "testuser"
	role := "user"
	expireSeconds := int64(3600)

	token, err := GenerateToken(userId, username, role, secret, expireSeconds)

	assert.NoError(t, err)
	assert.NotEmpty(t, token)
}

func TestParseToken_EmptyToken(t *testing.T) {
	secret := "test-secret-key"
	token := ""

	claims, err := ParseToken(token, secret)

	assert.Error(t, err)
	assert.Nil(t, claims)
}

func TestParseToken_TokenClaimsStructure(t *testing.T) {
	secret := "test-secret-key"
	userId := int64(123)
	username := "testuser"
	role := "admin"
	expireSeconds := int64(3600)

	token, err := GenerateToken(userId, username, role, secret, expireSeconds)
	assert.NoError(t, err)

	claims, err := ParseToken(token, secret)
	assert.NoError(t, err)

	assert.NotNil(t, claims.UserId)
	assert.NotNil(t, claims.Username)
	assert.NotNil(t, claims.Role)
	assert.NotNil(t, claims.ExpiresAt)
	assert.NotNil(t, claims.IssuedAt)
	assert.NotNil(t, claims.NotBefore)
}

func TestGenerateToken_UserIdZero(t *testing.T) {
	secret := "test-secret-key"
	userId := int64(0)
	username := "testuser"
	role := "user"
	expireSeconds := int64(3600)

	token, err := GenerateToken(userId, username, role, secret, expireSeconds)

	assert.NoError(t, err)
	assert.NotEmpty(t, token)

	claims, err := ParseToken(token, secret)
	assert.NoError(t, err)
	assert.Equal(t, int64(0), claims.UserId)
}

func TestGenerateToken_LargeUserId(t *testing.T) {
	secret := "test-secret-key"
	userId := int64(9223372036854775807)
	username := "testuser"
	role := "user"
	expireSeconds := int64(3600)

	token, err := GenerateToken(userId, username, role, secret, expireSeconds)

	assert.NoError(t, err)
	assert.NotEmpty(t, token)

	claims, err := ParseToken(token, secret)
	assert.NoError(t, err)
	assert.Equal(t, int64(9223372036854775807), claims.UserId)
}