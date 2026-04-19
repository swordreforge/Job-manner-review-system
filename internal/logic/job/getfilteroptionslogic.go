package job

import (
	"context"

	"career-api/common/errors"
	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetFilterOptionsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetFilterOptionsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetFilterOptionsLogic {
	return &GetFilterOptionsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetFilterOptionsLogic) GetFilterOptions() (*types.JobFilterOptionsResp, error) {
	industries, companyScales, locations, err := l.svcCtx.JobModel.GetFilterOptions(l.ctx)
	if err != nil {
		logx.Errorf("GetFilterOptions failed: %v", err)
		return &types.JobFilterOptionsResp{
			Code: errors.CodeInternalError,
			Msg:  "获取筛选选项失败",
		}, nil
	}

	if industries == nil {
		industries = []string{}
	}
	if companyScales == nil {
		companyScales = []string{}
	}
	if locations == nil {
		locations = []string{}
	}

	return &types.JobFilterOptionsResp{
		Code:          errors.CodeSuccess,
		Msg:           "success",
		Industries:    industries,
		CompanyScales: companyScales,
		Locations:     locations,
	}, nil
}