package student

import (
	"context"
	"encoding/json"

	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetResumeHistoryLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// Get resume parse history
func NewGetResumeHistoryLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetResumeHistoryLogic {
	return &GetResumeHistoryLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetResumeHistoryLogic) GetResumeHistory(req *types.ResumeHistoryListReq) (resp *types.ResumeHistoryListResultResp, err error) {
	userId, ok := l.ctx.Value("userId").(int64)
	if !ok {
		return &types.ResumeHistoryListResultResp{
			Code: 401,
			Msg:  "unauthorized",
		}, nil
	}

	historyList, total, err := l.svcCtx.ResumeParseHistoryModel.FindByUserId(l.ctx, userId, req.Page, req.PageSize)
	if err != nil {
		return &types.ResumeHistoryListResultResp{
			Code: 500,
			Msg:  "failed to get resume history",
		}, nil
	}

	records := make([]types.ResumeHistoryRecord, 0, len(historyList))
	for _, history := range historyList {
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

		records = append(records, record)
	}

	return &types.ResumeHistoryListResultResp{
		Code: 0,
		Msg:  "success",
		Data: &types.ResumeHistoryListResp{
			Total: total,
			List:  records,
		},
	}, nil
}