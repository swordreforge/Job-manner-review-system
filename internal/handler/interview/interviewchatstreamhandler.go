package interview

import (
	"errors"
	"net/http"
	"strconv"

	"career-api/internal/logic/interview"
	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/rest/httpx"
)

// InterviewChatStreamHandler handles the interview chat stream request
func InterviewChatStreamHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.InterviewChatStreamReq
		
		// 支持GET请求（EventSource只支持GET）
		if r.Method == http.MethodGet {
			// 从URL查询参数中获取sessionId和message
			sessionIdStr := r.URL.Query().Get("sessionId")
			message := r.URL.Query().Get("message")
			
			if sessionIdStr == "" || message == "" {
				httpx.ErrorCtx(r.Context(), w, 
					errors.New("sessionId and message are required"))
				return
			}
			
			sessionId, err := strconv.ParseInt(sessionIdStr, 10, 64)
			if err != nil {
				httpx.ErrorCtx(r.Context(), w, 
					errors.New("invalid sessionId: must be a number"))
				return
			}
			
			req.SessionId = sessionId
			req.Message = message
		} else {
			// POST请求，使用JSON格式
			if err := httpx.Parse(r, &req); err != nil {
				httpx.ErrorCtx(r.Context(), w, err)
				return
			}
		}

		l := interview.NewInterviewChatStreamLogic(r.Context(), svcCtx)
		l.InterviewChatStream(w, &req)
	}
}