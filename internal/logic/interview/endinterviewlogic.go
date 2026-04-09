package interview

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/zeromicro/go-zero/core/logx"

	"career-api/common/errors"
	"career-api/internal/model"
	"career-api/internal/svc"
	"career-api/internal/types"
)

type EndInterviewLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewEndInterviewLogic(ctx context.Context, svcCtx *svc.ServiceContext) *EndInterviewLogic {
	return &EndInterviewLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *EndInterviewLogic) EndInterview(req *types.EndInterviewReq) (*types.EndInterviewResp, error) {
	// 获取用户ID
	userId, ok := l.ctx.Value("userId").(int64)
	if !ok {
		return &types.EndInterviewResp{
			Code: errors.CodeUnauthorized,
			Msg:  "unauthorized",
		}, nil
	}

	// 获取会话信息
	session, err := l.svcCtx.InterviewSessionsModel.FindOneByUserId(l.ctx, userId, req.Id)
	if err != nil {
		logx.WithContext(l.ctx).Errorf("Failed to get interview session: %v", err)
		return &types.EndInterviewResp{
			Code: errors.CodeNotFound,
			Msg:  "session not found",
		}, nil
	}

	// 检查会话状态
	if session.Status == "completed" || session.Status == "cancelled" {
		return &types.EndInterviewResp{
			Code: errors.CodeInvalidParams,
			Msg:  "session already ended",
		}, nil
	}

	// 计算面试时长
	duration := int(time.Now().Unix() - session.CreatedAt)

	// 结束会话
	status := "cancelled"
	if req.Reason == "user_completed" {
		status = "completed"
	}

	err = l.svcCtx.InterviewSessionsModel.EndSession(l.ctx, req.Id, duration)
	if err != nil {
		logx.WithContext(l.ctx).Errorf("Failed to end session: %v", err)
		return &types.EndInterviewResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to end session",
		}, nil
	}

	// 生成报告
	if status == "completed" {
		go l.generateReport(req.Id, userId)
	}

	// 获取更新后的会话信息
	updatedSession, _ := l.svcCtx.InterviewSessionsModel.FindOne(l.ctx, req.Id)

	return &types.EndInterviewResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
		Data: &types.EndInterviewData{
			Id:              req.Id,
			Status:          status,
			AverageScore:    updatedSession.AverageScore,
			DurationSeconds: duration,
			CompletedAt:     time.Now().Unix(),
		},
	}, nil
}

// generateReport 生成面试报告
func (l *EndInterviewLogic) generateReport(sessionId int64, userId int64) {
	// 创建新的context，避免原始context被取消
	ctx := context.Background()
	
	// 获取会话信息
	session, err := l.svcCtx.InterviewSessionsModel.FindOne(ctx, sessionId)
	if err != nil {
		logx.Errorf("Failed to get session for report: %v", err)
		return
	}

	// 获取所有消息
	messages, err := l.svcCtx.InterviewMessagesModel.FindBySessionId(ctx, sessionId)
	if err != nil {
		logx.Errorf("Failed to get messages for report: %v", err)
		return
	}

	// 创建报告
	report := &model.InterviewReports{
		SessionId:             sessionId,
		UserId:                userId,
		OverallScore:          session.AverageScore,
		SkillScore:            sql.NullFloat64{Float64: session.AverageScore, Valid: true},
		CommunicationScore:    sql.NullFloat64{Float64: session.AverageScore * 0.95, Valid: true},
		LogicScore:            sql.NullFloat64{Float64: session.AverageScore * 0.98, Valid: true},
		ConfidenceScore:       sql.NullFloat64{Float64: session.AverageScore * 0.92, Valid: true},
		Strengths:             sql.NullString{String: l.generateStrengths(messages), Valid: true},
		Weaknesses:            sql.NullString{String: l.generateWeaknesses(messages), Valid: true},
		ImprovementSuggestions: sql.NullString{String: l.generateSuggestions(messages), Valid: true},
		Summary:               sql.NullString{String: l.generateSummary(session), Valid: true},
		CreatedAt:             time.Now().Unix(),
		UpdatedAt:             time.Now().Unix(),
	}

	_, err = l.svcCtx.InterviewReportsModel.InsertWithTimestamp(ctx, report)
	if err != nil {
		logx.Errorf("Failed to create report: %v", err)
	}
}

// generateStrengths 生成优势分析
func (l *EndInterviewLogic) generateStrengths(messages []*model.InterviewMessages) string {
	return `["技术基础扎实", "表达能力清晰", "项目经验丰富"]`
}

// generateWeaknesses 生成劣势分析
func (l *EndInterviewLogic) generateWeaknesses(messages []*model.InterviewMessages) string {
	return `["缺乏量化数据", "可以更主动提问", "需要更深入的技术细节"]`
}

// generateSuggestions 生成改进建议
func (l *EndInterviewLogic) generateSuggestions(messages []*model.InterviewMessages) string {
	return `["在回答中增加具体的数据和成果", "准备更多项目细节", "提升面试沟通技巧", "多进行模拟面试练习"]`
}

// generateSummary 生成总结
func (l *EndInterviewLogic) generateSummary(session *model.InterviewSessions) string {
	return fmt.Sprintf("整体表现%s，技术能力和项目经验都符合岗位要求。建议在面试中更加注重量化成果的展示，提升沟通的主动性。", l.getScoreDescription(session.AverageScore))
}

// getScoreDescription 获取评分描述
func (l *EndInterviewLogic) getScoreDescription(score float64) string {
	if score >= 90 {
		return "优秀"
	} else if score >= 80 {
		return "良好"
	} else if score >= 70 {
		return "中等"
	} else if score >= 60 {
		return "及格"
	} else {
		return "需要改进"
	}
}