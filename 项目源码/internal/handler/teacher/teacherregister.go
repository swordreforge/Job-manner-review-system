package handler

import (
	"net/http"

	"career-api/internal/logic/teacher"
	"career-api/internal/middleware"
	"career-api/internal/svc"
	"career-api/internal/types"
	"github.com/zeromicro/go-zero/rest/httpx"
)

func TeacherRegisterHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	validationMiddleware := middleware.NewValidationMiddleware()

	return func(w http.ResponseWriter, r *http.Request) {
		var req types.TeacherRegisterReq

		if !validationMiddleware.ValidateAndErrorResponse(w, r, &req) {
			return
		}

		l := teacher.NewTeacherRegisterLogic(r.Context(), svcCtx)
		resp, err := l.TeacherRegister(&req)
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}
