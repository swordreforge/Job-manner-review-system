// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package job

import (
	"context"

	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type UpdateJobLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// Update job profile
func NewUpdateJobLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UpdateJobLogic {
	return &UpdateJobLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *UpdateJobLogic) UpdateJob(req *types.UpdateJobReq) (resp *types.JobResp, err error) {
	// todo: add your logic here and delete this line

	return
}
