package chat

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	apperrors "career-api/common/errors"
	"career-api/internal/logic/chat"
	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/rest/httpx"
)

func writeChatResponse(w http.ResponseWriter, code int, msg string, data interface{}) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	resp := map[string]interface{}{"code": code, "msg": msg}
	if data != nil {
		resp["data"] = data
	}
	_ = json.NewEncoder(w).Encode(resp)
}

func writeChatError(w http.ResponseWriter, err error) {
	if codeErr, ok := err.(*apperrors.CodeError); ok {
		writeChatResponse(w, codeErr.Code, codeErr.Msg, nil)
		return
	}
	writeChatResponse(w, apperrors.CodeInternalError, err.Error(), nil)
}

func parseGroupID(path string) int64 {
	parts := strings.Split(strings.Trim(path, "/"), "/")
	for i, part := range parts {
		if part == "groups" && i+1 < len(parts) {
			if groupID, err := strconv.ParseInt(parts[i+1], 10, 64); err == nil {
				return groupID
			}
		}
	}
	return 0
}

func CreateGroupHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.CreateGroupReq
		if err := httpx.Parse(r, &req); err != nil {
			writeChatError(w, err)
			return
		}

		l := chat.NewCreateGroupLogic(r.Context(), svcCtx)
		resp, err := l.CreateGroup(&req)
		if err != nil {
			writeChatError(w, err)
		} else {
			writeChatResponse(w, apperrors.CodeSuccess, "success", resp)
		}
	}
}

func ListGroupsHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		l := chat.NewListGroupsLogic(r.Context(), svcCtx)
		resp, err := l.ListGroups()
		if err != nil {
			writeChatError(w, err)
		} else {
			writeChatResponse(w, apperrors.CodeSuccess, "success", resp)
		}
	}
}

func SendMessageHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.SendChatMessageReq
		if err := httpx.Parse(r, &req); err != nil {
			writeChatError(w, err)
			return
		}

		groupID := parseGroupID(r.URL.Path)
		if groupID == 0 {
			writeChatResponse(w, apperrors.CodeInvalidParams, "invalid group id", nil)
			return
		}

		l := chat.NewSendMessageLogic(r.Context(), svcCtx)
		resp, err := l.SendMessage(groupID, &req)
		if err != nil {
			writeChatError(w, err)
		} else {
			writeChatResponse(w, apperrors.CodeSuccess, "success", resp)
		}
	}
}

func ListMessagesHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		groupID := parseGroupID(r.URL.Path)
		if groupID == 0 {
			writeChatResponse(w, apperrors.CodeInvalidParams, "invalid group id", nil)
			return
		}

		l := chat.NewListMessagesLogic(r.Context(), svcCtx)
		resp, err := l.ListMessages(groupID)
		if err != nil {
			writeChatError(w, err)
		} else {
			writeChatResponse(w, apperrors.CodeSuccess, "success", resp)
		}
	}
}

func ListMembersHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		groupID := parseGroupID(r.URL.Path)
		if groupID == 0 {
			writeChatResponse(w, apperrors.CodeInvalidParams, "invalid group id", nil)
			return
		}

		l := chat.NewListMembersLogic(r.Context(), svcCtx)
		resp, err := l.ListMembers(groupID)
		if err != nil {
			writeChatError(w, err)
		} else {
			writeChatResponse(w, apperrors.CodeSuccess, "success", resp)
		}
	}
}

func MarkReadHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		groupID := parseGroupID(r.URL.Path)
		if groupID == 0 {
			writeChatResponse(w, apperrors.CodeInvalidParams, "invalid group id", nil)
			return
		}

		l := chat.NewMarkReadLogic(r.Context(), svcCtx)
		if err := l.MarkRead(groupID); err != nil {
			writeChatError(w, err)
		} else {
			writeChatResponse(w, apperrors.CodeSuccess, "success", map[string]interface{}{"groupId": groupID, "readAt": time.Now().Unix()})
		}
	}
}

func StreamHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		groupID := parseGroupID(r.URL.Path)
		if groupID == 0 {
			writeChatResponse(w, apperrors.CodeInvalidParams, "invalid group id", nil)
			return
		}

		l := chat.NewStreamLogic(r.Context(), svcCtx)
		if err := l.Stream(w, groupID); err != nil {
			writeChatError(w, err)
		}
	}
}
