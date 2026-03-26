// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package user

import (
	"context"
	"database/sql"
	"time"

	"github.com/zeromicro/go-zero/core/logx"

	"career-api/common/errors"
	"career-api/internal/model"
	"career-api/internal/pkg"
	"career-api/internal/svc"
	"career-api/internal/types"
)

type RegisterLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// User registration
func NewRegisterLogic(ctx context.Context, svcCtx *svc.ServiceContext) *RegisterLogic {
	return &RegisterLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *RegisterLogic) Register(req *types.RegisterReq) (resp *types.UserResp, err error) {
	logx.Infof("Register called with username: %s", req.Username)

	if req.Username == "" || req.Password == "" {
		return &types.UserResp{
			Code: errors.CodeInvalidParams,
			Msg:  "username and password are required",
		}, nil
	}

	if req.Email == "" {
		return &types.UserResp{
			Code: errors.CodeInvalidParams,
			Msg:  "email is required",
		}, nil
	}

	// 检查用户名是否已存在
	_, err = l.svcCtx.UserModel.FindOneByUsername(l.ctx, req.Username)
	if err == nil {
		return &types.UserResp{
			Code: errors.CodeInvalidParams,
			Msg:  "username already exists",
		}, nil
	}

	// 检查邮箱是否已存在
	_, err = l.svcCtx.UserModel.FindOneByEmail(l.ctx, req.Email)
	if err == nil {
		return &types.UserResp{
			Code: errors.CodeInvalidParams,
			Msg:  "email already exists",
		}, nil
	}

	// 加密密码
	hashedPassword, err := pkg.HashPassword(req.Password)
	if err != nil {
		logx.Errorf("HashPassword failed: %v", err)
		return &types.UserResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to hash password",
		}, nil
	}

	// 创建用户
	now := time.Now().Unix()
	user := &model.Users{
		Username:  req.Username,
		Password:  hashedPassword,
		Email:     req.Email,
		Phone:     sql.NullString{String: req.Phone, Valid: req.Phone != ""},
		Role:      "user",
		CreatedAt: now,
		UpdatedAt: now,
	}

	result, err := l.svcCtx.UserModel.InsertWithTimestamp(l.ctx, user)
	if err != nil {
		logx.Errorf("Insert user failed: %v", err)
		return &types.UserResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to create user",
		}, nil
	}

	userId, err := result.LastInsertId()
	if err != nil {
		logx.Errorf("Get last insert id failed: %v", err)
		return &types.UserResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to get user id",
		}, nil
	}

	logx.Infof("User registered: %s (id: %d)", req.Username, userId)

	return &types.UserResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
		Data: &types.UserInfo{
			Id:        userId,
			Username:  req.Username,
			Email:     req.Email,
			Phone:     req.Phone,
			Role:      "user",
			CreatedAt: now,
		},
	}, nil
}
