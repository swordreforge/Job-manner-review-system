package interview

import (
	"net/http"

	"career-api/internal/logic/interview"
	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/rest/httpx"
)

// DeleteInterviewHandler handles the delete interview request
func DeleteInterviewHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.DeleteInterviewReq
		if err := httpx.Parse(r, &req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		l := interview.NewDeleteInterviewLogic(r.Context(), svcCtx)
		resp, err := l.DeleteInterview(&req)
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}