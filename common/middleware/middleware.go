package middleware

import (
	"net/http"
	"strings"

	"github.com/zeromicro/go-zero/core/logx"
	"github.com/zeromicro/go-zero/rest"
	"github.com/zeromicro/go-zero/rest/token"
)

type JwtPayload struct {
	UserId   int64  `json:"userId"`
	Username string `json:"username"`
	Role     string `json:"role"`
}

func NewJwtPayLoad(userId int64, username, role string) *JwtPayload {
	return &JwtPayload{
		UserId:   userId,
		Username: username,
		Role:     role,
	}
}

func AuthInterceptor(key string) rest.Middleware {
	return func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				http.Error(w, "missing authorization header", http.StatusUnauthorized)
				return
			}

			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) != 2 || parts[0] != "Bearer" {
				http.Error(w, "invalid authorization header format", http.StatusUnauthorized)
				return
			}

			tokenString := parts[1]
			tk := &token.Token{
				AccessToken: tokenString,
			}

			if err := token.New(key).Validate(tk); err != nil {
				logx.Errorf("token validate failed: %v", err)
				http.Error(w, "invalid token", http.StatusUnauthorized)
				return
			}

			next(w, r)
		}
	}
}

func GetUserIdFromContext(r *http.Request) int64 {
	if userId := r.Context().Value("userId"); userId != nil {
		return userId.(int64)
	}
	return 0
}

func GetUsernameFromContext(r *http.Request) string {
	if username := r.Context().Value("username"); username != nil {
		return username.(string)
	}
	return ""
}
