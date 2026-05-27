package assistant

import (
	"net/http"

	"career-api/internal/logic/assistant"
	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/rest/httpx"
)

func AssistantChatStreamHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.AssistantChatStreamReq
		if err := httpx.Parse(r, &req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		l := assistant.NewAssistantChatStreamLogic(r.Context(), svcCtx)
		l.AssistantChatStream(w, &req)
	}
}