// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package graph

import (
	"net/http"
	"strconv"
	"strings"

	"career-api/internal/logic/graph"
	"career-api/internal/svc"

	"github.com/zeromicro/go-zero/rest/httpx"
)

func GeneratePathAnalysisHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		pathParts := strings.Split(r.URL.Path, "/")
		var req graph.GeneratePathAnalysisReq
		if len(pathParts) >= 5 {
			req.FromJobId, _ = strconv.ParseInt(pathParts[4], 10, 64)
		}

		if err := httpx.Parse(r, &req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		l := graph.NewGeneratePathAnalysisLogic(r.Context(), svcCtx)
		resp, err := l.GeneratePathAnalysis(&req)
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}
