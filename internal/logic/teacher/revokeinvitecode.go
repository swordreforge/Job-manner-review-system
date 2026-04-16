package teacher

import (
	"context"
	"time"

	"career-api/internal/svc"

	"github.com/zeromicro/go-zero/core/logx"
)

type RevokeInviteCodeLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewRevokeInviteCodeLogic(ctx context.Context, svcCtx *svc.ServiceContext) *RevokeInviteCodeLogic {
	return &RevokeInviteCodeLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *RevokeInviteCodeLogic) RevokeInviteCode(id int64) error {
	schoolId := int64(1)
	teacherId := int64(1)

	if v, ok := l.ctx.Value("schoolId").(int64); ok {
		schoolId = v
	}
	if v, ok := l.ctx.Value("teacherId").(int64); ok {
		teacherId = v
	}

	db, err := l.svcCtx.DB.RawDB()
	if err != nil {
		logx.Errorf("get raw db failed: %v", err)
		return err
	}

	_, err = db.ExecContext(l.ctx,
		"UPDATE invite_codes SET status = 'revoked', updated_at = ? WHERE id = ? AND school_id = ? AND teacher_id = ?",
		time.Now().Unix(), id, schoolId, teacherId)
	if err != nil {
		logx.Errorf("revoke invite code failed: %v", err)
		return err
	}

	return nil
}
