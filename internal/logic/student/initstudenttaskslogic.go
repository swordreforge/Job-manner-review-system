package student

import (
	"context"
	"time"

	"career-api/internal/svc"

	"github.com/zeromicro/go-zero/core/logx"
)

type InitStudentTasksLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewInitStudentTasksLogic(ctx context.Context, svcCtx *svc.ServiceContext) *InitStudentTasksLogic {
	return &InitStudentTasksLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

var taskDefinitions = []struct {
	SeriesID int
	Name     string
	Type     string
}{
	{1, "霍兰德职业倾向测试", "holland_test"},
	{2, "学生资料创建", "student_profile"},
	{3, "简历上传与解析", "resume_upload"},
	{4, "技能评估", "skill_assessment"},
	{5, "职业规划报告生成", "career_report"},
	{6, "模拟面试", "interview_simulation"},
	{7, "岗位匹配分析", "job_matching"},
	{8, "学习路径规划", "learning_path"},
}

func (l *InitStudentTasksLogic) InitStudentTasks(studentId, schoolId int64) error {
	db, err := l.svcCtx.DB.RawDB()
	if err != nil {
		logx.Errorf("get raw db failed: %v", err)
		return err
	}

	existingCount := 0
	err = db.QueryRowContext(l.ctx,
		"SELECT COUNT(*) FROM student_task_progress WHERE student_id = ?", studentId).Scan(&existingCount)
	if err != nil {
		logx.Errorf("check existing tasks failed: %v", err)
		return err
	}

	if existingCount >= 8 {
		logx.Infof("student %d already has 8 tasks initialized", studentId)
		return nil
	}

	now := time.Now().Unix()
	for _, task := range taskDefinitions {
		_, err = db.ExecContext(l.ctx,
			`INSERT INTO student_task_progress (student_id, school_id, task_series_id, task_name, task_type, status, completion_rate, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, 'not_started', 0.00, ?, ?)`,
			studentId, schoolId, task.SeriesID, task.Name, task.Type, now, now)
		if err != nil {
			logx.Errorf("insert task %d failed: %v", task.SeriesID, err)
			continue
		}
	}

	logx.Infof("initialized 8 tasks for student %d", studentId)
	return nil
}
