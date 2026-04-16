package student

import (
	"net/http"

	"career-api/internal/logic/student"
	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/rest/httpx"
)

func ListSchoolsHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		l := student.NewListSchoolsLogic(r.Context(), svcCtx)
		resp, err := l.ListSchools()
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		// Return directly
		if resp.Data == nil {
			resp.Data = &types.ListStudentSchoolsData{
				Total: 0,
				List:  []types.StudentSchoolInfo{},
			}
		}
		httpx.OkJsonCtx(r.Context(), w, resp)
	}
}
