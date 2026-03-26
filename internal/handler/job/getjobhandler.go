// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package job

import (
	"net/http"

	"career-api/internal/logic/job"
	"career-api/internal/svc"
	"github.com/zeromicro/go-zero/rest/httpx"
)

// Get job profile by id
func GetJobHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		l := job.NewGetJobLogic(r.Context(), svcCtx)
		resp, err := l.GetJob()
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}
