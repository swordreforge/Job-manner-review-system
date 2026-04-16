package teacher

import (
	"context"
	"time"

	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type SendMessageLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewSendMessageLogic(ctx context.Context, svcCtx *svc.ServiceContext) *SendMessageLogic {
	return &SendMessageLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *SendMessageLogic) SendMessage(req *types.SendMessageReq) error {
	senderId := l.getCurrentTeacherId()
	senderName := l.getTeacherName(senderId)
	now := time.Now().Unix()

	db, err := l.svcCtx.DB.RawDB()
	if err != nil {
		return err
	}

	_, err = db.ExecContext(l.ctx,
		`INSERT INTO messages (sender_id, sender_type, sender_name, receiver_id, receiver_type, title, content, is_read, created_at, updated_at)
         VALUES (?, 'teacher', ?, ?, 'student', ?, ?, ?, 0, ?, ?)`,
		senderId, senderName, req.ReceiverId, req.Title, req.Content, now, now)

	return err
}

func (l *SendMessageLogic) getCurrentTeacherId() int64     { return 1 }
func (l *SendMessageLogic) getTeacherName(id int64) string { return "Teacher" }
