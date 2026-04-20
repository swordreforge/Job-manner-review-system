// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package student

import (
	"net/http"

	"career-api/internal/logic/student"
	"career-api/internal/svc"
	"github.com/zeromicro/go-zero/rest/httpx"
)

// Get student profile by id
func GetStudentHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		l := student.NewGetStudentLogic(r.Context(), svcCtx)
		resp, err := l.GetStudent()
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}
