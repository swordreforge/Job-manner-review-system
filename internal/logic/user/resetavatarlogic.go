package user

import (
	"context"
	"fmt"
	"os"
	"path/filepath"

	"github.com/zeromicro/go-zero/core/logx"

	"career-api/common/errors"
	"career-api/internal/svc"
	"career-api/internal/types"
)

type ResetAvatarLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// Reset avatar and clear stored avatar metadata.
func NewResetAvatarLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ResetAvatarLogic {
	return &ResetAvatarLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ResetAvatarLogic) ResetAvatar() (resp *types.ResetAvatarResp, err error) {
	userId, ok := l.ctx.Value("userId").(int64)
	if !ok {
		return &types.ResetAvatarResp{
			Code: errors.CodeUnauthorized,
			Msg:  "unauthorized",
		}, nil
	}

	if _, err = l.svcCtx.UserModel.UpdateAvatar(l.ctx, userId, ""); err != nil {
		logx.Errorf("重置用户头像失败: %v", err)
		return &types.ResetAvatarResp{
			Code: errors.CodeInternalError,
			Msg:  "重置头像失败",
		}, nil
	}

	savePath := l.svcCtx.Config.Avatar.SavePath
	if savePath == "" {
		savePath = "./img"
	}
	for _, ext := range []string{".png", ".jpg", ".jpeg", ".webp"} {
		avatarPath := filepath.Join(savePath, fmt.Sprintf("avatar_%d%s", userId, ext))
		if removeErr := os.Remove(avatarPath); removeErr != nil && !os.IsNotExist(removeErr) {
			logx.Errorf("删除头像文件失败: %v", removeErr)
		}
	}

	return &types.ResetAvatarResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
	}, nil
}
