package student

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
	userId, ok := l.ctx.Value("userId").(int64)
	if !ok {
		return errors.New("failed to get userId from context")
	}

	db, err := l.svcCtx.DB.RawDB()
	if err != nil {
		return err
	}

	// Verify the receiver is a teacher at the student's school
	var schoolId int64
	err = db.QueryRowContext(l.ctx,
		"SELECT school_id FROM student_schools WHERE student_id = ? AND status = 'active' ORDER BY joined_at DESC LIMIT 1",
		userId).Scan(&schoolId)
	if err != nil {
		return errors.New("student school not found")
	}

	var exists int64
	err = db.QueryRowContext(l.ctx,
		"SELECT COUNT(*) FROM teachers WHERE user_id = ? AND school_id = ?",
		req.ReceiverId, schoolId).Scan(&exists)
	if err != nil || exists == 0 {
		return errors.New("receiver is not a valid teacher at your school")
	}

	now := time.Now().Unix()

	_, err = db.ExecContext(l.ctx,
		`INSERT INTO messages (sender_id, sender_type, receiver_id, receiver_type, title, content, message_type, status, created_at)
		 VALUES (?, 'student', ?, 'teacher', ?, ?, 'note', 'unread', ?)`,
		userId, req.ReceiverId, req.Title, req.Content, now)

	return err
}