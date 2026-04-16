package student

import (
	"context"
	"time"

	"career-api/internal/svc"
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

func (l *ReadMessageLogic) MarkAsRead(messageId int64) error {
	receiverId := l.getCurrentStudentId()
	now := time.Now().Unix()

	db, err := l.svcCtx.DB.RawDB()
	if err != nil {
		return err
	}

	_, err = db.ExecContext(l.ctx,
		"UPDATE messages SET is_read = 1, read_at = ?, updated_at = ? WHERE id = ? AND receiver_id = ?",
		now, now, messageId, receiverId)
	return err
}

func (l *ReadMessageLogic) getCurrentStudentId() int64 { return 1 }
