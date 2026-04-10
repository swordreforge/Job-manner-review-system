package graph

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"career-api/internal/logic/graph"
	"career-api/internal/svc"

	"github.com/zeromicro/go-zero/rest/httpx"
)

func GenerateTransferTargetsHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		pathParts := strings.Split(r.URL.Path, "/")
		var jobId int64
		if len(pathParts) >= 5 {
			jobId, _ = strconv.ParseInt(pathParts[4], 10, 64)
		}

		var bodyReq struct {
			StudentId int64 `json:"studentId"`
		}

		if err := json.NewDecoder(r.Body).Decode(&bodyReq); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		l := graph.NewGeneratePathAnalysisLogic(r.Context(), svcCtx)
		req := &graph.GenerateTransferTargetsReq{
			JobId:     jobId,
			StudentId: bodyReq.StudentId,
		}
		resp, err := l.GenerateTransferTargets(req)
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}
