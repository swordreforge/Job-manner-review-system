package teacher

import (
	"context"
	"crypto/rand"
	"fmt"
	"math/big"
	"time"

	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type CreateInviteCodeLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewCreateInviteCodeLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateInviteCodeLogic {
	return &CreateInviteCodeLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *CreateInviteCodeLogic) CreateInviteCode(req *types.CreateInviteCodeReq) (*types.CreateInviteCodeResp, error) {
	teacherId := int64(1)
	schoolId := int64(1)

	if v, ok := l.ctx.Value("schoolId").(int64); ok && v > 0 {
		schoolId = v
	}
	if v, ok := l.ctx.Value("teacherId").(int64); ok && v > 0 {
		teacherId = v
	}

	// If context doesn't have teacherId, look up from database using userId
	if teacherId == 1 {
		userId, ok := l.ctx.Value("userId").(int64)
		if ok && userId > 0 {
			db2, err := l.svcCtx.DB.RawDB()
			if err == nil {
				db2.QueryRowContext(l.ctx, "SELECT id FROM teachers WHERE user_id = ?", userId).Scan(&teacherId)
			}
		} else if schoolId > 0 {
			db2, err := l.svcCtx.DB.RawDB()
			if err == nil {
				db2.QueryRowContext(l.ctx, "SELECT id FROM teachers WHERE school_id = ? LIMIT 1", schoolId).Scan(&teacherId)
			}
		}
	}

	db, err := l.svcCtx.DB.RawDB()
	if err != nil {
		logx.Errorf("get raw db failed: %v", err)
		return &types.CreateInviteCodeResp{}, err
	}

	var schoolCode string
	err = db.QueryRowContext(l.ctx, "SELECT code FROM schools WHERE id = ?", schoolId).Scan(&schoolCode)
	if err != nil {
		logx.Errorf("get school code failed: %v", err)
		return &types.CreateInviteCodeResp{}, err
	}

	now := time.Now()
	dateStr := now.Format("060102")
	randomNum, _ := rand.Int(rand.Reader, big.NewInt(10000))
	code := fmt.Sprintf("%s-%s-%04d", schoolCode, dateStr, randomNum.Int64())

	maxUses := 100
	if req.MaxUses > 0 {
		maxUses = req.MaxUses
	}

	expiresIn := 30
	if req.ExpiresIn > 0 {
		expiresIn = req.ExpiresIn
	}
	expiresAt := now.AddDate(0, 0, expiresIn).Unix()

	inviteType := "student"
	if req.Type != "" {
		inviteType = req.Type
	}

	_, err = db.ExecContext(l.ctx,
		`INSERT INTO invite_codes (code, school_id, teacher_id, type, max_uses, used_count, status, expires_at, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, 0, 'active', ?, ?, ?)`,
		code, schoolId, teacherId, inviteType, maxUses, expiresAt, now.Unix(), now.Unix())
	if err != nil {
		logx.Errorf("insert invite code failed: %v", err)
		return &types.CreateInviteCodeResp{}, err
	}

	return &types.CreateInviteCodeResp{
		Code:      code,
		MaxUses:   maxUses,
		UsedCount: 0,
		ExpiresAt: expiresAt,
		CreatedAt: now.Unix(),
	}, nil
}
