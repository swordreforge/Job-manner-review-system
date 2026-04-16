package student

import (
	"net/http"
	"strconv"
	"strings"

	"career-api/internal/logic/student"
	"career-api/internal/svc"
	"github.com/zeromicro/go-zero/rest/httpx"
)

func ListMessagesHandlerStudent(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		l := student.NewListMessagesLogic(r.Context(), svcCtx)
		resp, err := l.ListMessages()
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}

func ReadMessageHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		pathParts := strings.Split(r.URL.Path, "/")
		idStr := ""
		if len(pathParts) >= 5 {
			idStr = pathParts[4]
		}
		id, err := strconv.ParseInt(idStr, 10, 64)
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		l := student.NewReadMessageLogic(r.Context(), svcCtx)
		if err := l.MarkAsRead(id); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, map[string]interface{}{"code": 0, "msg": "read"})
		}
	}
}
