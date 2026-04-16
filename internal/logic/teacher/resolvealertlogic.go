package teacher

import (
	"context"
	"time"

	"career-api/internal/svc"
	"github.com/zeromicro/go-zero/core/logx"
)

type ResolveAlertLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewResolveAlertLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ResolveAlertLogic {
	return &ResolveAlertLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ResolveAlertLogic) ResolveAlert(alertId int64) error {
	teacherId := int64(1)
	schoolId := int64(1)

	if v, ok := l.ctx.Value("teacherId").(int64); ok {
		teacherId = v
	}
	if v, ok := l.ctx.Value("schoolId").(int64); ok {
		schoolId = v
	}

	db, err := l.svcCtx.DB.RawDB()
	if err != nil {
		logx.Errorf("get raw db failed: %v", err)
		return err
	}

	now := time.Now().Unix()
	_, err = db.ExecContext(l.ctx,
		"UPDATE alert_records SET status = 'resolved', updated_at = ? WHERE id = ? AND school_id = ? AND teacher_id = ?",
		now, alertId, schoolId, teacherId)
	if err != nil {
		logx.Errorf("resolve alert failed: %v", err)
		return err
	}

	return nil
}
