// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package student

import (
	"net/http"

	"career-api/internal/logic/student"
	"career-api/internal/svc"
	"career-api/internal/types"
	"github.com/zeromicro/go-zero/rest/httpx"
)

// Upload resume and generate profile via AI
func UploadResumeHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.ResumeUploadReq
		if err := httpx.Parse(r, &req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		l := student.NewUploadResumeLogic(r.Context(), svcCtx)
		resp, err := l.UploadResume(&req)
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}
