// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package interview

import (
	"net/http"

	"career-api/internal/logic/interview"
	"career-api/internal/svc"
	"github.com/zeromicro/go-zero/rest/httpx"
)

// Get interview history
func GetInterviewHistoryHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		l := interview.NewGetInterviewHistoryLogic(r.Context(), svcCtx)
		resp, err := l.GetInterviewHistory()
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}
