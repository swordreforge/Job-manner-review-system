package user

import (
	"net/http"

	"career-api/internal/logic/user"
	"career-api/internal/middleware"
	"career-api/internal/svc"
	"career-api/internal/types"
	"github.com/zeromicro/go-zero/rest/httpx"
)

func DeleteAccountHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	validationMiddleware := middleware.NewValidationMiddleware()

	return func(w http.ResponseWriter, r *http.Request) {
		var req types.DeleteAccountReq
		if !validationMiddleware.ValidateAndErrorResponse(w, r, &req) {
			return
		}

		l := user.NewDeleteAccountLogic(r.Context(), svcCtx)
		resp, err := l.DeleteAccount(&req)
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}
