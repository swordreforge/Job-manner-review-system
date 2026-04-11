// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package user

import (
	"context"
	"database/sql"

	"career-api/common/errors"
	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type UpdateUserInfoLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// Update user info
func NewUpdateUserInfoLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UpdateUserInfoLogic {
	return &UpdateUserInfoLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *UpdateUserInfoLogic) UpdateUserInfo(req *types.UpdateUserReq) (resp *types.UserResp, err error) {
	userId, ok := l.ctx.Value("userId").(int64)
	if !ok {
		return &types.UserResp{Code: errors.CodeUnauthorized, Msg: "unauthorized"}, nil
	}

	user, err := l.svcCtx.UserModel.FindOne(l.ctx, userId)
	if err != nil {
		logx.Errorf("FindOne failed: %v", err)
		return &types.UserResp{Code: errors.CodeInternalError, Msg: "failed to get user info"}, nil
	}

	if req.Username != "" && req.Username != user.Username {
		existing, findErr := l.svcCtx.UserModel.FindOneByUsername(l.ctx, req.Username)
		if findErr == nil && existing.Id != userId {
			return &types.UserResp{Code: errors.CodeInvalidParams, Msg: "username already exists"}, nil
		}
		user.Username = req.Username
	}

	if req.Email != "" && req.Email != user.Email {
		existing, findErr := l.svcCtx.UserModel.FindOneByEmail(l.ctx, req.Email)
		if findErr == nil && existing.Id != userId {
			return &types.UserResp{Code: errors.CodeInvalidParams, Msg: "email already exists"}, nil
		}
		user.Email = req.Email
	}

	if req.Phone != "" {
		user.Phone = sql.NullString{String: req.Phone, Valid: true}
	}

	if err := l.svcCtx.UserModel.Update(l.ctx, user); err != nil {
		logx.Errorf("Update user failed: %v", err)
		return &types.UserResp{Code: errors.CodeInternalError, Msg: "failed to update user info"}, nil
	}

	updated, err := l.svcCtx.UserModel.FindOne(l.ctx, userId)
	if err != nil {
		logx.Errorf("Find updated user failed: %v", err)
		return &types.UserResp{Code: errors.CodeInternalError, Msg: "failed to get updated user info"}, nil
	}

	phone := ""
	if updated.Phone.Valid {
		phone = updated.Phone.String
	}
	avatar := ""
	if updated.Avatar.Valid {
		avatar = withAvatarVersion(
			buildAvatarURL(updated.Avatar.String, l.svcCtx.Config.Avatar.BaseURL),
			updated.UpdatedAt,
		)
	}

	return &types.UserResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
		Data: &types.UserInfo{
			Id:        updated.Id,
			Username:  updated.Username,
			Email:     updated.Email,
			Phone:     phone,
			Avatar:    avatar,
			Role:      updated.Role,
			CreatedAt: updated.CreatedAt,
		},
	}, nil
}
