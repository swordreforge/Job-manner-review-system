package teacher

import (
	"context"
	"time"

	"career-api/internal/pkg"
	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type TeacherRegisterLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewTeacherRegisterLogic(ctx context.Context, svcCtx *svc.ServiceContext) *TeacherRegisterLogic {
	return &TeacherRegisterLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *TeacherRegisterLogic) TeacherRegister(req *types.TeacherRegisterReq) (*types.TeacherRegisterResp, error) {
	db, err := l.svcCtx.DB.RawDB()
	if err != nil {
		logx.Errorf("get raw db failed: %v", err)
		return &types.TeacherRegisterResp{
			Code: 500,
			Msg:  "database error",
		}, nil
	}

	var schoolId int64
	err = db.QueryRowContext(l.ctx, "SELECT id FROM schools WHERE code = ? AND status = 'active'", req.SchoolCode).Scan(&schoolId)
	if err != nil {
		logx.Errorf("school not found: %v", err)
		return &types.TeacherRegisterResp{
			Code: 400,
			Msg:  "学校代码无效或学校未激活",
		}, nil
	}

	var exists bool
	err = db.QueryRowContext(l.ctx, "SELECT EXISTS(SELECT 1 FROM users WHERE username = ?)", req.Username).Scan(&exists)
	if err != nil {
		logx.Errorf("check username failed: %v", err)
		return &types.TeacherRegisterResp{
			Code: 500,
			Msg:  "database error",
		}, nil
	}
	if exists {
		return &types.TeacherRegisterResp{
			Code: 400,
			Msg:  "用户名已存在",
		}, nil
	}

	hashedPassword, err := pkg.HashPassword(req.Password)
	if err != nil {
		logx.Errorf("hash password failed: %v", err)
		return &types.TeacherRegisterResp{
			Code: 500,
			Msg:  "密码加密失败",
		}, nil
	}

	now := time.Now().Unix()
	var userId int64
	_, err = db.ExecContext(l.ctx,
		`INSERT INTO users (username, password, email, phone, role, school_id, created_at, updated_at)
		 VALUES (?, ?, ?, ?, 'teacher', ?, ?, ?)`,
		req.Username, hashedPassword, req.Email, req.Phone, schoolId, now, now)
	if err != nil {
		logx.Errorf("insert user failed: %v", err)
		return &types.TeacherRegisterResp{
			Code: 500,
			Msg:  "创建用户失败",
		}, nil
	}

	err = db.QueryRowContext(l.ctx, "SELECT LAST_INSERT_ID()").Scan(&userId)
	if err != nil {
		logx.Errorf("get user id failed: %v", err)
		return &types.TeacherRegisterResp{
			Code: 500,
			Msg:  "获取用户ID失败",
		}, nil
	}

	_, err = db.ExecContext(l.ctx,
		`INSERT INTO teachers (user_id, school_id, name, employee_id, department, phone, status, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
		userId, schoolId, req.Name, req.EmployeeId, req.Department, req.Phone, now, now)
	if err != nil {
		logx.Errorf("insert teacher failed: %v", err)
		db.ExecContext(l.ctx, "DELETE FROM users WHERE id = ?", userId)
		return &types.TeacherRegisterResp{
			Code: 500,
			Msg:  "创建教师记录失败",
		}, nil
	}

	tokenString, err := pkg.GenerateToken(
		userId,
		req.Username,
		"teacher",
		l.svcCtx.Config.Auth.AccessSecret,
		l.svcCtx.Config.Auth.AccessExpire,
	)
	if err != nil {
		logx.Errorf("generate token failed: %v", err)
		return &types.TeacherRegisterResp{
			Code: 500,
			Msg:  "生成令牌失败",
		}, nil
	}

	logx.Infof("Teacher registered: %s (userId: %d, schoolId: %d)", req.Username, userId, schoolId)

	return &types.TeacherRegisterResp{
		Code:     0,
		Msg:      "success",
		Token:    tokenString,
		UserId:   userId,
		SchoolId: schoolId,
	}, nil
}
