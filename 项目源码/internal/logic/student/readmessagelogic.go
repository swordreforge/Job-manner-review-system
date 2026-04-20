package student

import (
	"context"
	"errors"
	"time"

	"career-api/internal/svc"
	"career-api/internal/types"
	"github.com/zeromicro/go-zero/core/logx"
)

type ReadMessageLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewReadMessageLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ReadMessageLogic {
	return &ReadMessageLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ReadMessageLogic) MarkAsRead(req *types.ReadMessageReq) error {
	// 从JWT token中获取student ID
	userId, ok := l.ctx.Value("userId").(int64)
	if !ok {
		return errors.New("failed to get userId from context")
	}

	now := time.Now().Unix()

	db, err := l.svcCtx.DB.RawDB()
	if err != nil {
		return err
	}

	_, err = db.ExecContext(l.ctx,
		"UPDATE messages SET status = 'read', read_at = ? WHERE id = ? AND receiver_id = ?",
		now, req.Id, userId)
	return err
}
