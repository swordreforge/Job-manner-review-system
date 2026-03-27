// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package interview

import (
	"context"

	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetInterviewHistoryLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// Get interview history
func NewGetInterviewHistoryLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetInterviewHistoryLogic {
	return &GetInterviewHistoryLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetInterviewHistoryLogic) GetInterviewHistory() (resp *types.InterviewHistoryListResp, err error) {
	// todo: add your logic here and delete this line

	return
}
