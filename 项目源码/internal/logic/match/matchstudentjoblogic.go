// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package match

import (
	"context"

	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type MatchStudentJobLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// Match student to single job
func NewMatchStudentJobLogic(ctx context.Context, svcCtx *svc.ServiceContext) *MatchStudentJobLogic {
	return &MatchStudentJobLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *MatchStudentJobLogic) MatchStudentJob(req *types.MatchReq) (resp *types.MatchResultResp, err error) {
	// todo: add your logic here and delete this line

	return
}
