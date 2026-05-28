package user

import (
	"net/http"

	"career-api/internal/logic/user"
	"career-api/internal/svc"

	"github.com/zeromicro/go-zero/rest/httpx"
)

func GetUserProgressHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		l := user.NewGetUserProgressLogic(r.Context(), svcCtx)
		resp, err := l.GetUserProgress()
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}
		httpx.OkJsonCtx(r.Context(), w, resp)
	}
}