package middleware

import (
	"context"
	"net/http"
	"strings"

	"career-api/internal/pkg"
)

type AuthMiddleware struct {
	accessSecret string
}

func NewAuthMiddleware(accessSecret string) *AuthMiddleware {
	return &AuthMiddleware{accessSecret: accessSecret}
}

func (m *AuthMiddleware) Handle(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path
		if strings.Contains(path, "/user/login") ||
			strings.Contains(path, "/user/register") ||
			strings.Contains(path, "/health") {
			next(w, r)
			return
		}

		auth := r.Header.Get("Authorization")
		if auth == "" {
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte(`{"code":401,"msg":"missing authorization header"}`))
			return
		}

		parts := strings.SplitN(auth, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte(`{"code":401,"msg":"invalid authorization format"}`))
			return
		}

		claims, err := pkg.ParseToken(parts[1], m.accessSecret)
		if err != nil {
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte(`{"code":401,"msg":"invalid token"}`))
			return
		}

		ctx := context.WithValue(r.Context(), "userId", claims.UserId)
		ctx = context.WithValue(ctx, "username", claims.Username)
		ctx = context.WithValue(ctx, "role", claims.Role)

		next(w, r.WithContext(ctx))
	}
}