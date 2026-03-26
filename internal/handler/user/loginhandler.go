// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package user

import (
	"net/http"

	"career-api/internal/logic/user"
	"career-api/internal/middleware"
	"career-api/internal/svc"
	"career-api/internal/types"
	"github.com/zeromicro/go-zero/rest/httpx"
)

// User login
func LoginHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	validationMiddleware := middleware.NewValidationMiddleware()

	return func(w http.ResponseWriter, r *http.Request) {
		var req types.LoginReq

		// 验证请求参数
		if !validationMiddleware.ValidateAndErrorResponse(w, r, &req) {
			return
		}

		l := user.NewLoginLogic(r.Context(), svcCtx)
		resp, err := l.Login(&req)
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}
