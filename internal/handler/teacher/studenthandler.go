package handler

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/zeromicro/go-zero/rest/httpx"

	"career-api/internal/logic/teacher"
	"career-api/internal/svc"
	"career-api/internal/types"
)

func ListSchoolStudentsHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.TeacherListStudentsReq
		if err := httpx.Parse(r, &req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		l := teacher.NewListSchoolStudentsLogic(r.Context(), svcCtx)
		resp, err := l.ListSchoolStudents(&req)
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}

func GetStudentDetailHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		pathParts := strings.Split(r.URL.Path, "/")
		idStr := ""
		if len(pathParts) >= 4 {
			idStr = pathParts[3]
		}
		id, err := strconv.ParseInt(idStr, 10, 64)
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		l := teacher.NewGetStudentDetailLogic(r.Context(), svcCtx)
		resp, err := l.GetStudentDetail(&types.TeacherGetStudentReq{StudentId: id})
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}

func GetStudentTasksHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		pathParts := strings.Split(r.URL.Path, "/")
		idStr := ""
		if len(pathParts) >= 6 {
			idStr = pathParts[5]
		}
		id, err := strconv.ParseInt(idStr, 10, 64)
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		l := teacher.NewGetStudentTasksLogic(r.Context(), svcCtx)
		resp, err := l.GetStudentTasks(id)
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}

func ListAlertsHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.TeacherListAlertsReq
		if err := httpx.Parse(r, &req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		l := teacher.NewListAlertsLogic(r.Context(), svcCtx)
		resp, err := l.ListAlerts(&req)
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}

func ResolveAlertHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
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

		l := teacher.NewResolveAlertLogic(r.Context(), svcCtx)
		if err := l.ResolveAlert(id); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, map[string]interface{}{"code": 0, "msg": "resolved"})
		}
	}
}

func IgnoreAlertHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
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

		l := teacher.NewIgnoreAlertLogic(r.Context(), svcCtx)
		if err := l.IgnoreAlert(id); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, map[string]interface{}{"code": 0, "msg": "ignored"})
		}
	}
}

func CheckAlertHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
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

		l := teacher.NewCheckAlertLogic(r.Context(), svcCtx)
		if err := l.CheckStudentAlert(id); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, map[string]interface{}{"code": 0, "msg": "checked"})
		}
	}
}

func SendMessageHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.SendMessageReq
		if err := httpx.Parse(r, &req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		l := teacher.NewSendMessageLogic(r.Context(), svcCtx)
		if err := l.SendMessage(&req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, map[string]interface{}{"code": 0, "msg": "sent"})
		}
	}
}

func ListMessagesHandlerTeacher(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		l := teacher.NewListMessagesLogic(r.Context(), svcCtx)
		resp, err := l.ListMessages()
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}
