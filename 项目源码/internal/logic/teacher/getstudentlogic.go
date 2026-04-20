package teacher

import (
	"context"
	"database/sql"

	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetStudentDetailLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetStudentDetailLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetStudentDetailLogic {
	return &GetStudentDetailLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetStudentDetailLogic) GetStudentDetail(req *types.TeacherGetStudentReq) (*types.TeacherStudentDetailResp, error) {
	schoolId := l.getCurrentSchoolId()

	db, err := l.svcCtx.DB.RawDB()
	if err != nil {
		logx.Errorf("get raw db failed: %v", err)
		return nil, err
	}

	query := `SELECT s.id, s.user_id, s.name, u.username, u.email, u.phone, ss.class_name, ss.grade,
                    ss.school_id, sh.name, COALESCE(s.completeness_score, 0), s.last_activity_at, ss.joined_at, ss.status
             FROM student_schools ss
             JOIN students s ON ss.student_id = s.id
             JOIN users u ON s.user_id = u.id
             JOIN schools sh ON ss.school_id = sh.id
             WHERE ss.student_id = ? AND ss.school_id = ?`

	var resp types.TeacherStudentDetailResp
	var phone, className, grade sql.NullString
	var lastActivityAt sql.NullInt64
	err = db.QueryRowContext(l.ctx, query, req.StudentId, schoolId).Scan(
		&resp.Id, &resp.UserId, &resp.Name, &resp.Username, &resp.Email, &phone,
		&className, &grade, &resp.SchoolId, &resp.SchoolName,
		&resp.TaskCompletionRate, &lastActivityAt, &resp.JoinedAt, &resp.Status)
	resp.Phone = phone.String
	resp.ClassName = className.String
	resp.Grade = grade.String
	resp.LastActivityAt = lastActivityAt.Int64

	if err != nil {
		logx.Errorf("get student detail failed: %v", err)
		return nil, err
	}

	return &resp, nil
}

func (l *GetStudentDetailLogic) getCurrentSchoolId() int64 {
	schoolId := int64(1)
	if v, ok := l.ctx.Value("schoolId").(int64); ok {
		schoolId = v
	}
	return schoolId
}
