package user

import (
	"net/http"

	"career-api/internal/logic/user"
	"career-api/internal/middleware"
	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/rest/httpx"
)

func UpdatePasswordHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	validationMiddleware := middleware.NewValidationMiddleware()

	return func(w http.ResponseWriter, r *http.Request) {
		var req types.UpdatePasswordReq
		if !validationMiddleware.ValidateAndErrorResponse(w, r, &req) {
			return
		}

		l := user.NewUpdatePasswordLogic(r.Context(), svcCtx)
		resp, err := l.UpdatePassword(&req)
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}
