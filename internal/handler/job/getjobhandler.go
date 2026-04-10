// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package job

import (
	"net/http"
	"strconv"
	"strings"

	"career-api/internal/logic/job"
	"career-api/internal/svc"

	"github.com/zeromicro/go-zero/core/logx"
	"github.com/zeromicro/go-zero/rest/httpx"
)

func GetJobHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		logx.Infof("GetJobHandler: rawPath=%s, URL=%s, query=%s", r.URL.RawPath, r.URL.Path, r.URL.RawQuery)

		// Try to get ID from path params
		idStr := ""
		// Check URL path directly - might need to parse from path
		pathParts := strings.Split(r.URL.Path, "/")
		if len(pathParts) >= 5 {
			idStr = pathParts[4] // /api/v1/jobs/:id -> index 4 (index 0 is empty)
		}
		logx.Infof("GetJobHandler: pathParts=%v, idStr=%q", pathParts, idStr)

		id, err := strconv.ParseInt(idStr, 10, 64)
		if err != nil {
			logx.Errorf("GetJobHandler: failed to parse id: %v, idStr=%q", err, idStr)
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		l := job.NewGetJobLogic(r.Context(), svcCtx, id)
		resp, err := l.GetJob()
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}
