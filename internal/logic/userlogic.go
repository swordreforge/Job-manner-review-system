package logic

import (
	"context"
	"errors"
	"time"

	"github.com/zeromicro/go-zero/core/logx"

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
	if req.Username == "" || req.Password == "" {
		return &types.UserResp{
			Code: 400,
			Msg:  "username and password are required",
		}, nil
	}

	if req.Email == "" {
		return &types.UserResp{
			Code: 400,
			Msg:  "email is required",
		}, nil
	}

	userId := time.Now().UnixNano()

	user := &types.UserInfo{
		Id:        userId,
		Username:  req.Username,
		Email:     req.Email,
		Phone:     req.Phone,
		Role:      "user",
		CreatedAt: time.Now().Unix(),
	}

	logx.Infof("User registered: %s", req.Username)

	return &types.UserResp{
		Code: 0,
		Msg:  "success",
		Data: user,
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
		return nil, errors.New("username and password are required")
	}

	expires := time.Now().Unix() + l.svcCtx.Config.Auth.AccessExpire
	tokenString := "mock-jwt-token-" + req.Username

	return &types.LoginResp{
		Token:   tokenString,
		Expires: expires,
		UserId:  1,
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
	user := &types.UserInfo{
		Id:        1,
		Username:  "current_user",
		Email:     "user@example.com",
		Phone:     "1234567890",
		Role:      "user",
		CreatedAt: time.Now().Unix(),
	}

	return &types.UserResp{
		Code: 0,
		Msg:  "success",
		Data: user,
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
	user := &types.UserInfo{
		Id:        1,
		Username:  "current_user",
		Email:     req.Email,
		Phone:     req.Phone,
		Role:      "user",
		CreatedAt: time.Now().Unix(),
	}

	return &types.UserResp{
		Code: 0,
		Msg:  "success",
		Data: user,
	}, nil
}
