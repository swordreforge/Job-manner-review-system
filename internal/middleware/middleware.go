package middleware

import (
	"context"
	"database/sql"
	"net/http"
	"strings"

	"career-api/internal/pkg"
	_ "github.com/go-sql-driver/mysql"
)

type AuthMiddleware struct {
	accessSecret string
	dataSource   string
}

func NewAuthMiddleware(accessSecret string) *AuthMiddleware {
	return &AuthMiddleware{accessSecret: accessSecret}
}

func NewAuthMiddlewareWithDSN(accessSecret, dataSource string) *AuthMiddleware {
	return &AuthMiddleware{accessSecret: accessSecret, dataSource: dataSource}
}

func (m *AuthMiddleware) Handle(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path
		if strings.Contains(path, "/user/login") ||
			strings.Contains(path, "/user/register") ||
			strings.Contains(path, "/teachers/register") ||
			strings.Contains(path, "/health") ||
			strings.HasPrefix(path, "/img/") {
			next(w, r)
			return
		}

		// 首先尝试从 Authorization header 获取 token
		auth := r.Header.Get("Authorization")
		token := ""

		if auth != "" {
			parts := strings.SplitN(auth, " ", 2)
			if len(parts) == 2 && parts[0] == "Bearer" {
				token = parts[1]
			}
		}

		// 如果 header 中没有 token，尝试从 URL 参数获取（用于 SSE 连接）
		if token == "" {
			token = r.URL.Query().Get("token")
		}

		if token == "" {
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte("\x1b[31m401 Unauthorized: missing authorization token\x1b[0m\n"))
			return
		}

		claims, err := pkg.ParseToken(token, m.accessSecret)
		if err != nil {
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte("\x1b[31m401 Unauthorized: invalid token\x1b[0m\n"))
			return
		}

		ctx := context.WithValue(r.Context(), "userId", claims.UserId)
		ctx = context.WithValue(ctx, "username", claims.Username)
		ctx = context.WithValue(ctx, "role", claims.Role)

		// For teachers, add schoolId to context
		if claims.Role == "teacher" {
			schoolId := m.getTeacherSchoolId(claims.UserId)
			ctx = context.WithValue(ctx, "schoolId", schoolId)
		}

		next(w, r.WithContext(ctx))
	}
}

func (m *AuthMiddleware) getTeacherSchoolId(userId int64) int64 {
	if m.dataSource == "" {
		return 1 // default
	}

	db, err := sql.Open("mysql", m.dataSource)
	if err != nil {
		return 1
	}
	defer db.Close()

	var schoolId int64
	err = db.QueryRow("SELECT school_id FROM teachers WHERE user_id = ?", userId).Scan(&schoolId)
	if err != nil {
		return 1
	}
	return schoolId
}
