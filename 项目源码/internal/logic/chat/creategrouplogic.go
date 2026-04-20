package chat

import (
	"context"
	"database/sql"
	"strings"
	"time"

	apperrors "career-api/common/errors"
	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type CreateGroupLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewCreateGroupLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateGroupLogic {
	return &CreateGroupLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *CreateGroupLogic) CreateGroup(req *types.CreateGroupReq) (*types.ChatGroup, error) {
	user, err := resolveCurrentUser(l.ctx)
	if err != nil {
		return nil, err
	}

	db, err := l.svcCtx.DB.RawDB()
	if err != nil {
		logx.Errorf("get db failed: %v", err)
		return nil, err
	}

	if req.PeerUserId <= 0 {
		return nil, &apperrors.CodeError{Code: apperrors.CodeInvalidParams, Msg: "peer user id is required"}
	}
	if strings.TrimSpace(req.PeerUserType) == "" {
		return nil, &apperrors.CodeError{Code: apperrors.CodeInvalidParams, Msg: "peer user type is required"}
	}
	peerUserType := normalizeUserType(req.PeerUserType)
	currentUserType := normalizeUserType(user.role)
	if req.PeerUserId == user.id && peerUserType == currentUserType {
		return nil, &apperrors.CodeError{Code: apperrors.CodeInvalidParams, Msg: "cannot create a chat group with yourself"}
	}

	schoolID := req.SchoolId
	if schoolID <= 0 {
		schoolID, err = getUserSchoolID(l.ctx, db, user.id)
		if err != nil {
			return nil, &apperrors.CodeError{Code: apperrors.CodeInvalidParams, Msg: "school not found"}
		}
	}

	if group, err := findDirectGroup(l.ctx, db, schoolID, user.id, currentUserType, req.PeerUserId, peerUserType); err == nil {
		return group, nil
	} else if err != sql.ErrNoRows {
		return nil, err
	}

	now := time.Now().Unix()
	groupName := strings.TrimSpace(req.Name)
	if groupName == "" {
		groupName = formatGroupName(user.name, req.PeerUserName)
	}

	tx, err := db.BeginTx(l.ctx, nil)
	if err != nil {
		logx.Errorf("begin tx failed: %v", err)
		return nil, err
	}
	defer func() {
		_ = tx.Rollback()
	}()

	result, err := tx.ExecContext(l.ctx,
		`INSERT INTO chat_groups (school_id, name, chat_type, created_by, created_at, updated_at)
		 VALUES (?, ?, 'direct', ?, ?, ?)`,
		schoolID, groupName, user.id, now, now)
	if err != nil {
		logx.Errorf("create group failed: %v", err)
		return nil, err
	}

	groupId, _ := result.LastInsertId()

	if _, err = tx.ExecContext(l.ctx,
		`INSERT INTO chat_group_members (group_id, user_id, user_type, role, joined_at)
		 VALUES (?, ?, ?, 'owner', ?)`,
		groupId, user.id, currentUserType, now); err != nil {
		logx.Errorf("create owner member failed: %v", err)
		return nil, err
	}

	if _, err = tx.ExecContext(l.ctx,
		`INSERT INTO chat_group_members (group_id, user_id, user_type, user_name, role, joined_at)
		 VALUES (?, ?, ?, ?, 'member', ?)`,
		groupId, req.PeerUserId, peerUserType, req.PeerUserName, now); err != nil {
		logx.Errorf("create peer member failed: %v", err)
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		logx.Errorf("commit create group tx failed: %v", err)
		return nil, err
	}

	return &types.ChatGroup{
		Id:        groupId,
		SchoolId:  schoolID,
		Name:      groupName,
		ChatType:  "direct",
		CreatedBy: user.id,
		CreatedAt: now,
		UpdatedAt: now,
	}, nil
}
