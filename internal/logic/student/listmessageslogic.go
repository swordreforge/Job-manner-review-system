package student

import (
	"context"
	"errors"

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

func (l *ListMessagesLogic) ListMessages(req *types.ListMessagesReq) (*types.ListMessagesResp, error) {
	// 从JWT token中获取student ID
	userId, ok := l.ctx.Value("userId").(int64)
	if !ok {
		return nil, errors.New("failed to get userId from context")
	}

	// 设置默认分页参数
	if req.Page <= 0 {
		req.Page = 1
	}
	if req.PageSize <= 0 {
		req.PageSize = 20
	}

	db, err := l.svcCtx.DB.RawDB()
	if err != nil {
		return nil, err
	}

	// 查询总数
	var total int64
	countErr := db.QueryRowContext(l.ctx,
		`SELECT COUNT(*) FROM messages WHERE sender_id = ? OR receiver_id = ?`,
		userId, userId).Scan(&total)
	if countErr != nil {
		return nil, countErr
	}

	// 查询分页数据（查询所有发送和接收的消息），使用LEFT JOIN获取发送者和接收者名称
	offset := (req.Page - 1) * req.PageSize
	rows, err := db.QueryContext(l.ctx,
		`SELECT m.id, m.sender_id, COALESCE(st.name, '') as sender_name, m.receiver_id, COALESCE(rt.name, '') as receiver_name, m.title, m.content, m.status, m.created_at, m.read_at
         FROM messages m
         LEFT JOIN (
           SELECT user_id, name FROM teachers
           UNION
           SELECT user_id, name FROM students
         ) st ON m.sender_id = st.user_id
         LEFT JOIN (
           SELECT user_id, name FROM teachers
           UNION
           SELECT user_id, name FROM students
         ) rt ON m.receiver_id = rt.user_id
         WHERE m.sender_id = ? OR m.receiver_id = ?
         ORDER BY m.created_at DESC LIMIT ? OFFSET ?`,
		userId, userId, req.PageSize, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []types.MessageInfo
	for rows.Next() {
		var m types.MessageInfo
		var status string
		err := rows.Scan(&m.Id, &m.SenderId, &m.SenderName, &m.ReceiverId, &m.ReceiverName,
			&m.Title, &m.Content, &status, &m.CreatedAt, &m.ReadAt)
		if err != nil {
			logx.Errorf("failed to scan message row: %v", err)
			continue
		}
		// 将status字段映射到is_read
		m.IsRead = (status == "read")
		list = append(list, m)
	}

	return &types.ListMessagesResp{Total: int(total), List: list}, nil
}
