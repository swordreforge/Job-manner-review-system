package student

import (
	"net/http"

	"career-api/internal/logic/student"
	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/rest/httpx"
)

func JoinSchoolHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.JoinSchoolReq
		if err := httpx.Parse(r, &req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		l := student.NewJoinSchoolLogic(r.Context(), svcCtx)
		resp, err := l.JoinSchool(&req)
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		httpx.OkJsonCtx(r.Context(), w, types.JoinSchoolResp{
			Code: resp.Code,
			Msg:  resp.Msg,
			Data: resp.Data,
		})
	}
}
