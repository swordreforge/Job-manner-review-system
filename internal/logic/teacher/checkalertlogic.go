package teacher

import (
	"context"
	"fmt"
	"time"

	"career-api/internal/svc"
	"github.com/zeromicro/go-zero/core/logx"
)

type CheckAlertLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewCheckAlertLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CheckAlertLogic {
	return &CheckAlertLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

const alertThreshold = 60.0

func (l *CheckAlertLogic) CheckStudentAlert(studentId int64) error {
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

	var rate float64
	err = db.QueryRowContext(l.ctx,
		"SELECT COALESCE(completeness_score, 0) FROM students WHERE id = ?", studentId).Scan(&rate)
	if err != nil {
		logx.Errorf("get student completion rate failed: %v", err)
		return err
	}

	if rate >= alertThreshold {
		return nil
	}

	var existingId int64
	err = db.QueryRowContext(l.ctx,
		"SELECT id FROM alert_records WHERE student_id = ? AND school_id = ? AND status = 'pending'",
		studentId, schoolId).Scan(&existingId)
	if err == nil {
		return nil
	}

	level := "low"
	if rate < 40 {
		level = "medium"
	}
	if rate < 20 {
		level = "high"
	}
	if rate < 10 {
		level = "critical"
	}

	now := time.Now().Unix()
	totalTasks := 8
	completedTasks := int(rate * 8 / 100)

	_, err = db.ExecContext(l.ctx,
		`INSERT INTO alert_records (student_id, school_id, teacher_id, alert_type, alert_level, description, 
		 completion_rate, total_tasks, completed_tasks, status, created_at, updated_at)
		 VALUES (?, ?, ?, 'low_completion', ?, ?, ?, ?, ?, 'pending', ?, ?)`,
		studentId, schoolId, teacherId, level,
		fmt.Sprintf("8系列任务完成度低于%.0f%%,当前完成度为%.2f%%", alertThreshold, rate),
		rate, totalTasks, completedTasks, now, now)
	if err != nil {
		logx.Errorf("create alert failed: %v", err)
		return err
	}

	return nil
}
