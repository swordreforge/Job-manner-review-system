package middleware

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"

	"career-api/internal/pkg"
)

func TestAuthMiddleware_Handle_WithValidToken(t *testing.T) {
	secret := "test-secret-key"
	middleware := NewAuthMiddleware(secret)

	token, err := pkg.GenerateToken(123, "testuser", "user", secret, 3600)
	assert.NoError(t, err)

	nextCalled := false
	nextHandler := func(w http.ResponseWriter, r *http.Request) {
		nextCalled = true

		userId := r.Context().Value("userId")
		username := r.Context().Value("username")
		role := r.Context().Value("role")

		assert.Equal(t, int64(123), userId)
		assert.Equal(t, "testuser", username)
		assert.Equal(t, "user", role)
	}

	req := httptest.NewRequest("GET", "/api/v1/reports", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w := httptest.NewRecorder()

	handler := middleware.Handle(nextHandler)
	handler(w, req)

	assert.True(t, nextCalled)
}

func TestAuthMiddleware_Handle_WithoutToken(t *testing.T) {
	secret := "test-secret-key"
	middleware := NewAuthMiddleware(secret)

	nextCalled := false
	nextHandler := func(w http.ResponseWriter, r *http.Request) {
		nextCalled = true
	}

	req := httptest.NewRequest("GET", "/api/v1/reports", nil)
	w := httptest.NewRecorder()

	handler := middleware.Handle(nextHandler)
	handler(w, req)

	assert.False(t, nextCalled)
	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestAuthMiddleware_Handle_WithInvalidTokenFormat(t *testing.T) {
	secret := "test-secret-key"
	middleware := NewAuthMiddleware(secret)

	nextCalled := false
	nextHandler := func(w http.ResponseWriter, r *http.Request) {
		nextCalled = true
	}

	req := httptest.NewRequest("GET", "/api/v1/reports", nil)
	req.Header.Set("Authorization", "InvalidFormat token")
	w := httptest.NewRecorder()

	handler := middleware.Handle(nextHandler)
	handler(w, req)

	assert.False(t, nextCalled)
	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestAuthMiddleware_Handle_WithInvalidToken(t *testing.T) {
	secret := "test-secret-key"
	middleware := NewAuthMiddleware(secret)

	nextCalled := false
	nextHandler := func(w http.ResponseWriter, r *http.Request) {
		nextCalled = true
	}

	req := httptest.NewRequest("GET", "/api/v1/reports", nil)
	req.Header.Set("Authorization", "Bearer invalid.token.here")
	w := httptest.NewRecorder()

	handler := middleware.Handle(nextHandler)
	handler(w, req)

	assert.False(t, nextCalled)
	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestAuthMiddleware_Handle_LoginPath(t *testing.T) {
	secret := "test-secret-key"
	middleware := NewAuthMiddleware(secret)

	nextCalled := false
	nextHandler := func(w http.ResponseWriter, r *http.Request) {
		nextCalled = true
	}

	req := httptest.NewRequest("POST", "/api/v1/user/login", nil)
	w := httptest.NewRecorder()

	handler := middleware.Handle(nextHandler)
	handler(w, req)

	assert.True(t, nextCalled)
}

func TestAuthMiddleware_Handle_RegisterPath(t *testing.T) {
	secret := "test-secret-key"
	middleware := NewAuthMiddleware(secret)

	nextCalled := false
	nextHandler := func(w http.ResponseWriter, r *http.Request) {
		nextCalled = true
	}

	req := httptest.NewRequest("POST", "/api/v1/user/register", nil)
	w := httptest.NewRecorder()

	handler := middleware.Handle(nextHandler)
	handler(w, req)

	assert.True(t, nextCalled)
}

func TestAuthMiddleware_Handle_HealthPath(t *testing.T) {
	secret := "test-secret-key"
	middleware := NewAuthMiddleware(secret)

	nextCalled := false
	nextHandler := func(w http.ResponseWriter, r *http.Request) {
		nextCalled = true
	}

	req := httptest.NewRequest("GET", "/health", nil)
	w := httptest.NewRecorder()

	handler := middleware.Handle(nextHandler)
	handler(w, req)

	assert.True(t, nextCalled)
}

func TestAuthMiddleware_Handle_WithAdminToken(t *testing.T) {
	secret := "test-secret-key"
	middleware := NewAuthMiddleware(secret)

	token, err := pkg.GenerateToken(1, "admin", "admin", secret, 3600)
	assert.NoError(t, err)

	nextCalled := false
	nextHandler := func(w http.ResponseWriter, r *http.Request) {
		nextCalled = true

		role := r.Context().Value("role")
		assert.Equal(t, "admin", role)
	}

	req := httptest.NewRequest("GET", "/api/v1/admin/users", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w := httptest.NewRecorder()

	handler := middleware.Handle(nextHandler)
	handler(w, req)

	assert.True(t, nextCalled)
}

func TestAuthMiddleware_Handle_ContextPropagation(t *testing.T) {
	secret := "test-secret-key"
	middleware := NewAuthMiddleware(secret)

	token, err := pkg.GenerateToken(456, "contextuser", "user", secret, 3600)
	assert.NoError(t, err)

	originalCtx := context.Background()
	nextHandler := func(w http.ResponseWriter, r *http.Request) {
		assert.NotNil(t, r.Context().Value("userId"))
		assert.NotNil(t, r.Context().Value("username"))
		assert.NotNil(t, r.Context().Value("role"))
	}

	req := httptest.NewRequest("GET", "/api/v1/reports", nil).WithContext(originalCtx)
	req.Header.Set("Authorization", "Bearer "+token)
	w := httptest.NewRecorder()

	handler := middleware.Handle(nextHandler)
	handler(w, req)
}

func TestAuthMiddleware_Handle_MultipleMiddleware(t *testing.T) {
	secret := "test-secret-key"
	authMiddleware := NewAuthMiddleware(secret)

	token, err := pkg.GenerateToken(789, "multiuser", "user", secret, 3600)
	assert.NoError(t, err)

	authMiddlewareCalled := false
	nextHandler := func(w http.ResponseWriter, r *http.Request) {
		authMiddlewareCalled = true
		assert.Equal(t, int64(789), r.Context().Value("userId"))
	}

	req := httptest.NewRequest("GET", "/api/v1/reports", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w := httptest.NewRecorder()

	handler := authMiddleware.Handle(nextHandler)
	handler(w, req)

	assert.True(t, authMiddlewareCalled)
}

func TestNewAuthMiddleware(t *testing.T) {
	secret := "test-secret-key"
	middleware := NewAuthMiddleware(secret)

	assert.NotNil(t, middleware)
	assert.Equal(t, secret, middleware.accessSecret)
}

func TestAuthMiddleware_Handle_WithBearerButNoToken(t *testing.T) {
	secret := "test-secret-key"
	middleware := NewAuthMiddleware(secret)

	nextCalled := false
	nextHandler := func(w http.ResponseWriter, r *http.Request) {
		nextCalled = true
	}

	req := httptest.NewRequest("GET", "/api/v1/reports", nil)
	req.Header.Set("Authorization", "Bearer ")
	w := httptest.NewRecorder()

	handler := middleware.Handle(nextHandler)
	handler(w, req)

	assert.False(t, nextCalled)
	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestAuthMiddleware_Handle_WithMalformedToken(t *testing.T) {
	secret := "test-secret-key"
	middleware := NewAuthMiddleware(secret)

	nextCalled := false
	nextHandler := func(w http.ResponseWriter, r *http.Request) {
		nextCalled = true
	}

	req := httptest.NewRequest("GET", "/api/v1/reports", nil)
	req.Header.Set("Authorization", "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9")
	w := httptest.NewRecorder()

	handler := middleware.Handle(nextHandler)
	handler(w, req)

	assert.False(t, nextCalled)
	assert.Equal(t, http.StatusUnauthorized, w.Code)
}