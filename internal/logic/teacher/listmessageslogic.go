package teacher

import (
	"context"

	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListMessagesLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewListMessagesLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListMessagesLogic {
	return &ListMessagesLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ListMessagesLogic) ListMessages() (*types.ListMessagesResp, error) {
	senderId := l.getCurrentTeacherId()

	db, err := l.svcCtx.DB.RawDB()
	if err != nil {
		return nil, err
	}

	rows, err := db.QueryContext(l.ctx,
		`SELECT id, sender_id, sender_name, receiver_id, receiver_name, title, content, is_read, created_at, read_at
         FROM messages WHERE sender_id = ? ORDER BY created_at DESC`,
		senderId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []types.MessageInfo
	for rows.Next() {
		var m types.MessageInfo
		rows.Scan(&m.Id, &m.SenderId, &m.SenderName, &m.ReceiverId, &m.ReceiverName,
			&m.Title, &m.Content, &m.IsRead, &m.CreatedAt, &m.ReadAt)
		list = append(list, m)
	}

	return &types.ListMessagesResp{Total: len(list), List: list}, nil
}

func (l *ListMessagesLogic) getCurrentTeacherId() int64 { return 1 }
