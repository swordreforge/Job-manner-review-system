package chat

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"sync"
	"time"

	apperrors "career-api/common/errors"
	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type currentUser struct {
	id   int64
	role string
	name string
}

func resolveCurrentUser(ctx context.Context) (currentUser, error) {
	userID, ok := ctx.Value("userId").(int64)
	if !ok || userID <= 0 {
		return currentUser{}, &apperrors.CodeError{Code: apperrors.CodeUnauthorized, Msg: "unauthorized"}
	}

	role, _ := ctx.Value("role").(string)
	if role == "" {
		role = "student"
	}

	name, _ := ctx.Value("userName").(string)
	if name == "" {
		name = "用户"
	}

	return currentUser{id: userID, role: role, name: name}, nil
}

func rawDB(ctx context.Context, svcCtx *svc.ServiceContext) (*sql.DB, error) {
	db, err := svcCtx.DB.RawDB()
	if err != nil {
		logx.Errorf("get db failed: %v", err)
		return nil, err
	}
	return db, nil
}

func normalizeUserType(role string) string {
	switch strings.ToLower(role) {
	case "teacher":
		return "teacher"
	default:
		return "student"
	}
}

func nowUnix() int64 {
	return time.Now().Unix()
}

func formatGroupName(leftName, rightName string) string {
	leftName = strings.TrimSpace(leftName)
	rightName = strings.TrimSpace(rightName)
	if leftName == "" {
		leftName = "成员A"
	}
	if rightName == "" {
		rightName = "成员B"
	}
	return fmt.Sprintf("%s & %s", leftName, rightName)
}

func isCodeError(err error, code int) bool {
	if err == nil {
		return false
	}
	codeErr, ok := err.(*apperrors.CodeError)
	return ok && codeErr.Code == code
}

func getUserSchoolID(ctx context.Context, db *sql.DB, userID int64) (int64, error) {
	var schoolID sql.NullInt64
	if err := db.QueryRowContext(ctx, `SELECT school_id FROM users WHERE id = ? LIMIT 1`, userID).Scan(&schoolID); err != nil {
		return 0, err
	}
	if !schoolID.Valid || schoolID.Int64 <= 0 {
		return 0, errors.New("school not found")
	}
	return schoolID.Int64, nil
}

func findDirectGroup(ctx context.Context, db *sql.DB, schoolID, leftUserID int64, leftUserType string, rightUserID int64, rightUserType string) (*types.ChatGroup, error) {
	row := db.QueryRowContext(ctx, `
		SELECT g.id, g.school_id, g.name, g.chat_type, g.created_by, g.created_at, g.updated_at
		FROM chat_groups g
		JOIN chat_group_members m1 ON g.id = m1.group_id
		JOIN chat_group_members m2 ON g.id = m2.group_id
		WHERE g.school_id = ?
		  AND g.chat_type = 'direct'
		  AND m1.user_id = ? AND m1.user_type = ?
		  AND m2.user_id = ? AND m2.user_type = ?
		LIMIT 1
	`, schoolID, leftUserID, leftUserType, rightUserID, rightUserType)

	var group types.ChatGroup
	if err := row.Scan(&group.Id, &group.SchoolId, &group.Name, &group.ChatType, &group.CreatedBy, &group.CreatedAt, &group.UpdatedAt); err != nil {
		return nil, err
	}
	return &group, nil
}

func loadChatGroup(ctx context.Context, db *sql.DB, groupID int64) (*types.ChatGroup, error) {
	row := db.QueryRowContext(ctx, `
		SELECT id, school_id, name, chat_type, created_by, created_at, updated_at
		FROM chat_groups
		WHERE id = ?
		LIMIT 1
	`, groupID)

	var group types.ChatGroup
	if err := row.Scan(&group.Id, &group.SchoolId, &group.Name, &group.ChatType, &group.CreatedBy, &group.CreatedAt, &group.UpdatedAt); err != nil {
		return nil, err
	}
	return &group, nil
}

func loadGroupForMember(ctx context.Context, db *sql.DB, groupID, userID int64, userType string) (*types.ChatGroup, error) {
	row := db.QueryRowContext(ctx, `
		SELECT g.id, g.school_id, g.name, g.chat_type, g.created_by, g.created_at, g.updated_at,
		       COALESCE((SELECT cm.content FROM chat_messages cm WHERE cm.group_id = g.id ORDER BY cm.created_at DESC, cm.id DESC LIMIT 1), '') AS last_message,
		       COALESCE((SELECT COUNT(1)
		                FROM chat_messages cm
		                WHERE cm.group_id = g.id
		                  AND cm.sender_id <> ?
		                  AND cm.created_at > COALESCE(m.last_read_at, 0)), 0) AS unread_count
		FROM chat_groups g
		JOIN chat_group_members m ON g.id = m.group_id
		WHERE g.id = ? AND m.user_id = ? AND m.user_type = ?
		LIMIT 1
	`, userID, groupID, userID, userType)

	var group types.ChatGroup
	if err := row.Scan(&group.Id, &group.SchoolId, &group.Name, &group.ChatType, &group.CreatedBy, &group.CreatedAt, &group.UpdatedAt, &group.LastMessage, &group.UnreadCount); err != nil {
		return nil, err
	}
	return &group, nil
}

func groupHasMember(ctx context.Context, db *sql.DB, groupID, userID int64, userType string) (bool, error) {
	var count int64
	if err := db.QueryRowContext(ctx, `
		SELECT COUNT(1)
		FROM chat_group_members
		WHERE group_id = ? AND user_id = ? AND user_type = ?
	`, groupID, userID, userType).Scan(&count); err != nil {
		return false, err
	}
	return count > 0, nil
}

func broadcastChatMessage(groupID int64, message types.ChatMessage) {
	defaultChatHub.Publish(groupID, message)
}

func uniqueMembers(groupID int64, members []types.ChatGroupMember) []types.ChatGroupMember {
	result := make([]types.ChatGroupMember, 0, len(members))
	seen := make(map[string]struct{})
	for _, member := range members {
		key := fmt.Sprintf("%d:%s", member.UserId, member.UserType)
		if _, ok := seen[key]; ok {
			continue
		}
		seen[key] = struct{}{}
		member.GroupId = groupID
		result = append(result, member)
	}
	return result
}

type chatHub struct {
	mu   sync.RWMutex
	subs map[int64]map[chan types.ChatMessage]struct{}
}

func newChatHub() *chatHub {
	return &chatHub{subs: make(map[int64]map[chan types.ChatMessage]struct{})}
}

var defaultChatHub = newChatHub()

func (h *chatHub) Subscribe(groupID int64) (chan types.ChatMessage, func()) {
	ch := make(chan types.ChatMessage, 16)

	h.mu.Lock()
	defer h.mu.Unlock()
	if _, ok := h.subs[groupID]; !ok {
		h.subs[groupID] = make(map[chan types.ChatMessage]struct{})
	}
	h.subs[groupID][ch] = struct{}{}

	return ch, func() {
		h.mu.Lock()
		defer h.mu.Unlock()
		if subscribers, ok := h.subs[groupID]; ok {
			if _, exists := subscribers[ch]; exists {
				delete(subscribers, ch)
				close(ch)
			}
			if len(subscribers) == 0 {
				delete(h.subs, groupID)
			}
		}
	}
}

func (h *chatHub) Publish(groupID int64, message types.ChatMessage) {
	h.mu.RLock()
	subscribers := h.subs[groupID]
	h.mu.RUnlock()

	for ch := range subscribers {
		select {
		case ch <- message:
		default:
		}
	}
}

func (h *chatHub) HasSubscribers(groupID int64) bool {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.subs[groupID]) > 0
}
