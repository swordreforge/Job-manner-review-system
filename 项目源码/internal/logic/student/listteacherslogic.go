package student

import (
	"context"
	"errors"

	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListTeachersLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewListTeachersLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListTeachersLogic {
	return &ListTeachersLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ListTeachersLogic) ListTeachers() (*types.ListTeachersResp, error) {
	userId, ok := l.ctx.Value("userId").(int64)
	if !ok {
		return nil, errors.New("failed to get userId from context")
	}

	db, err := l.svcCtx.DB.RawDB()
	if err != nil {
		return nil, err
	}

	var schoolId int64
	err = db.QueryRowContext(l.ctx,
		"SELECT school_id FROM student_schools WHERE student_id = ? AND status = 'active' ORDER BY joined_at DESC LIMIT 1",
		userId).Scan(&schoolId)
	if err != nil {
		return nil, errors.New("student school not found")
	}

	rows, err := db.QueryContext(l.ctx,
		`SELECT t.user_id, t.name FROM teachers t WHERE t.school_id = ? AND t.status = 'active'`,
		schoolId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []types.TeacherInfo
	for rows.Next() {
		var t types.TeacherInfo
		if err := rows.Scan(&t.UserId, &t.Name); err != nil {
			logx.Errorf("failed to scan teacher row: %v", err)
			continue
		}
		list = append(list, t)
	}

	return &types.ListTeachersResp{List: list}, nil
}