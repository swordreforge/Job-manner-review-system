package ai

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	apperrors "career-api/common/errors"
	"career-api/internal/logic/ai"
	"career-api/internal/svc"
	"career-api/internal/types"
)

func writeAIResponse(w http.ResponseWriter, code int, msg string, data interface{}) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	resp := map[string]interface{}{"code": code, "msg": msg}
	if data != nil {
		resp["data"] = data
	}
	_ = json.NewEncoder(w).Encode(resp)
}

func writeAIError(w http.ResponseWriter, err error) {
	if codeErr, ok := err.(*apperrors.CodeError); ok {
		writeAIResponse(w, codeErr.Code, codeErr.Msg, nil)
		return
	}
	writeAIResponse(w, apperrors.CodeInternalError, err.Error(), nil)
}

func parseConversationID(path string) int64 {
	parts := strings.Split(strings.Trim(path, "/"), "/")
	for i, part := range parts {
		if part == "conversations" && i+1 < len(parts) {
			if id, err := strconv.ParseInt(parts[i+1], 10, 64); err == nil {
				return id
			}
		}
	}
	return 0
}

func parseJSONBody(r *http.Request, v interface{}) error {
	if r.Body == nil {
		return nil
	}
	defer r.Body.Close()
	return json.NewDecoder(r.Body).Decode(v)
}

func CreateAIConversationHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.CreateAIConversationReq
		if err := parseJSONBody(r, &req); err != nil {
			writeAIError(w, err)
			return
		}
		l := ai.NewCreateAIConversationLogic(r.Context(), svcCtx)
		resp, err := l.CreateAIConversation(&req)
		if err != nil {
			writeAIError(w, err)
		} else {
			writeAIResponse(w, apperrors.CodeSuccess, "success", resp)
		}
	}
}

func ListAIConversationsHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		l := ai.NewListAIConversationsLogic(r.Context(), svcCtx)
		resp, err := l.ListAIConversations()
		if err != nil {
			writeAIError(w, err)
		} else {
			writeAIResponse(w, apperrors.CodeSuccess, "success", resp)
		}
	}
}

func RenameAIConversationHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		conversationId := parseConversationID(r.URL.Path)
		if conversationId == 0 {
			writeAIResponse(w, apperrors.CodeInvalidParams, "invalid conversation id", nil)
			return
		}
		var req types.RenameAIConversationReq
		if err := parseJSONBody(r, &req); err != nil {
			writeAIError(w, err)
			return
		}
		l := ai.NewRenameAIConversationLogic(r.Context(), svcCtx)
		resp, err := l.RenameAIConversation(conversationId, &req)
		if err != nil {
			writeAIError(w, err)
		} else {
			writeAIResponse(w, apperrors.CodeSuccess, "success", resp)
		}
	}
}

func DeleteAIConversationHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		conversationId := parseConversationID(r.URL.Path)
		if conversationId == 0 {
			writeAIResponse(w, apperrors.CodeInvalidParams, "invalid conversation id", nil)
			return
		}
		l := ai.NewDeleteAIConversationLogic(r.Context(), svcCtx)
		if err := l.DeleteAIConversation(conversationId); err != nil {
			writeAIError(w, err)
		} else {
			writeAIResponse(w, apperrors.CodeSuccess, "deleted", nil)
		}
	}
}

func ListAIMessagesHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		conversationId := parseConversationID(r.URL.Path)
		if conversationId == 0 {
			writeAIResponse(w, apperrors.CodeInvalidParams, "invalid conversation id", nil)
			return
		}
		l := ai.NewListAIMessagesLogic(r.Context(), svcCtx)
		resp, err := l.ListAIMessages(conversationId)
		if err != nil {
			writeAIError(w, err)
		} else {
			writeAIResponse(w, apperrors.CodeSuccess, "success", resp)
		}
	}
}

func SendAIMessageHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		conversationId := parseConversationID(r.URL.Path)
		if conversationId == 0 {
			writeAIResponse(w, apperrors.CodeInvalidParams, "invalid conversation id", nil)
			return
		}
		var req types.SendAIMessageReq
		if err := parseJSONBody(r, &req); err != nil {
			writeAIError(w, err)
			return
		}
		l := ai.NewSendAIMessageLogic(r.Context(), svcCtx)
		l.SendMessage(w, conversationId, &req)
	}
}