package chat

import (
	"context"

	"career-api/internal/svc"

	"github.com/zeromicro/go-zero/core/logx"
)

type MarkReadLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewMarkReadLogic(ctx context.Context, svcCtx *svc.ServiceContext) *MarkReadLogic {
	return &MarkReadLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *MarkReadLogic) MarkRead(groupID int64) error {
	user, err := resolveCurrentUser(l.ctx)
	if err != nil {
		return err
	}

	db, err := rawDB(l.ctx, l.svcCtx)
	if err != nil {
		return err
	}

	if err := ensureGroupMember(l.ctx, db, groupID, user.id, normalizeUserType(user.role)); err != nil {
		return err
	}

	_, err = db.ExecContext(l.ctx, `
		UPDATE chat_group_members
		SET last_read_at = ?
		WHERE group_id = ? AND user_id = ? AND user_type = ?
	`, nowUnix(), groupID, user.id, normalizeUserType(user.role))
	if err != nil {
		logx.Errorf("mark chat read failed: %v", err)
	}
	return err
}
