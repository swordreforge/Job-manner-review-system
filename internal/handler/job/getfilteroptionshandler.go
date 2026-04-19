package job

import (
	"net/http"

	"career-api/internal/logic/job"
	"career-api/internal/svc"

	"github.com/zeromicro/go-zero/rest/httpx"
)

func GetFilterOptionsHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		l := job.NewGetFilterOptionsLogic(r.Context(), svcCtx)
		resp, err := l.GetFilterOptions()
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}