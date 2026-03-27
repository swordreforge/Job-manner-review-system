package logic

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/zeromicro/go-zero/core/logx"

	"career-api/common/errors"
	"career-api/internal/svc"
	"career-api/internal/types"
)

type StartInterviewLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewStartInterviewLogic(ctx context.Context, svcCtx *svc.ServiceContext) *StartInterviewLogic {
	return &StartInterviewLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *StartInterviewLogic) StartInterview(req *types.StartInterviewReq) (*types.InterviewResp, error) {
	userId, ok := l.ctx.Value("userId").(int64)
	if !ok {
		return &types.InterviewResp{
			Code: errors.CodeUnauthorized,
			Msg:  "unauthorized",
		}, nil
	}

	// 验证Mode字段
	if req.Mode == "" {
		return &types.InterviewResp{
			Code: 400,
			Msg:  "mode is required",
		}, nil
	}

	if req.Mode != "bigtech" && req.Mode != "gov" {
		return &types.InterviewResp{
			Code: 400,
			Msg:  "mode must be either 'bigtech' or 'gov'",
		}, nil
	}

	sessionId := time.Now().UnixNano()

	session := &types.InterviewSession{
		Id:        sessionId,
		Mode:      req.Mode,
		Status:    "running",
		CreatedAt: time.Now().Unix(),
	}

	logx.WithContext(l.ctx).Infow("Interview session started",
		logx.Field("userId", userId),
		logx.Field("sessionId", sessionId),
		logx.Field("mode", req.Mode),
	)

	return &types.InterviewResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
		Data: session,
	}, nil
}

type InterviewChatStreamLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewInterviewChatStreamLogic(ctx context.Context, svcCtx *svc.ServiceContext) *InterviewChatStreamLogic {
	return &InterviewChatStreamLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *InterviewChatStreamLogic) InterviewChatStream(w http.ResponseWriter, req *types.InterviewChatStreamReq) {
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "SSE not supported", http.StatusInternalServerError)
		return
	}

	userId, ok := l.ctx.Value("userId").(int64)
	if !ok {
		l.sendSSEEvent(w, flusher, "error", map[string]interface{}{
			"code": errors.CodeUnauthorized,
			"msg":  "unauthorized",
		})
		return
	}

	logx.WithContext(l.ctx).Infow("Interview chat stream started",
		logx.Field("userId", userId),
		logx.Field("message", req.Message),
	)

	l.sendSSEEvent(w, flusher, "question", map[string]interface{}{
		"content": "请介绍一下你的项目经验",
	})

	time.Sleep(1 * time.Second)

	l.sendSSEEvent(w, flusher, "score", map[string]interface{}{
		"value": 85,
	})

	time.Sleep(500 * time.Millisecond)

	l.sendSSEEvent(w, flusher, "feedback", map[string]interface{}{
		"content": "回答思路清晰，但缺少量化数据",
	})

	time.Sleep(500 * time.Millisecond)

	l.sendSSEEvent(w, flusher, "question", map[string]interface{}{
		"content": "你遇到过什么技术难题？如何解决的？",
	})

	time.Sleep(1 * time.Second)

	l.sendSSEEvent(w, flusher, "score", map[string]interface{}{
		"value": 78,
	})

	time.Sleep(500 * time.Millisecond)

	l.sendSSEEvent(w, flusher, "feedback", map[string]interface{}{
		"content": "解决方案合理，可以进一步优化",
	})

	l.sendSSEEvent(w, flusher, "done", map[string]interface{}{
		"message": "面试结束",
	})
}

func (l *InterviewChatStreamLogic) sendSSEEvent(w http.ResponseWriter, flusher http.Flusher, eventType string, data interface{}) {
	jsonData, _ := json.Marshal(data)
	fmt.Fprintf(w, "event: %s\n", eventType)
	fmt.Fprintf(w, "data: %s\n\n", jsonData)
	flusher.Flush()
}

type GetInterviewHistoryLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetInterviewHistoryLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetInterviewHistoryLogic {
	return &GetInterviewHistoryLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetInterviewHistoryLogic) GetInterviewHistory() (*types.InterviewHistoryListResp, error) {
	userId, ok := l.ctx.Value("userId").(int64)
	if !ok {
		return &types.InterviewHistoryListResp{
			Code: errors.CodeUnauthorized,
			Msg:  "unauthorized",
		}, nil
	}

	logx.WithContext(l.ctx).Infow("Get interview history",
		logx.Field("userId", userId),
	)

	history := []types.InterviewHistoryResp{
		{
			Id:        1,
			Mode:      "bigtech",
			Score:     85.5,
			Status:    "completed",
			CreatedAt: time.Now().Unix() - 86400,
		},
		{
			Id:        2,
			Mode:      "gov",
			Score:     78.0,
			Status:    "completed",
			CreatedAt: time.Now().Unix() - 172800,
		},
	}

	return &types.InterviewHistoryListResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
		Data: &types.InterviewHistoryResult{
			Total: 2,
			List:  history,
		},
	}, nil
}