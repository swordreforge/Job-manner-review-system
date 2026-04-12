package user

import (
	"net/http"

	"github.com/zeromicro/go-zero/rest/httpx"

	"career-api/internal/logic/user"
	"career-api/internal/svc"
)

func ResetAvatarHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		l := user.NewResetAvatarLogic(r.Context(), svcCtx)
		resp, err := l.ResetAvatar()
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}
