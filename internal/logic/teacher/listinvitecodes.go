package teacher

import (
	"context"

	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type ListInviteCodesLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewListInviteCodesLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ListInviteCodesLogic {
	return &ListInviteCodesLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ListInviteCodesLogic) ListInviteCodes(req *types.ListInviteCodesReq) (*types.ListInviteCodesResp, error) {
	schoolId := int64(1)
	teacherId := int64(1)

	if v, ok := l.ctx.Value("schoolId").(int64); ok && v > 0 {
		schoolId = v
	}
	if v, ok := l.ctx.Value("teacherId").(int64); ok && v > 0 {
		teacherId = v
	}

	// If context doesn't have teacherId, get from database
	if teacherId == 1 && schoolId > 0 {
		db, err := l.svcCtx.DB.RawDB()
		if err == nil {
			db.QueryRowContext(l.ctx, "SELECT id FROM teachers WHERE school_id = ? LIMIT 1", schoolId).Scan(&teacherId)
		}
	}

	page := 1
	pageSize := 10
	if req.Page > 0 {
		page = req.Page
	}
	if req.PageSize > 0 {
		pageSize = req.PageSize
	}
	offset := (page - 1) * pageSize

	db, err := l.svcCtx.DB.RawDB()
	if err != nil {
		logx.Errorf("get raw db failed: %v", err)
		return &types.ListInviteCodesResp{}, err
	}

	query := "SELECT id, code, type, max_uses, used_count, status, expires_at, created_at FROM invite_codes WHERE school_id = ? AND teacher_id = ?"
	args := []interface{}{schoolId, teacherId}

	if req.Status != "" {
		query += " AND status = ?"
		args = append(args, req.Status)
	}

	query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
	args = append(args, pageSize, offset)

	rows, err := db.QueryContext(l.ctx, query, args...)
	if err != nil {
		logx.Errorf("query invite codes failed: %v", err)
		return &types.ListInviteCodesResp{}, err
	}
	defer rows.Close()

	var list []types.InviteCodeInfo
	for rows.Next() {
		var info types.InviteCodeInfo
		if err := rows.Scan(&info.Id, &info.Code, &info.Type, &info.MaxUses, &info.UsedCount, &info.Status, &info.ExpiresAt, &info.CreatedAt); err != nil {
			logx.Errorf("scan invite code failed: %v", err)
			continue
		}
		list = append(list, info)
	}
	_ = rows.Err()

	var total int
	countQuery := "SELECT COUNT(*) FROM invite_codes WHERE school_id = ? AND teacher_id = ?"
	countArgs := []interface{}{schoolId, teacherId}
	if req.Status != "" {
		countQuery += " AND status = ?"
		countArgs = append(countArgs, req.Status)
	}
	err = db.QueryRowContext(l.ctx, countQuery, countArgs...).Scan(&total)
	if err != nil {
		logx.Errorf("count invite codes failed: %v", err)
	}

	return &types.ListInviteCodesResp{
		Total: total,
		List:  list,
	}, nil
}
