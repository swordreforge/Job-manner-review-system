// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package report

import (
	"context"
	"net/http"
	"strconv"

	"career-api/internal/logic/report"
	"career-api/internal/svc"
	"career-api/internal/types"
	"github.com/zeromicro/go-zero/rest/httpx"
)

// Generate career report via SSE stream
func GenerateReportStreamHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.GenerateReportStreamReq

		// 从 URL 查询参数解析
		studentIdStr := r.URL.Query().Get("studentId")
		studentId, err := strconv.ParseInt(studentIdStr, 10, 64)
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}
		req.StudentId = studentId

		req.Track = r.URL.Query().Get("track")

		targetJobIdStr := r.URL.Query().Get("targetJobId")
		if targetJobIdStr != "" {
			targetJobId, err := strconv.ParseInt(targetJobIdStr, 10, 64)
			if err != nil {
				httpx.ErrorCtx(r.Context(), w, err)
				return
			}
			req.TargetJobId = targetJobId
		}

		// 将 response writer 传递给 context，用于 SSE 响应
		ctx := context.WithValue(r.Context(), "responseWriter", w)

		l := report.NewGenerateReportStreamLogic(ctx, svcCtx)
		err = l.GenerateReportStream(&req)
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		}
		// SSE 响应不需要调用 httpx.Ok
	}
}
