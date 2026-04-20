package teacher

import (
	"context"
	"errors"

	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

var ErrStudentNotInSchool = errors.New("student not in this school")

type GetStudentTasksLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetStudentTasksLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetStudentTasksLogic {
	return &GetStudentTasksLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetStudentTasksLogic) GetStudentTasks(studentId int64) (*types.TeacherGetStudentTasksResp, error) {
	schoolId := l.getCurrentSchoolId()

	db, err := l.svcCtx.DB.RawDB()
	if err != nil {
		logx.Errorf("get raw db failed: %v", err)
		return nil, err
	}

	var count int
	err = db.QueryRowContext(l.ctx,
		"SELECT COUNT(*) FROM student_schools WHERE student_id = ? AND school_id = ?",
		studentId, schoolId).Scan(&count)
	if err != nil {
		logx.Errorf("check student school failed: %v", err)
		return nil, err
	}
	if count == 0 {
		return nil, ErrStudentNotInSchool
	}

	rows, err := db.QueryContext(l.ctx,
		`SELECT task_series_id, task_name, task_type, status, completion_rate, score, started_at, completed_at
         FROM student_task_progress WHERE student_id = ? ORDER BY task_series_id`,
		studentId)
	if err != nil {
		logx.Errorf("query task progress failed: %v", err)
		return nil, err
	}
	defer rows.Close()

	var tasks []types.TeacherTaskProgress
	var totalRate float64
	completed := 0
	for rows.Next() {
		var t types.TeacherTaskProgress
		if err := rows.Scan(&t.TaskSeriesId, &t.TaskName, &t.TaskType, &t.Status,
			&t.CompletionRate, &t.Score, &t.StartedAt, &t.CompletedAt); err != nil {
			logx.Errorf("scan task progress failed: %v", err)
			continue
		}
		tasks = append(tasks, t)
		totalRate += t.CompletionRate
		if t.Status == "completed" {
			completed++
		}
	}

	var overallRate float64
	if len(tasks) > 0 {
		overallRate = totalRate / float64(len(tasks))
	}

	return &types.TeacherGetStudentTasksResp{
		StudentId:      studentId,
		TotalTasks:     8,
		CompletedTasks: completed,
		OverallRate:    overallRate,
		Tasks:          tasks,
	}, nil
}

func (l *GetStudentTasksLogic) getCurrentSchoolId() int64 {
	schoolId := int64(1)
	if v, ok := l.ctx.Value("schoolId").(int64); ok {
		schoolId = v
	}
	return schoolId
}
