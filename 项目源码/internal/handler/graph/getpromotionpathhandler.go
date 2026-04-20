// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package graph

import (
	"net/http"
	"strconv"
	"strings"

	"career-api/internal/logic/graph"
	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/rest/httpx"
)

// Get promotion path for a job
func GetPromotionPathHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		pathParts := strings.Split(r.URL.Path, "/")
		var req types.JobGraphReq
		if len(pathParts) >= 5 {
			req.JobId, _ = strconv.ParseInt(pathParts[4], 10, 64)
		}

		l := graph.NewGetPromotionPathLogic(r.Context(), svcCtx)
		resp, err := l.GetPromotionPath(&req)
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}
