package teacher

import (
	"context"

	"career-api/internal/svc"

	"github.com/zeromicro/go-zero/core/logx"
)

type DeleteInviteCodeLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewDeleteInviteCodeLogic(ctx context.Context, svcCtx *svc.ServiceContext) *DeleteInviteCodeLogic {
	return &DeleteInviteCodeLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *DeleteInviteCodeLogic) DeleteInviteCode(id int64) error {
	schoolId := int64(1)

	if v, ok := l.ctx.Value("schoolId").(int64); ok && v > 0 {
		schoolId = v
	}

	db, err := l.svcCtx.DB.RawDB()
	if err != nil {
		logx.Errorf("get raw db failed: %v", err)
		return err
	}

	_, err = db.ExecContext(l.ctx,
		"DELETE FROM invite_codes WHERE id = ? AND school_id = ?",
		id, schoolId)
	if err != nil {
		logx.Errorf("delete invite code failed: %v", err)
		return err
	}

	return nil
}
