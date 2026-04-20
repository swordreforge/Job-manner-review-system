package interview

import (
	"context"

	"github.com/zeromicro/go-zero/core/logx"

	"career-api/common/errors"
	"career-api/internal/svc"
	"career-api/internal/types"
)

type DeleteInterviewLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewDeleteInterviewLogic(ctx context.Context, svcCtx *svc.ServiceContext) *DeleteInterviewLogic {
	return &DeleteInterviewLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *DeleteInterviewLogic) DeleteInterview(req *types.DeleteInterviewReq) (*types.InterviewBaseResp, error) {
	// 获取用户ID
	userId, ok := l.ctx.Value("userId").(int64)
	if !ok {
		return &types.InterviewBaseResp{
			Code: errors.CodeUnauthorized,
			Msg:  "unauthorized",
		}, nil
	}

	// 验证session权限
	_, err := l.svcCtx.InterviewSessionsModel.FindOneByUserId(l.ctx, userId, req.Id)
	if err != nil {
		logx.WithContext(l.ctx).Errorf("Failed to get interview session: %v", err)
		return &types.InterviewBaseResp{
			Code: errors.CodeNotFound,
			Msg:  "session not found",
		}, nil
	}

	// 删除会话（会自动级联删除消息和报告）
	err = l.svcCtx.InterviewSessionsModel.Delete(l.ctx, req.Id)
	if err != nil {
		logx.WithContext(l.ctx).Errorf("Failed to delete interview session: %v", err)
		return &types.InterviewBaseResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to delete session",
		}, nil
	}

	logx.WithContext(l.ctx).Infow("Interview session deleted",
		logx.Field("userId", userId),
		logx.Field("sessionId", req.Id),
	)

	return &types.InterviewBaseResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
	}, nil
}