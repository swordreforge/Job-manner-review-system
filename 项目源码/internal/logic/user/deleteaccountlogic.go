package user

import (
	"context"

	"career-api/common/errors"
	"career-api/internal/pkg"
	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type DeleteAccountLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewDeleteAccountLogic(ctx context.Context, svcCtx *svc.ServiceContext) *DeleteAccountLogic {
	return &DeleteAccountLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *DeleteAccountLogic) DeleteAccount(req *types.DeleteAccountReq) (resp *types.UserResp, err error) {
	userId, ok := l.ctx.Value("userId").(int64)
	if !ok {
		return &types.UserResp{Code: errors.CodeUnauthorized, Msg: "unauthorized"}, nil
	}

	user, err := l.svcCtx.UserModel.FindOne(l.ctx, userId)
	if err != nil {
		logx.Errorf("FindOne failed: %v", err)
		return &types.UserResp{Code: errors.CodeInternalError, Msg: "failed to get user info"}, nil
	}

	if !pkg.CheckPassword(req.Password, user.Password) {
		return &types.UserResp{Code: errors.CodeInvalidParams, Msg: "password is incorrect"}, nil
	}

	if err := l.svcCtx.UserModel.Delete(l.ctx, userId); err != nil {
		logx.Errorf("Delete user failed: %v", err)
		return &types.UserResp{Code: errors.CodeInternalError, Msg: "failed to delete account"}, nil
	}

	return &types.UserResp{Code: errors.CodeSuccess, Msg: "account deleted successfully"}, nil
}
