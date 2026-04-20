// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package match

import (
	"net/http"

	"career-api/internal/logic/match"
	"career-api/internal/svc"
	"career-api/internal/types"
	"github.com/zeromicro/go-zero/rest/httpx"
)

// Match student to single job
func MatchStudentJobHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.MatchReq
		if err := httpx.Parse(r, &req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		l := match.NewMatchStudentJobLogic(r.Context(), svcCtx)
		resp, err := l.MatchStudentJob(&req)
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}
