// Code scaffolded by goctl. Safe to edit.

package user

import (
	"context"
	"encoding/base64"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/zeromicro/go-zero/core/logx"

	"career-api/common/errors"
	"career-api/internal/svc"
	"career-api/internal/types"
)

type UploadAvatarLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// Upload avatar
func NewUploadAvatarLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UploadAvatarLogic {
	return &UploadAvatarLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *UploadAvatarLogic) UploadAvatar(req *types.UploadAvatarReq) (resp *types.UploadAvatarResp, err error) {
	// 从上下文获取userId
	userId, ok := l.ctx.Value("userId").(int64)
	if !ok {
		return &types.UploadAvatarResp{
			Code: errors.CodeUnauthorized,
			Msg:  "unauthorized",
		}, nil
	}

	// 验证文件格式
	ext := strings.ToLower(filepath.Ext(req.FileName))
	allowedExts := map[string]bool{
		".png":  true,
		".jpg":  true,
		".jpeg": true,
		".webp": true,
	}
	if !allowedExts[ext] {
		return &types.UploadAvatarResp{
			Code: errors.CodeInvalidParams,
			Msg:  "不支持的图片格式，仅支持 png, jpg, jpeg, webp",
		}, nil
	}

	// 解码base64
	decoded, err := base64.StdEncoding.DecodeString(req.FileContent)
	if err != nil {
		// 尝试URL-safe base64
		decoded, err = base64.URLEncoding.DecodeString(req.FileContent)
		if err != nil {
			return &types.UploadAvatarResp{
				Code: errors.CodeInvalidParams,
				Msg:  "图片解码失败",
			}, nil
		}
	}

	// 检查文件大小
	maxSize := l.svcCtx.Config.Avatar.MaxFileSize
	if maxSize == 0 {
		maxSize = 5 * 1024 * 1024 // 默认5MB
	}
	if int64(len(decoded)) > maxSize {
		return &types.UploadAvatarResp{
			Code: errors.CodeInvalidParams,
			Msg:  "图片大小超出限制",
		}, nil
	}

	// 获取保存路径
	savePath := l.svcCtx.Config.Avatar.SavePath
	if savePath == "" {
		savePath = "./img"
	}

	// 创建目录
	err = os.MkdirAll(savePath, 0755)
	if err != nil {
		logx.Errorf("创建头像目录失败: %v", err)
		return &types.UploadAvatarResp{
			Code: errors.CodeInternalError,
			Msg:  "服务器内部错误",
		}, nil
	}

	// 生成文件名
	filename := fmt.Sprintf("avatar_%d%s", userId, ext)
	filePath := filepath.Join(savePath, filename)

	// 写入文件
	err = os.WriteFile(filePath, decoded, 0644)
	if err != nil {
		logx.Errorf("写入头像文件失败: %v", err)
		return &types.UploadAvatarResp{
			Code: errors.CodeInternalError,
			Msg:  "保存图片失败",
		}, nil
	}

	// 更新数据库 - 使用 UpdateAvatar 方法
	_, err = l.svcCtx.UserModel.UpdateAvatar(l.ctx, userId, filePath)
	if err != nil {
		logx.Errorf("更新用户头像失败: %v", err)
		return &types.UploadAvatarResp{
			Code: errors.CodeInternalError,
			Msg:  "更新头像失败",
		}, nil
	}

	// 返回URL
	baseURL := l.svcCtx.Config.Avatar.BaseURL
	if baseURL == "" {
		baseURL = "https://pic.swordreforge.top/img"
	}
	avatarURL := baseURL + "/" + filename

	return &types.UploadAvatarResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
		Url:  avatarURL,
	}, nil
}
