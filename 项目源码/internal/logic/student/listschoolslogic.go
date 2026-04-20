package student

import (
	"context"

	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListSchoolsLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewListSchoolsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListSchoolsLogic {
	return &ListSchoolsLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *ListSchoolsLogic) ListSchools() (*types.ListStudentSchoolsResp, error) {
	db, err := l.svcCtx.DB.RawDB()
	if err != nil {
		logx.Errorf("get raw db failed: %v", err)
		return &types.ListStudentSchoolsResp{
			Code: 500,
			Msg:  "database error",
		}, nil
	}

	userId, ok := l.ctx.Value("userId").(int64)
	if !ok || userId == 0 {
		return &types.ListStudentSchoolsResp{
			Code: 401,
			Msg:  "not logged in",
		}, nil
	}

	student, err := l.svcCtx.StudentModel.FindOneByUserId(l.ctx, userId)
	if err != nil {
		return &types.ListStudentSchoolsResp{
			Code: 400,
			Msg:  "student profile not found",
		}, nil
	}

	rows, err := db.QueryContext(l.ctx,
		`SELECT ss.school_id, COALESCE(s.name, '未知学校'), ss.status, ss.joined_at 
		 FROM student_schools ss 
		 LEFT JOIN schools s ON ss.school_id = s.id 
		 WHERE ss.student_id = ? 
		 ORDER BY ss.joined_at DESC`,
		student.Id)
	if err != nil {
		logx.Errorf("query student schools failed: %v", err)
		return &types.ListStudentSchoolsResp{
			Code: 500,
			Msg:  "failed to query schools",
		}, nil
	}
	defer rows.Close()

	var list []types.StudentSchoolInfo
	for rows.Next() {
		var info types.StudentSchoolInfo
		if err := rows.Scan(&info.SchoolId, &info.SchoolName, &info.Status, &info.JoinedAt); err != nil {
			logx.Errorf("scan student school failed: %v", err)
			continue
		}
		list = append(list, info)
	}

	logx.Infof("ListSchools: studentId=%d, total=%d, list=%v", student.Id, len(list), list)

	// Ensure list is never nil
	if list == nil {
		list = []types.StudentSchoolInfo{}
	}

	return &types.ListStudentSchoolsResp{
		Code: 0,
		Msg:  "success",
		Data: &types.ListStudentSchoolsData{
			Total: len(list),
			List:  list,
		},
	}, nil
}
