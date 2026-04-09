package interview

import (
	"net/http"

	"career-api/internal/logic/interview"
	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/rest/httpx"
)

// InterviewChatStreamHandler handles the interview chat stream request (POST only for RESTful compliance)
func InterviewChatStreamHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.InterviewChatStreamReq
		
		// 只支持POST请求，符合RESTful规范
		if err := httpx.Parse(r, &req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		l := interview.NewInterviewChatStreamLogic(r.Context(), svcCtx)
		l.InterviewChatStream(w, &req)
	}
}