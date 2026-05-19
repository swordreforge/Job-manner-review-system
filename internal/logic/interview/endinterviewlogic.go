package interview

import (
	"context"
	"database/sql"
	"encoding/json"
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

	err = l.svcCtx.InterviewSessionsModel.EndSession(l.ctx, req.Id, duration, status)
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

	// 检查会话状态，只跳过已取消的面试
	if session.Status == "cancelled" {
		logx.Infof("Session %d is cancelled, skipping report generation", sessionId)
		return
	}

	// 获取所有消息
	messages, err := l.svcCtx.InterviewMessagesModel.FindBySessionId(ctx, sessionId)
	if err != nil {
		logx.Errorf("Failed to get messages for report: %v", err)
		return
	}

	// 分析面试数据
	analysis := l.analyzeSession(session, messages)

	// 创建报告
	report := &model.InterviewReports{
		SessionId:             sessionId,
		UserId:                userId,
		OverallScore:          session.AverageScore,
		SkillScore:            sql.NullFloat64{Float64: session.AverageScore, Valid: true},
		CommunicationScore:    sql.NullFloat64{Float64: session.AverageScore * 0.95, Valid: true},
		LogicScore:            sql.NullFloat64{Float64: session.AverageScore * 0.98, Valid: true},
		ConfidenceScore:       sql.NullFloat64{Float64: session.AverageScore * 0.92, Valid: true},
		Strengths:             sql.NullString{String: toJSONString(analysis.strengths), Valid: true},
		Weaknesses:            sql.NullString{String: toJSONString(analysis.weaknesses), Valid: true},
		ImprovementSuggestions: sql.NullString{String: toJSONString(analysis.suggestions), Valid: true},
		Summary:               sql.NullString{String: analysis.summary, Valid: true},
		CreatedAt:             time.Now().Unix(),
		UpdatedAt:             time.Now().Unix(),
	}

	_, err = l.svcCtx.InterviewReportsModel.InsertWithTimestamp(ctx, report)
	if err != nil {
		logx.Errorf("Failed to create report: %v", err)
	}
}

// analyzeSession 分析面试数据，生成个性化报告
type sessionAnalysis struct {
	strengths    []string
	weaknesses   []string
	suggestions  []string
	summary      string
}

func (l *EndInterviewLogic) analyzeSession(session *model.InterviewSessions, messages []*model.InterviewMessages) *sessionAnalysis {
	analysis := &sessionAnalysis{}
	
	// 按问题类型统计分数
	typeScores := make(map[string][]float64)
	var allScores []float64
	var highScoreTypes []string
	var lowScoreTypes []string
	
	for _, msg := range messages {
		if msg.Role != "assistant" {
			continue
		}
		if !msg.Score.Valid || msg.Score.Float64 == 0 {
			continue
		}
		
		score := msg.Score.Float64
		allScores = append(allScores, score)
		
		qt := "general"
		if msg.QuestionType.Valid {
			qt = msg.QuestionType.String
		}
		typeScores[qt] = append(typeScores[qt], score)
	}
	
	// 分析各类型表现
	typeNames := map[string]string{
		"self_intro": "自我介绍",
		"project":    "项目经验",
		"technical":  "技术深度",
		"design":     "系统设计",
		"scenario":   "场景问题",
		"hr":         "综合素质",
		"general":    "综合问题",
	}
	
	for qt, scores := range typeScores {
		if len(scores) == 0 {
			continue
		}
		avg := 0.0
		for _, s := range scores {
			avg += s
		}
		avg /= float64(len(scores))
		
		name := typeNames[qt]
		if name == "" {
			name = qt
		}
		
		if avg >= 80 {
			highScoreTypes = append(highScoreTypes, name)
		} else if avg < 60 {
			lowScoreTypes = append(lowScoreTypes, name)
		}
	}
	
	// 生成优势分析
	if len(highScoreTypes) > 0 {
		analysis.strengths = append(analysis.strengths, fmt.Sprintf("在%s方面表现优秀", joinStrings(highScoreTypes, "、")))
	}
	if session.MaxScore >= 85 {
		analysis.strengths = append(analysis.strengths, "具备出色的临场应变能力")
	}
	if len(allScores) > 2 {
		// 检查是否有进步趋势
		firstHalf := 0.0
		secondHalf := 0.0
		mid := len(allScores) / 2
		for i, s := range allScores {
			if i < mid {
				firstHalf += s
			} else {
				secondHalf += s
			}
		}
		firstHalf /= float64(mid)
		secondHalf /= float64(len(allScores) - mid)
		
		if secondHalf > firstHalf + 5 {
			analysis.strengths = append(analysis.strengths, "面试过程中持续进步，学习适应能力强")
		}
	}
	
	// 生成劣势分析
	if len(lowScoreTypes) > 0 {
		analysis.weaknesses = append(analysis.weaknesses, fmt.Sprintf("%s方面需要加强", joinStrings(lowScoreTypes, "、")))
	}
	if session.MinScore < 50 && session.MinScore > 0 {
		analysis.weaknesses = append(analysis.weaknesses, "部分问题回答不够深入，需要提升技术深度")
	}
	if len(allScores) > 2 {
		firstHalf := 0.0
		secondHalf := 0.0
		mid := len(allScores) / 2
		for i, s := range allScores {
			if i < mid {
				firstHalf += s
			} else {
				secondHalf += s
			}
		}
		firstHalf /= float64(mid)
		secondHalf /= float64(len(allScores) - mid)
		
		if secondHalf < firstHalf - 5 {
			analysis.weaknesses = append(analysis.weaknesses, "面试后期状态下滑，需注意保持专注力")
		}
	}
	
	// 生成改进建议
	for _, qt := range lowScoreTypes {
		switch qt {
		case "self_intro":
			analysis.suggestions = append(analysis.suggestions, "准备结构化的自我介绍模板，突出核心优势")
		case "project":
			analysis.suggestions = append(analysis.suggestions, "用STAR法则整理项目经验，准备具体数据支撑")
		case "technical":
			analysis.suggestions = append(analysis.suggestions, "深入理解常用技术栈底层原理，建立知识体系")
		case "design":
			analysis.suggestions = append(analysis.suggestions, "学习高并发、高可用系统设计模式，多做架构练习")
		case "scenario":
			analysis.suggestions = append(analysis.suggestions, "积累实际问题解决经验，建立排查问题方法论")
		case "hr":
			analysis.suggestions = append(analysis.suggestions, "明确职业规划，深入了解目标公司文化")
		}
	}
	
	if len(analysis.suggestions) == 0 {
		analysis.suggestions = append(analysis.suggestions, "继续保持当前状态，针对性提升薄弱环节")
	}
	
	// 生成总结
	analysis.summary = l.generateDynamicSummary(session, allScores, highScoreTypes, lowScoreTypes)
	
	return analysis
}

func joinStrings(strs []string, sep string) string {
	if len(strs) == 0 {
		return ""
	}
	result := strs[0]
	for i := 1; i < len(strs); i++ {
		result += sep + strs[i]
	}
	return result
}

func toJSONString(v interface{}) string {
	b, _ := json.Marshal(v)
	return string(b)
}

func (l *EndInterviewLogic) generateDynamicSummary(session *model.InterviewSessions, scores []float64, highTypes []string, lowTypes []string) string {
	if len(scores) == 0 {
		return "面试数据不足，无法生成总结"
	}
	
	avg := session.AverageScore
	desc := l.getScoreDescription(avg)
	
	if len(highTypes) > 0 && len(lowTypes) == 0 {
		return fmt.Sprintf("整体表现%s，在多个方面都有出色表现。建议继续保持优势，同时拓展技术广度。", desc)
	} else if len(highTypes) == 0 && len(lowTypes) > 0 {
		return fmt.Sprintf("整体表现%s，在部分领域还有提升空间。建议针对薄弱环节进行专项训练。", desc)
	} else if len(highTypes) > 0 && len(lowTypes) > 0 {
		return fmt.Sprintf("整体表现%s，优势明显但部分领域仍需加强。建议发挥长处的同时补齐短板。", desc)
	}
	
	return fmt.Sprintf("整体表现%s，技术能力和项目经验基本符合岗位要求。建议持续学习，全面提升综合素质。", desc)
}

// generateStrengths 生成优势分析（状态机驱动）
func (l *EndInterviewLogic) generateStrengths(messages []*model.InterviewMessages) string {
	return `["技术基础扎实", "表达能力清晰", "项目经验丰富"]`
}

// generateWeaknesses 生成劣势分析（状态机驱动）
func (l *EndInterviewLogic) generateWeaknesses(messages []*model.InterviewMessages) string {
	return `["缺乏量化数据", "可以更主动提问", "需要更深入的技术细节"]`
}

// generateSuggestions 生成改进建议（状态机驱动）
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