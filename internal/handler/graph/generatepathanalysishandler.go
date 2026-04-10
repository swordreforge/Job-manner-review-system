// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

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

func GeneratePathAnalysisHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		pathParts := strings.Split(r.URL.Path, "/")
		var fromJobId int64
		if len(pathParts) >= 5 {
			fromJobId, _ = strconv.ParseInt(pathParts[4], 10, 64)
		}

		var bodyReq struct {
			ToJobId   int64  `json:"toJobId"`
			StudentId int64  `json:"studentId"`
			PathType  string `json:"pathType"`
		}

		if err := json.NewDecoder(r.Body).Decode(&bodyReq); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		l := graph.NewGeneratePathAnalysisLogic(r.Context(), svcCtx)

		// 如果有toJobId，分析具体路径
		if bodyReq.ToJobId > 0 {
			req := &graph.GeneratePathAnalysisReq{
				FromJobId: fromJobId,
				ToJobId:   bodyReq.ToJobId,
				StudentId: bodyReq.StudentId,
				PathType:  bodyReq.PathType,
			}
			resp, err := l.GeneratePathAnalysis(req)
			if err != nil {
				httpx.ErrorCtx(r.Context(), w, err)
			} else {
				httpx.OkJsonCtx(r.Context(), w, resp)
			}
			return
		}

		// 没有toJobId，生成晋升目标
		req := &graph.GeneratePromotionTargetsReq{
			JobId:     fromJobId,
			StudentId: bodyReq.StudentId,
		}
		resp, err := l.GeneratePromotionTargets(req)
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}
