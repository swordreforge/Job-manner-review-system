package middleware

import (
	"context"
	"net/http"
	"strings"

	"career-api/internal/pkg"
	"career-api/internal/svc"
)

type AuthMiddleware struct {
	accessSecret string
	svcCtx       *svc.ServiceContext
}

func NewAuthMiddleware(accessSecret string) *AuthMiddleware {
	return &AuthMiddleware{accessSecret: accessSecret}
}

func NewAuthMiddlewareWithDSN(accessSecret, dataSource string) *AuthMiddleware {
	return &AuthMiddleware{accessSecret: accessSecret}
}

func NewAuthMiddlewareWithServiceContext(accessSecret string, svcCtx *svc.ServiceContext) *AuthMiddleware {
	return &AuthMiddleware{accessSecret: accessSecret, svcCtx: svcCtx}
}

var publicPaths = map[string]bool{
	"/api/v1/user/login":        true,
	"/api/v1/user/register":     true,
	"/api/v1/teachers/register": true,
	"/health":                    true,
}

func (m *AuthMiddleware) Handle(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path

		if publicPaths[path] || strings.HasPrefix(path, "/img/") {
			next(w, r)
			return
		}

		auth := r.Header.Get("Authorization")
		token := ""

		if auth != "" {
			parts := strings.SplitN(auth, " ", 2)
			if len(parts) == 2 && parts[0] == "Bearer" {
				token = parts[1]
			}
		}

		if token == "" {
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte("401 Unauthorized: missing authorization token\n"))
			return
		}

		claims, err := pkg.ParseToken(token, m.accessSecret)
		if err != nil {
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte("401 Unauthorized: invalid token\n"))
			return
		}

		ctx := context.WithValue(r.Context(), "userId", claims.UserId)
		ctx = context.WithValue(ctx, "username", claims.Username)
		ctx = context.WithValue(ctx, "role", claims.Role)

		if claims.Role == "teacher" {
			schoolId, teacherId := m.getTeacherInfo(claims.UserId)
			ctx = context.WithValue(ctx, "schoolId", schoolId)
			ctx = context.WithValue(ctx, "teacherId", teacherId)
		}

		next(w, r.WithContext(ctx))
	}
}

func (m *AuthMiddleware) getTeacherInfo(userId int64) (schoolId, teacherId int64) {
	schoolId = 1
	teacherId = 1

	if m.svcCtx == nil || m.svcCtx.DB == nil {
		return
	}

	db, err := m.svcCtx.DB.RawDB()
	if err != nil {
		return
	}

	err = db.QueryRowContext(context.Background(),
		"SELECT id, school_id FROM teachers WHERE user_id = ?", userId).
		Scan(&teacherId, &schoolId)
	if err != nil {
		return
	}

	return schoolId, teacherId
}