package chat

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	apperrors "career-api/common/errors"
	"career-api/internal/svc"

	"github.com/zeromicro/go-zero/core/logx"
)

type StreamLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewStreamLogic(ctx context.Context, svcCtx *svc.ServiceContext) *StreamLogic {
	return &StreamLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *StreamLogic) Stream(w http.ResponseWriter, groupID int64) error {
	user, err := resolveCurrentUser(l.ctx)
	if err != nil {
		return err
	}

	db, err := rawDB(l.ctx, l.svcCtx)
	if err != nil {
		return err
	}

	if err := ensureGroupMember(l.ctx, db, groupID, user.id, normalizeUserType(user.role)); err != nil {
		return err
	}

	flusher, ok := w.(http.Flusher)
	if !ok {
		return &apperrors.CodeError{Code: apperrors.CodeInternalError, Msg: "sse not supported"}
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")

	messageCh, unsubscribe := defaultChatHub.Subscribe(groupID)
	defer unsubscribe()

	ticker := time.NewTicker(25 * time.Second)
	defer ticker.Stop()

	if _, err := fmt.Fprint(w, ": connected\n\n"); err == nil {
		flusher.Flush()
	}

	for {
		select {
		case <-l.ctx.Done():
			return nil
		case <-ticker.C:
			if _, err := fmt.Fprint(w, "data: {\"type\":\"ping\"}\n\n"); err != nil {
				return nil
			}
			flusher.Flush()
		case message, ok := <-messageCh:
			if !ok {
				return nil
			}
			payload, _ := json.Marshal(map[string]any{
				"type":    "message",
				"groupId": groupID,
				"data":    message,
			})
			if _, err := fmt.Fprintf(w, "data: %s\n\n", payload); err != nil {
				return nil
			}
			flusher.Flush()
		}
	}
}
