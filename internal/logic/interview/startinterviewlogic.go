// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package interview

import (
	"context"

	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type StartInterviewLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// Start interview session
func NewStartInterviewLogic(ctx context.Context, svcCtx *svc.ServiceContext) *StartInterviewLogic {
	return &StartInterviewLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *StartInterviewLogic) StartInterview(req *types.StartInterviewReq) (resp *types.InterviewResp, err error) {
	// todo: add your logic here and delete this line

	return
}
