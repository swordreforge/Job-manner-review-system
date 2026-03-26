// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package user

import (
	"context"

	"github.com/zeromicro/go-zero/core/logx"

	"career-api/common/errors"
	"career-api/internal/svc"
	"career-api/internal/types"
)

type GetUserInfoLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// Get user info
func NewGetUserInfoLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetUserInfoLogic {
	return &GetUserInfoLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetUserInfoLogic) GetUserInfo() (resp *types.UserResp, err error) {
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
