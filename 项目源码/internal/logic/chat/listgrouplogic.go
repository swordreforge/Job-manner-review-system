package chat

import (
	"context"
	"database/sql"

	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListGroupsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewListGroupsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListGroupsLogic {
	return &ListGroupsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ListGroupsLogic) ListGroups() ([]types.ChatGroup, error) {
	user, err := resolveCurrentUser(l.ctx)
	if err != nil {
		return nil, err
	}

	db, err := l.svcCtx.DB.RawDB()
	if err != nil {
		logx.Errorf("get db failed: %v", err)
		return nil, err
	}

	var groups []types.ChatGroup
	query := `
		SELECT g.id, g.school_id, g.name, g.chat_type, g.created_by, g.created_at, g.updated_at,
		       COALESCE((SELECT cm.content FROM chat_messages cm WHERE cm.group_id = g.id ORDER BY cm.created_at DESC, cm.id DESC LIMIT 1), '') AS last_message,
		       COALESCE((SELECT COUNT(1)
		                FROM chat_messages cm
		                WHERE cm.group_id = g.id
		                  AND cm.sender_id <> ?
		                  AND cm.created_at > COALESCE(m.last_read_at, 0)), 0) AS unread_count
		FROM chat_groups g
		INNER JOIN chat_group_members m ON g.id = m.group_id
		WHERE m.user_id = ? AND m.user_type = ?
		ORDER BY g.updated_at DESC
	`
	rows, err := db.QueryContext(l.ctx, query, user.id, user.id, normalizeUserType(user.role))
	if err != nil {
		logx.Errorf("query groups failed: %v", err)
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var g types.ChatGroup
		var lastMessage sql.NullString
		var unreadCount int64
		if err := rows.Scan(&g.Id, &g.SchoolId, &g.Name, &g.ChatType, &g.CreatedBy, &g.CreatedAt, &g.UpdatedAt, &lastMessage, &unreadCount); err != nil {
			continue
		}
		if lastMessage.Valid {
			g.LastMessage = lastMessage.String
		}
		g.UnreadCount = unreadCount
		groups = append(groups, g)
	}

	return groups, nil
}
