package teacher

import (
	"context"
	"errors"
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
	// 从JWT token中获取teacher ID
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
		`INSERT INTO messages (sender_id, sender_type, receiver_id, receiver_type, title, content, message_type, status, created_at)
         VALUES (?, 'teacher', ?, 'student', ?, ?, 'note', 'unread', ?)`,
		userId, req.ReceiverId, req.Title, req.Content, now)

	return err
}

func (l *SendMessageLogic) getTeacherName(userId int64) string {
	// 从数据库查询teacher名称
	db, err := l.svcCtx.DB.RawDB()
	if err != nil {
		logx.Errorf("failed to get database connection: %v", err)
		return "Teacher"
	}

	var name string
	err = db.QueryRowContext(l.ctx, "SELECT name FROM teachers WHERE user_id = ?", userId).Scan(&name)
	if err != nil {
		logx.Errorf("failed to get teacher name: %v", err)
		return "Teacher"
	}

	return name
}
