package interview

import (
	"context"
	"database/sql"
	"time"

	"github.com/zeromicro/go-zero/core/logx"

	"career-api/common/errors"
	"career-api/internal/model"
	"career-api/internal/svc"
	"career-api/internal/types"
)

type StartInterviewLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewStartInterviewLogic(ctx context.Context, svcCtx *svc.ServiceContext) *StartInterviewLogic {
	return &StartInterviewLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *StartInterviewLogic) StartInterview(req *types.StartInterviewReq) (*types.InterviewResp, error) {
	// 获取用户ID
	userId, ok := l.ctx.Value("userId").(int64)
	if !ok {
		return &types.InterviewResp{
			Code: errors.CodeUnauthorized,
			Msg:  "unauthorized",
		}, nil
	}

	// 检查是否有正在进行的面试
	runningSession, err := l.svcCtx.InterviewSessionsModel.FindRunningByUserId(l.ctx, userId)
	if err == nil && runningSession != nil {
		// 有正在进行的面试，返回该会话
		return &types.InterviewResp{
			Code: errors.CodeSuccess,
			Msg:  "resumed existing session",
			Data: &types.InterviewSession{
				Id:             runningSession.Id,
				UserId:         runningSession.UserId,
				StudentId:      getValidInt64(runningSession.StudentId),
				Mode:           runningSession.Mode,
				Status:         runningSession.Status,
				TotalQuestions: runningSession.TotalQuestions,
				CurrentQuestion: runningSession.CurrentQuestion,
				AverageScore:   runningSession.AverageScore,
				CreatedAt:      runningSession.CreatedAt,
				FirstQuestion:  "请继续回答面试问题",
			},
		}, nil
	}

	// 创建新的面试会话
	now := time.Now().Unix()
	session := &model.InterviewSessions{
		UserId:          userId,
		Mode:            req.Mode,
		Status:          "running",
		TotalQuestions:  0,
		CurrentQuestion: 0,
		AverageScore:    0,
		MaxScore:        0,
		MinScore:        0,
		DurationSeconds: 0,
		CreatedAt:       now,
		UpdatedAt:       now,
	}

	// 如果提供了studentId，设置它
	if req.StudentId > 0 {
		session.StudentId = sql.NullInt64{Int64: req.StudentId, Valid: true}
	}

	// 插入数据库
	result, err := l.svcCtx.InterviewSessionsModel.Insert(l.ctx, session)
	if err != nil {
		logx.WithContext(l.ctx).Errorf("Failed to create interview session: %v", err)
		return &types.InterviewResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to create session",
		}, nil
	}

	// 获取插入的ID
	sessionId, _ := result.LastInsertId()
	session.Id = sessionId

	// 记录日志
	logx.WithContext(l.ctx).Infow("Interview session created",
		logx.Field("userId", userId),
		logx.Field("sessionId", sessionId),
		logx.Field("mode", req.Mode),
	)

	// 返回响应
	return &types.InterviewResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
		Data: &types.InterviewSession{
			Id:             session.Id,
			UserId:         session.UserId,
			StudentId:      getValidInt64(session.StudentId),
			Mode:           session.Mode,
			Status:         session.Status,
			TotalQuestions: session.TotalQuestions,
			CurrentQuestion: session.CurrentQuestion,
			AverageScore:   session.AverageScore,
			CreatedAt:      session.CreatedAt,
			FirstQuestion:  "请先做一个简单的自我介绍",
		},
	}, nil
}

// getValidInt64 将sql.NullInt64转换为int64，如果无效则返回0
func getValidInt64(n sql.NullInt64) int64 {
	if n.Valid {
		return n.Int64
	}
	return 0
}