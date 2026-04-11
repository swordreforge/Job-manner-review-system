package user

import (
	"context"

	"career-api/common/errors"
	"career-api/internal/pkg"
	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type UpdatePasswordLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewUpdatePasswordLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UpdatePasswordLogic {
	return &UpdatePasswordLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *UpdatePasswordLogic) UpdatePassword(req *types.UpdatePasswordReq) (resp *types.UserResp, err error) {
	userId, ok := l.ctx.Value("userId").(int64)
	if !ok {
		return &types.UserResp{Code: errors.CodeUnauthorized, Msg: "unauthorized"}, nil
	}

	if req.OldPassword == req.NewPassword {
		return &types.UserResp{Code: errors.CodeInvalidParams, Msg: "new password must be different from old password"}, nil
	}

	user, err := l.svcCtx.UserModel.FindOne(l.ctx, userId)
	if err != nil {
		logx.Errorf("FindOne failed: %v", err)
		return &types.UserResp{Code: errors.CodeInternalError, Msg: "failed to get user info"}, nil
	}

	if !pkg.CheckPassword(req.OldPassword, user.Password) {
		return &types.UserResp{Code: errors.CodeInvalidParams, Msg: "old password is incorrect"}, nil
	}

	hashed, err := pkg.HashPassword(req.NewPassword)
	if err != nil {
		logx.Errorf("HashPassword failed: %v", err)
		return &types.UserResp{Code: errors.CodeInternalError, Msg: "failed to update password"}, nil
	}

	user.Password = hashed
	if err := l.svcCtx.UserModel.Update(l.ctx, user); err != nil {
		logx.Errorf("Update user password failed: %v", err)
		return &types.UserResp{Code: errors.CodeInternalError, Msg: "failed to update password"}, nil
	}

	return &types.UserResp{Code: errors.CodeSuccess, Msg: "password updated successfully"}, nil
}
