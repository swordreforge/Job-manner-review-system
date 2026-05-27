package ai

import (
	"context"

	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListAIConversationsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewListAIConversationsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListAIConversationsLogic {
	return &ListAIConversationsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ListAIConversationsLogic) ListAIConversations() ([]*types.AIConversation, error) {
	user, err := resolveCurrentUser(l.ctx)
	if err != nil {
		return nil, err
	}

	db, err := getDB(l.ctx, l.svcCtx)
	if err != nil {
		return nil, err
	}

	rows, err := db.QueryContext(l.ctx, `
		SELECT g.id, g.school_id, g.name, g.chat_type, COALESCE(g.interview_session_id, 0), g.created_by, g.created_at, g.updated_at,
		       COALESCE((SELECT cm.content FROM chat_messages cm WHERE cm.group_id = g.id ORDER BY cm.created_at DESC, cm.id DESC LIMIT 1), '') AS last_message
		FROM chat_groups g
		JOIN chat_group_members m ON g.id = m.group_id
		WHERE m.user_id = ? AND m.user_type = ? AND g.chat_type IN ('ai_assistant', 'interview_review')
		ORDER BY g.updated_at DESC
	`, user.id, normalizeUserType(user.role))
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var conversations []*types.AIConversation
	for rows.Next() {
		var c types.AIConversation
		if err := rows.Scan(&c.Id, &c.SchoolId, &c.Name, &c.ChatType, &c.InterviewSessionId, &c.CreatedBy, &c.CreatedAt, &c.UpdatedAt, &c.LastMessage); err != nil {
			continue
		}
		if c.InterviewSessionId == 0 {
			c.InterviewSessionId = 0
		}
		conversations = append(conversations, &c)
	}

	return conversations, nil
}