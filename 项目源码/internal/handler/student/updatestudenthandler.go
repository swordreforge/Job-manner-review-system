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

// Update student profile
func UpdateStudentHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.UpdateStudentReq
		if err := httpx.Parse(r, &req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		l := student.NewUpdateStudentLogic(r.Context(), svcCtx)
		resp, err := l.UpdateStudent(&req)
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}
