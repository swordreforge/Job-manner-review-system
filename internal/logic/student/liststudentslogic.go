// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package student

import (
	"context"

	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListStudentsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// List student profiles
func NewListStudentsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListStudentsLogic {
	return &ListStudentsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ListStudentsLogic) ListStudents(req *types.StudentListReq) (resp *types.StudentListResultResp, err error) {
	// todo: add your logic here and delete this line

	return
}
