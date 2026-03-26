// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package match

import (
	"context"

	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetMatchScoreLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// Get match score for a job
func NewGetMatchScoreLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetMatchScoreLogic {
	return &GetMatchScoreLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetMatchScoreLogic) GetMatchScore() (resp *types.MatchScoreResp, err error) {
	// todo: add your logic here and delete this line

	return
}
