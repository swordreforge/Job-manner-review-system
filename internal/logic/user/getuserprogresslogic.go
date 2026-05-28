package user

import (
	"context"

	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetUserProgressLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetUserProgressLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetUserProgressLogic {
	return &GetUserProgressLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetUserProgressLogic) GetUserProgress() (*types.UserProgressResp, error) {
	userId, ok := l.ctx.Value("userId").(int64)
	if !ok {
		return &types.UserProgressResp{
			Code: 401,
			Msg:  "unauthorized",
		}, nil
	}

	db, err := l.svcCtx.DB.RawDB()
	if err != nil {
		logx.Errorf("get raw db failed: %v", err)
		return &types.UserProgressResp{Code: 500, Msg: "db error"}, nil
	}

	var studentId int64 = 0
	row := db.QueryRowContext(l.ctx,
		"SELECT id FROM students WHERE user_id = ?", userId)
	row.Scan(&studentId)

	items := []types.UserProgressItem{
		{Key: "holland_test", Title: "霍兰德职业倾向测试", Description: "完成职业兴趣测试，了解你的职业倾向", Path: "/holland", Icon: "psychology"},
		{Key: "student_profile", Title: "完善个人资料", Description: "创建并完善你的学生资料档案", Path: "/profile", Icon: "person_edit"},
		{Key: "resume_upload", Title: "简历上传与解析", Description: "上传简历，AI 智能解析构建职业画像", Path: "/resume", Icon: "description"},
		{Key: "career_report", Title: "职业规划报告", Description: "生成专属职业规划与发展报告", Path: "/plan", Icon: "map"},
		{Key: "interview_simulation", Title: "模拟面试", Description: "AI 模拟面试，提升求职面试技巧", Path: "/interview", Icon: "record_voice_over"},
	}

	completedCount := 0

	hollandCount := 0
	db.QueryRowContext(l.ctx,
		"SELECT COUNT(*) FROM holland_test_results WHERE student_id = ?", studentId).Scan(&hollandCount)
	if hollandCount > 0 {
		items[0].Completed = true
		completedCount++
	}

	profileCount := 0
	db.QueryRowContext(l.ctx,
		"SELECT COUNT(*) FROM students WHERE user_id = ? AND name != '' AND name IS NOT NULL", userId).Scan(&profileCount)
	if profileCount > 0 {
		items[1].Completed = true
		completedCount++
	}

	resumeCount := 0
	db.QueryRowContext(l.ctx,
		"SELECT COUNT(*) FROM resume_parse_history WHERE user_id = ?", userId).Scan(&resumeCount)
	if resumeCount > 0 {
		items[2].Completed = true
		completedCount++
	}

	reportCount := 0
	db.QueryRowContext(l.ctx,
		"SELECT COUNT(*) FROM career_reports WHERE student_id = ? AND status = 'completed'", userId).Scan(&reportCount)
	if reportCount > 0 {
		items[3].Completed = true
		completedCount++
	}

	interviewCount := 0
	db.QueryRowContext(l.ctx,
		"SELECT COUNT(*) FROM interview_sessions WHERE user_id = ? AND status = 'completed'", userId).Scan(&interviewCount)
	if interviewCount > 0 {
		items[4].Completed = true
		completedCount++
	}

	overallRate := 0.0
	if len(items) > 0 {
		overallRate = float64(completedCount) / float64(len(items)) * 100
	}

	return &types.UserProgressResp{
		Code:            0,
		Msg:             "success",
		TotalItems:      len(items),
		CompletedItems:  completedCount,
		OverallProgress: overallRate,
		Items:           items,
	}, nil
}