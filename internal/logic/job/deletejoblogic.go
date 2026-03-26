// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package job

import (
	"context"

	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type DeleteJobLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// Delete job profile
func NewDeleteJobLogic(ctx context.Context, svcCtx *svc.ServiceContext) *DeleteJobLogic {
	return &DeleteJobLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *DeleteJobLogic) DeleteJob() (resp *types.JobResp, err error) {
	// todo: add your logic here and delete this line

	return
}
