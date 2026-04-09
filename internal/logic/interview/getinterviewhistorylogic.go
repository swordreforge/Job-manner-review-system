package interview

import (
	"context"

	"github.com/zeromicro/go-zero/core/logx"

	"career-api/common/errors"
	"career-api/internal/svc"
	"career-api/internal/types"
)

type GetInterviewHistoryLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetInterviewHistoryLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetInterviewHistoryLogic {
	return &GetInterviewHistoryLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetInterviewHistoryLogic) GetInterviewHistory(req *types.GetInterviewHistoryReq) (*types.InterviewHistoryListResp, error) {
	// 获取用户ID
	userId, ok := l.ctx.Value("userId").(int64)
	if !ok {
		return &types.InterviewHistoryListResp{
			Code: errors.CodeUnauthorized,
			Msg:  "unauthorized",
		}, nil
	}

	// 设置默认分页参数
	page := req.Page
	if page <= 0 {
		page = 1
	}
	pageSize := req.PageSize
	if pageSize <= 0 {
		pageSize = 10
	}
	if pageSize > 100 {
		pageSize = 100
	}

	// 查询历史记录
	sessions, total, err := l.svcCtx.InterviewSessionsModel.FindByUserId(
		l.ctx,
		userId,
		page,
		pageSize,
		req.Status,
		req.Mode,
	)
	if err != nil {
		logx.WithContext(l.ctx).Errorf("Failed to get interview history: %v", err)
		return &types.InterviewHistoryListResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to get history",
		}, nil
	}

	// 转换为响应格式
	list := make([]types.InterviewHistoryResp, 0, len(sessions))
	for _, session := range sessions {
		list = append(list, types.InterviewHistoryResp{
			Id:              session.Id,
			UserId:          session.UserId,
			StudentId:       getValidInt64(session.StudentId),
			Mode:            session.Mode,
			Status:          session.Status,
			AverageScore:    session.AverageScore,
			TotalQuestions:  session.TotalQuestions,
			CurrentQuestion: session.CurrentQuestion,
			DurationSeconds: session.DurationSeconds,
			CreatedAt:       session.CreatedAt,
			CompletedAt:     getValidInt64(session.CompletedAt),
		})
	}

	return &types.InterviewHistoryListResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
		Data: &types.InterviewHistoryResult{
			Total: total,
			List:  list,
		},
	}, nil
}