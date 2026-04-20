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

// User registration
func RegisterHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	validationMiddleware := middleware.NewValidationMiddleware()

	return func(w http.ResponseWriter, r *http.Request) {
		var req types.RegisterReq

		// 验证请求参数
		if !validationMiddleware.ValidateAndErrorResponse(w, r, &req) {
			return
		}

		l := user.NewRegisterLogic(r.Context(), svcCtx)
		resp, err := l.Register(&req)
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			if resp == nil {
				resp = &types.UserResp{
					Code: 500,
					Msg:  "internal error: resp is nil",
				}
			}
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}
