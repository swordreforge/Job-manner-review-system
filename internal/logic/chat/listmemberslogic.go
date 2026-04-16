package chat

import (
	"context"
	"database/sql"

	apperrors "career-api/common/errors"
	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListMembersLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewListMembersLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListMembersLogic {
	return &ListMembersLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ListMembersLogic) ListMembers(groupID int64) ([]types.ChatGroupMember, error) {
	user, err := resolveCurrentUser(l.ctx)
	if err != nil {
		return nil, err
	}

	db, err := rawDB(l.ctx, l.svcCtx)
	if err != nil {
		return nil, err
	}

	if err := ensureGroupMember(l.ctx, db, groupID, user.id, normalizeUserType(user.role)); err != nil {
		return nil, err
	}

	rows, err := db.QueryContext(l.ctx, `
		SELECT id, group_id, user_id, user_type, user_name, role, joined_at, last_read_at
		FROM chat_group_members
		WHERE group_id = ?
		ORDER BY joined_at ASC, id ASC
	`, groupID)
	if err != nil {
		logx.Errorf("query group members failed: %v", err)
		return nil, err
	}
	defer rows.Close()

	members := make([]types.ChatGroupMember, 0)
	for rows.Next() {
		var member types.ChatGroupMember
		var lastReadAt sql.NullInt64
		if err := rows.Scan(&member.Id, &member.GroupId, &member.UserId, &member.UserType, &member.UserName, &member.Role, &member.JoinedAt, &lastReadAt); err != nil {
			continue
		}
		if lastReadAt.Valid {
			member.LastReadAt = lastReadAt.Int64
		}
		members = append(members, member)
	}

	return members, nil
}

func ensureGroupMember(ctx context.Context, db *sql.DB, groupID, userID int64, userType string) error {
	var exists int64
	if err := db.QueryRowContext(ctx, `
		SELECT COUNT(1)
		FROM chat_group_members
		WHERE group_id = ? AND user_id = ? AND user_type = ?
	`, groupID, userID, userType).Scan(&exists); err != nil {
		return err
	}
	if exists == 0 {
		return &apperrors.CodeError{Code: apperrors.CodeForbidden, Msg: "forbidden"}
	}
	return nil
}
