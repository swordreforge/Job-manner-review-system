package teacher

import (
	"context"

	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListAlertsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewListAlertsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListAlertsLogic {
	return &ListAlertsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ListAlertsLogic) ListAlerts(req *types.TeacherListAlertsReq) (*types.TeacherListAlertsResp, error) {
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
		return &types.TeacherListAlertsResp{}, err
	}

	query := `SELECT ar.id, ar.student_id, s.name, ar.school_id, ar.alert_type, ar.alert_level,
                    ar.description, ar.completion_rate, ar.total_tasks, ar.completed_tasks,
                    ar.status, ar.created_at, ar.updated_at
             FROM alert_records ar
             JOIN students s ON ar.student_id = s.id
             WHERE ar.school_id = ? AND ar.teacher_id = ?`

	args := []interface{}{schoolId, teacherId}

	if req.AlertType != "" {
		query += " AND ar.alert_type = ?"
		args = append(args, req.AlertType)
	}
	if req.AlertLevel != "" {
		query += " AND ar.alert_level = ?"
		args = append(args, req.AlertLevel)
	}

	page, pageSize := 1, 10
	if req.Page > 0 {
		page = req.Page
	}
	if req.PageSize > 0 {
		pageSize = req.PageSize
	}
	query += " ORDER BY ar.created_at DESC LIMIT ? OFFSET ?"
	args = append(args, pageSize, (page-1)*pageSize)

	rows, err := db.QueryContext(l.ctx, query, args...)
	if err != nil {
		logx.Errorf("query alerts failed: %v", err)
		return &types.TeacherListAlertsResp{}, err
	}
	defer rows.Close()

	var list []types.TeacherAlertInfo
	for rows.Next() {
		var info types.TeacherAlertInfo
		if err := rows.Scan(&info.Id, &info.StudentId, &info.StudentName, &info.SchoolId,
			&info.AlertType, &info.AlertLevel, &info.Description,
			&info.CompletionRate, &info.TotalTasks, &info.CompletedTasks,
			&info.Status, &info.CreatedAt, &info.UpdatedAt); err != nil {
			logx.Errorf("scan alert failed: %v", err)
			continue
		}
		list = append(list, info)
	}
	_ = rows.Err()

	var total int
	err = db.QueryRowContext(l.ctx,
		"SELECT COUNT(*) FROM alert_records WHERE school_id = ? AND teacher_id = ?",
		schoolId, teacherId).Scan(&total)
	if err != nil {
		logx.Errorf("count alerts failed: %v", err)
	}

	return &types.TeacherListAlertsResp{Total: total, List: list}, nil
}
