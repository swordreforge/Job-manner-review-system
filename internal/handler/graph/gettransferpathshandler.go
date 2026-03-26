// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package graph

import (
	"net/http"

	"career-api/internal/logic/graph"
	"career-api/internal/svc"
	"career-api/internal/types"
	"github.com/zeromicro/go-zero/rest/httpx"
)

// Get transfer paths for a job
func GetTransferPathsHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.JobGraphReq
		if err := httpx.Parse(r, &req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		l := graph.NewGetTransferPathsLogic(r.Context(), svcCtx)
		resp, err := l.GetTransferPaths(&req)
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}
