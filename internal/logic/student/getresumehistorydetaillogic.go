package student

import (
	"context"
	"encoding/json"

	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetResumeHistoryDetailLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// Get resume parse history detail
func NewGetResumeHistoryDetailLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetResumeHistoryDetailLogic {
	return &GetResumeHistoryDetailLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetResumeHistoryDetailLogic) GetResumeHistoryDetail(id int64) (resp *types.ResumeHistoryDetailResp, err error) {
	userId, ok := l.ctx.Value("userId").(int64)
	if !ok {
		return &types.ResumeHistoryDetailResp{
			Code: 401,
			Msg:  "unauthorized",
		}, nil
	}

	history, err := l.svcCtx.ResumeParseHistoryModel.FindOne(l.ctx, id)
	if err != nil {
		return &types.ResumeHistoryDetailResp{
			Code: 404,
			Msg:  "history record not found",
		}, nil
	}

	// 验证权限：只能查看自己的历史记录
	if history.UserId != userId {
		return &types.ResumeHistoryDetailResp{
			Code: 403,
			Msg:  "forbidden: you can only view your own history",
		}, nil
	}

	record := types.ResumeHistoryRecord{
		Id:                   history.Id,
		CompletenessScore:    history.CompletenessScore,
		CompetitivenessScore: history.CompetitivenessScore,
		CreatedAt:            history.CreatedAt,
	}

	if history.StudentId.Valid {
		record.StudentId = &history.StudentId.Int64
	}
	if history.ResumeFileName.Valid {
		record.ResumeFileName = history.ResumeFileName.String
	}
	if history.ResumeContent.Valid {
		record.ResumeContent = history.ResumeContent.String
	}
	if history.ParsedProfile.Valid {
		var profile types.StudentProfile
		if err := json.Unmarshal([]byte(history.ParsedProfile.String), &profile); err == nil {
			record.ParsedProfile = &profile
		}
	}
	if history.Suggestions.Valid {
		var suggestions []string
		if err := json.Unmarshal([]byte(history.Suggestions.String), &suggestions); err == nil {
			record.Suggestions = suggestions
		}
	}

	return &types.ResumeHistoryDetailResp{
		Code: 0,
		Msg:  "success",
		Data: &record,
	}, nil
}