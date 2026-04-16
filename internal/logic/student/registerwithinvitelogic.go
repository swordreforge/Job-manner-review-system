package student

import (
	"context"
	"time"

	"career-api/internal/model"
	"career-api/internal/pkg"
	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type RegisterWithInviteLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewRegisterWithInviteLogic(ctx context.Context, svcCtx *svc.ServiceContext) *RegisterWithInviteLogic {
	return &RegisterWithInviteLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *RegisterWithInviteLogic) RegisterWithInvite(req *types.RegisterWithInviteReq) (*types.RegisterWithInviteResp, error) {
	db, err := l.svcCtx.DB.RawDB()
	if err != nil {
		logx.Errorf("get raw db failed: %v", err)
		return &types.RegisterWithInviteResp{
			Code: 500,
			Msg:  "database error",
		}, nil
	}

	var codeId, schoolId, teacherId int64
	var maxUses, usedCount int
	var status string
	var expiresAt int64

	err = db.QueryRowContext(l.ctx,
		"SELECT id, school_id, teacher_id, status, expires_at, max_uses, used_count FROM invite_codes WHERE code = ?",
		req.InviteCode).Scan(&codeId, &schoolId, &teacherId, &status, &expiresAt, &maxUses, &usedCount)

	if err != nil {
		return &types.RegisterWithInviteResp{
			Code: 400,
			Msg:  "invalid invite code",
		}, nil
	}

	if status != "active" {
		return &types.RegisterWithInviteResp{
			Code: 400,
			Msg:  "invite code is not active",
		}, nil
	}

	if expiresAt > 0 && expiresAt < time.Now().Unix() {
		return &types.RegisterWithInviteResp{
			Code: 400,
			Msg:  "invite code has expired",
		}, nil
	}

	if usedCount >= maxUses {
		return &types.RegisterWithInviteResp{
			Code: 400,
			Msg:  "invite code has reached max uses",
		}, nil
	}

	_, err = l.svcCtx.UserModel.FindOneByUsername(l.ctx, req.Username)
	if err == nil {
		return &types.RegisterWithInviteResp{
			Code: 400,
			Msg:  "username already exists",
		}, nil
	}

	hashedPassword, err := pkg.HashPassword(req.Password)
	if err != nil {
		return &types.RegisterWithInviteResp{
			Code: 500,
			Msg:  "failed to hash password",
		}, nil
	}

	now := time.Now().Unix()
	user := &model.Users{
		Username:  req.Username,
		Password:  hashedPassword,
		Email:     req.Email,
		Role:      "student",
		CreatedAt: now,
		UpdatedAt: now,
	}

	result, err := l.svcCtx.UserModel.Insert(l.ctx, user)
	if err != nil {
		return &types.RegisterWithInviteResp{
			Code: 500,
			Msg:  "failed to create user",
		}, nil
	}

	userId, err := result.LastInsertId()
	if err != nil {
		return &types.RegisterWithInviteResp{
			Code: 500,
			Msg:  "failed to get user id",
		}, nil
	}

	student := &model.Students{
		UserId:    userId,
		Name:      req.Name,
		CreatedAt: now,
		UpdatedAt: now,
	}

	studentResult, err := l.svcCtx.StudentModel.Insert(l.ctx, student)
	if err != nil {
		return &types.RegisterWithInviteResp{
			Code: 500,
			Msg:  "failed to create student profile",
		}, nil
	}

	studentId, err := studentResult.LastInsertId()
	if err != nil {
		return &types.RegisterWithInviteResp{
			Code: 500,
			Msg:  "failed to get student id",
		}, nil
	}

	_, err = db.ExecContext(l.ctx,
		"INSERT INTO student_schools (student_id, school_id, teacher_id, invite_code_id, status, joined_at, created_at, updated_at) VALUES (?, ?, ?, ?, 'active', ?, ?, ?)",
		studentId, schoolId, teacherId, codeId, now, now, now)
	if err != nil {
		return &types.RegisterWithInviteResp{
			Code: 500,
			Msg:  "failed to associate with school",
		}, nil
	}

	_, err = db.ExecContext(l.ctx,
		"UPDATE invite_codes SET used_count = used_count + 1 WHERE id = ?",
		codeId)
	if err != nil {
		l.Error("failed to increment invite code usage: %v", err)
	}

	token, err := pkg.GenerateToken(
		userId,
		req.Username,
		"student",
		l.svcCtx.Config.Auth.AccessSecret,
		l.svcCtx.Config.Auth.AccessExpire,
	)
	if err != nil {
		return &types.RegisterWithInviteResp{
			Code: 500,
			Msg:  "failed to generate token",
		}, nil
	}

	return &types.RegisterWithInviteResp{
		Code: 0,
		Msg:  "success",
		Data: &types.RegisterWithInviteData{
			UserId:    userId,
			Username:  req.Username,
			StudentId: studentId,
			SchoolId:  schoolId,
			Token:     token,
		},
	}, nil
}
