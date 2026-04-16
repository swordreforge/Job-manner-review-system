package teacher

import (
	"context"
	"database/sql"

	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListSchoolStudentsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewListSchoolStudentsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListSchoolStudentsLogic {
	return &ListSchoolStudentsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ListSchoolStudentsLogic) ListSchoolStudents(req *types.TeacherListStudentsReq) (*types.TeacherListStudentsResp, error) {
	schoolId := int64(1)
	if v, ok := l.ctx.Value("schoolId").(int64); ok {
		schoolId = v
	}

	db, err := l.svcCtx.DB.RawDB()
	if err != nil {
		logx.Errorf("get raw db failed: %v", err)
		return &types.TeacherListStudentsResp{}, err
	}

	page := 1
	pageSize := 10
	if req.Page > 0 {
		page = req.Page
	}
	if req.PageSize > 0 {
		pageSize = req.PageSize
	}
	offset := (page - 1) * pageSize

	query := `SELECT ss.id, s.user_id, s.name, u.username, u.email, ss.class_name, ss.grade, 
                    s.task_completion_rate, s.last_activity_at, ss.joined_at, ss.status
             FROM student_schools ss
             JOIN students s ON ss.student_id = s.id
             JOIN users u ON s.user_id = u.id
             WHERE ss.school_id = ?`
	args := []interface{}{schoolId}

	if req.ClassName != "" {
		query += " AND ss.class_name = ?"
		args = append(args, req.ClassName)
	}
	if req.Grade != "" {
		query += " AND ss.grade = ?"
		args = append(args, req.Grade)
	}
	if req.Status != "" {
		query += " AND ss.status = ?"
		args = append(args, req.Status)
	}

	query += " ORDER BY ss.joined_at DESC LIMIT ? OFFSET ?"
	args = append(args, pageSize, offset)

	rows, err := db.QueryContext(l.ctx, query, args...)
	if err != nil {
		logx.Errorf("query students failed: %v", err)
		return &types.TeacherListStudentsResp{}, err
	}
	defer rows.Close()

	var list []types.TeacherStudentInfo
	for rows.Next() {
		var info types.TeacherStudentInfo
		var className, grade, email sql.NullString
		var lastActivityAt sql.NullInt64
		if err := rows.Scan(&info.Id, &info.UserId, &info.Name, &info.Username, &email,
			&className, &grade, &info.TaskCompletionRate, &lastActivityAt,
			&info.JoinedAt, &info.Status); err != nil {
			logx.Errorf("scan student failed: %v", err)
			continue
		}
		info.ClassName = className.String
		info.Grade = grade.String
		info.Email = email.String
		info.LastActivityAt = lastActivityAt.Int64
		list = append(list, info)
	}
	_ = rows.Err()

	if list == nil {
		list = []types.TeacherStudentInfo{}
	}

	countQuery := `SELECT COUNT(*) FROM student_schools WHERE school_id = ?`
	var total int
	err = db.QueryRowContext(l.ctx, countQuery, schoolId).Scan(&total)
	if err != nil {
		logx.Errorf("count students failed: %v", err)
	}

	return &types.TeacherListStudentsResp{
		Total: total,
		List:  list,
	}, nil
}
