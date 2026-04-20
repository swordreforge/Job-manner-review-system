package student

import (
	"net/http"

	"career-api/internal/logic/student"
	"career-api/internal/svc"
	"career-api/internal/types"
	"github.com/zeromicro/go-zero/rest/httpx"
)

func SendMessageHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.SendMessageReq
		if err := httpx.Parse(r, &req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		l := student.NewSendMessageLogic(r.Context(), svcCtx)
		if err := l.SendMessage(&req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, map[string]interface{}{"code": 0, "msg": "sent"})
		}
	}
}

func ListTeachersHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		l := student.NewListTeachersLogic(r.Context(), svcCtx)
		resp, err := l.ListTeachers()
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}

func ListMessagesHandlerStudent(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.ListMessagesReq
		if err := httpx.Parse(r, &req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		l := student.NewListMessagesLogic(r.Context(), svcCtx)
		resp, err := l.ListMessages(&req)
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}

func ReadMessageHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.ReadMessageReq
		if err := httpx.Parse(r, &req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		l := student.NewReadMessageLogic(r.Context(), svcCtx)
		if err := l.MarkAsRead(&req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, map[string]interface{}{"code": 0, "msg": "read"})
		}
	}
}
