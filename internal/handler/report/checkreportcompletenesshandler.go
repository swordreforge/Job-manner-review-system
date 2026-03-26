// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package report

import (
	"net/http"

	"career-api/internal/logic/report"
	"career-api/internal/svc"
	"github.com/zeromicro/go-zero/rest/httpx"
)

// Check report completeness
func CheckReportCompletenessHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		l := report.NewCheckReportCompletenessLogic(r.Context(), svcCtx)
		resp, err := l.CheckReportCompleteness()
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}
