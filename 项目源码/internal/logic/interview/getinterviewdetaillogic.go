package interview

import (
	"context"
	"database/sql"

	"github.com/zeromicro/go-zero/core/logx"

	"career-api/common/errors"
	"career-api/internal/svc"
	"career-api/internal/types"
)

type GetInterviewDetailLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetInterviewDetailLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetInterviewDetailLogic {
	return &GetInterviewDetailLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetInterviewDetailLogic) GetInterviewDetail(req *types.GetInterviewDetailReq) (*types.InterviewDetailResp, error) {
	// 获取用户ID
	userId, ok := l.ctx.Value("userId").(int64)
	if !ok {
		return &types.InterviewDetailResp{
			Code: errors.CodeUnauthorized,
			Msg:  "unauthorized",
		}, nil
	}

	// 获取会话信息
	session, err := l.svcCtx.InterviewSessionsModel.FindOneByUserId(l.ctx, userId, req.Id)
	if err != nil {
		logx.WithContext(l.ctx).Errorf("Failed to get interview session: %v", err)
		return &types.InterviewDetailResp{
			Code: errors.CodeNotFound,
			Msg:  "session not found",
		}, nil
	}

	// 获取所有消息
	messages, err := l.svcCtx.InterviewMessagesModel.FindBySessionId(l.ctx, req.Id)
	if err != nil {
		logx.WithContext(l.ctx).Errorf("Failed to get messages: %v", err)
		return &types.InterviewDetailResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to get messages",
		}, nil
	}

	// 转换消息格式
	messageList := make([]types.InterviewMessageResp, 0, len(messages))
	for _, msg := range messages {
		messageList = append(messageList, types.InterviewMessageResp{
			Id:           msg.Id,
			SessionId:    msg.SessionId,
			Role:         msg.Role,
			Content:      msg.Content,
			QuestionType: getValidString(msg.QuestionType),
			Score:        getValidFloat64(msg.Score),
			Feedback:     getValidString(msg.Feedback),
			CreatedAt:    msg.CreatedAt,
		})
	}

	return &types.InterviewDetailResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
		Data: &types.InterviewDetail{
			Id:              session.Id,
			UserId:          session.UserId,
			StudentId:       getValidInt64(session.StudentId),
			Mode:            session.Mode,
			Status:          session.Status,
			TotalQuestions:  session.TotalQuestions,
			CurrentQuestion: session.CurrentQuestion,
			AverageScore:    session.AverageScore,
			MaxScore:        session.MaxScore,
			MinScore:        session.MinScore,
			DurationSeconds: session.DurationSeconds,
			CreatedAt:       session.CreatedAt,
			CompletedAt:     getValidInt64(session.CompletedAt),
			Messages:        messageList,
		},
	}, nil
}

// getValidString 将sql.NullString转换为string
func getValidString(s sql.NullString) string {
	if s.Valid {
		return s.String
	}
	return ""
}

// getValidFloat64 将sql.NullFloat64转换为float64
func getValidFloat64(f sql.NullFloat64) float64 {
	if f.Valid {
		return f.Float64
	}
	return 0
}