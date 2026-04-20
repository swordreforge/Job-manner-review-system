// Code scaffolded by goctl. DO NOT EDIT.

package user

import (
	"net/http"

	"github.com/zeromicro/go-zero/rest/httpx"

	"career-api/internal/logic/user"
	"career-api/internal/svc"
	"career-api/internal/types"
)

func UploadAvatarHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.UploadAvatarReq
		if err := httpx.Parse(r, &req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		l := user.NewUploadAvatarLogic(r.Context(), svcCtx)
		resp, err := l.UploadAvatar(&req)
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}
