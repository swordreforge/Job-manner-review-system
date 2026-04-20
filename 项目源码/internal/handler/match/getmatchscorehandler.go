// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package match

import (
	"net/http"

	"career-api/internal/logic/match"
	"career-api/internal/svc"
	"github.com/zeromicro/go-zero/rest/httpx"
)

// Get match score for a job
func GetMatchScoreHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		l := match.NewGetMatchScoreLogic(r.Context(), svcCtx)
		resp, err := l.GetMatchScore()
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}
