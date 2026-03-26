package logic

import (
	"context"
	"database/sql"
	stderrors "errors"
	"time"

	"github.com/zeromicro/go-zero/core/logx"

	"career-api/common/errors"
	"career-api/internal/model"
	"career-api/internal/pkg"
	"career-api/internal/svc"
	"career-api/internal/types"
)

type RegisterLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewRegisterLogic(ctx context.Context, svcCtx *svc.ServiceContext) *RegisterLogic {
	return &RegisterLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *RegisterLogic) Register(req *types.RegisterReq) (*types.UserResp, error) {
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
	_, err := l.svcCtx.UserModel.FindOneByUsername(l.ctx, req.Username)
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

type LoginLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewLoginLogic(ctx context.Context, svcCtx *svc.ServiceContext) *LoginLogic {
	return &LoginLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *LoginLogic) Login(req *types.LoginReq) (*types.LoginResp, error) {
	if req.Username == "" || req.Password == "" {
		return nil, stderrors.New("username and password are required")
	}

	// 从数据库查找用户
	user, err := l.svcCtx.UserModel.FindOneByUsername(l.ctx, req.Username)
	if err != nil {
		logx.Errorf("FindOneByUsername failed: %v", err)
		return nil, stderrors.New("invalid username or password")
	}

	// 验证密码
	if !pkg.CheckPassword(req.Password, user.Password) {
		return nil, stderrors.New("invalid username or password")
	}

	// 生成JWT token
	tokenString, err := pkg.GenerateToken(
		user.Id,
		user.Username,
		user.Role,
		l.svcCtx.Config.Auth.AccessSecret,
		l.svcCtx.Config.Auth.AccessExpire,
	)
	if err != nil {
		logx.Errorf("GenerateToken failed: %v", err)
		return nil, err
	}

	expires := time.Now().Unix() + l.svcCtx.Config.Auth.AccessExpire

	logx.Infof("User logged in: %s (id: %d)", user.Username, user.Id)

	return &types.LoginResp{
		Token:   tokenString,
		Expires: expires,
		UserId:  user.Id,
	}, nil
}

type GetUserInfoLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetUserInfoLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetUserInfoLogic {
	return &GetUserInfoLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetUserInfoLogic) GetUserInfo() (*types.UserResp, error) {
	// 从上下文获取userId
	userId, ok := l.ctx.Value("userId").(int64)
	if !ok {
		return &types.UserResp{
			Code: errors.CodeUnauthorized,
			Msg:  "unauthorized",
		}, nil
	}

	// 从数据库查询用户信息
	user, err := l.svcCtx.UserModel.FindOne(l.ctx, userId)
	if err != nil {
		logx.Errorf("FindOne failed: %v", err)
		return &types.UserResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to get user info",
		}, nil
	}

	phone := ""
	if user.Phone.Valid {
		phone = user.Phone.String
	}

	return &types.UserResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
		Data: &types.UserInfo{
			Id:        user.Id,
			Username:  user.Username,
			Email:     user.Email,
			Phone:     phone,
			Role:      user.Role,
			CreatedAt: user.CreatedAt,
		},
	}, nil
}

type UpdateUserInfoLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewUpdateUserInfoLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UpdateUserInfoLogic {
	return &UpdateUserInfoLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *UpdateUserInfoLogic) UpdateUserInfo(req *types.UpdateUserReq) (*types.UserResp, error) {
	// 从上下文获取userId
	userId, ok := l.ctx.Value("userId").(int64)
	if !ok {
		return &types.UserResp{
			Code: errors.CodeUnauthorized,
			Msg:  "unauthorized",
		}, nil
	}

	// 从数据库查询用户信息
	user, err := l.svcCtx.UserModel.FindOne(l.ctx, userId)
	if err != nil {
		logx.Errorf("FindOne failed: %v", err)
		return &types.UserResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to get user info",
		}, nil
	}

	// 更新用户信息
	if req.Email != "" {
		user.Email = req.Email
	}
	if req.Phone != "" {
		user.Phone = sql.NullString{String: req.Phone, Valid: true}
	}
	user.UpdatedAt = time.Now().Unix()

	err = l.svcCtx.UserModel.Update(l.ctx, user)
	if err != nil {
		logx.Errorf("Update failed: %v", err)
		return &types.UserResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to update user info",
		}, nil
	}

	phone := ""
	if user.Phone.Valid {
		phone = user.Phone.String
	}

	return &types.UserResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
		Data: &types.UserInfo{
			Id:        user.Id,
			Username:  user.Username,
			Email:     user.Email,
			Phone:     phone,
			Role:      user.Role,
			CreatedAt: user.CreatedAt,
		},
	}, nil
}
