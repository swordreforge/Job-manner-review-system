// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package report

import (
	"net/http"

	"career-api/internal/logic/report"
	"career-api/internal/svc"
	"career-api/internal/types"
	"github.com/zeromicro/go-zero/rest/httpx"
)

// Export report
func ExportReportHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.ExportReq
		if err := httpx.Parse(r, &req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		l := report.NewExportReportLogic(r.Context(), svcCtx)
		resp, err := l.ExportReport(&req)
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}
