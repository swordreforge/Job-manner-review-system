// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package user

import (
	"context"
	"time"

	"github.com/zeromicro/go-zero/core/logx"

	"career-api/internal/pkg"
	"career-api/internal/svc"
	"career-api/internal/types"
)

type LoginLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// User login
func NewLoginLogic(ctx context.Context, svcCtx *svc.ServiceContext) *LoginLogic {
	return &LoginLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *LoginLogic) Login(req *types.LoginReq) (resp *types.LoginResp, err error) {
	if req.Username == "" || req.Password == "" {
		return &types.LoginResp{
			Code: 400,
			Msg:  "用户名和密码不能为空",
		}, nil
	}

	// 从数据库查找用户
	user, err := l.svcCtx.UserModel.FindOneByUsername(l.ctx, req.Username)
	if err != nil {
		logx.Errorf("FindOneByUsername failed: %v", err)
		return &types.LoginResp{
			Code: 400,
			Msg:  "用户名或密码错误，请尝试注册账号",
		}, nil
	}

	// 验证密码
	if !pkg.CheckPassword(req.Password, user.Password) {
		return &types.LoginResp{
			Code: 400,
			Msg:  "用户名或密码错误",
		}, nil
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
		Code:    0,
		Msg:     "success",
		Token:   tokenString,
		Expires: expires,
		UserId:  user.Id,
	}, nil
}
