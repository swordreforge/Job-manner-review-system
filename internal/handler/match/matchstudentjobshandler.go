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

// Match student to multiple jobs
func MatchStudentJobsHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.MatchListReq
		if err := httpx.Parse(r, &req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		l := match.NewMatchStudentJobsLogic(r.Context(), svcCtx)
		resp, err := l.MatchStudentJobs(&req)
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}
