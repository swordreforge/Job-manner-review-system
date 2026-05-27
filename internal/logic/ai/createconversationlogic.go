package ai

import (
	"context"
	"database/sql"

	apperrors "career-api/common/errors"
	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type CreateAIConversationLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewCreateAIConversationLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateAIConversationLogic {
	return &CreateAIConversationLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *CreateAIConversationLogic) CreateAIConversation(req *types.CreateAIConversationReq) (*types.AIConversation, error) {
	user, err := resolveCurrentUser(l.ctx)
	if err != nil {
		return nil, err
	}

	db, err := getDB(l.ctx, l.svcCtx)
	if err != nil {
		return nil, err
	}

	schoolID, _ := getUserSchoolID(l.ctx, db, user.id)

	name := req.Name
	chatType := req.ChatType
	if chatType == "" {
		chatType = "ai_assistant"
	}
	if chatType != "ai_assistant" && chatType != "interview_review" {
		chatType = "ai_assistant"
	}

	if name == "" {
		if chatType == "interview_review" {
			mode := req.Mode
			if mode == "" {
				mode = "practice"
			}
			if mode == "assessment" {
				name = "国企综合面"
			} else {
				name = "大厂技术面"
			}
		} else {
			name = "新对话"
		}
	}

	now := nowUnix()

	result, err := db.ExecContext(l.ctx,
		`INSERT INTO chat_groups (school_id, name, chat_type, created_by, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?)`,
		schoolID, name, chatType, user.id, now, now)
	if err != nil {
		logx.Errorf("create AI conversation failed: %v", err)
		return nil, &apperrors.CodeError{Code: apperrors.CodeInternalError, Msg: "创建对话失败"}
	}

	groupId, _ := result.LastInsertId()

	_, err = db.ExecContext(l.ctx,
		`INSERT INTO chat_group_members (group_id, user_id, user_type, user_name, role, joined_at)
		 VALUES (?, ?, ?, ?, 'owner', ?)`,
		groupId, user.id, normalizeUserType(user.role), user.name, now)
	if err != nil {
		logx.Errorf("create AI conversation member failed: %v", err)
	}

	var interviewSessionId int64

	if chatType == "interview_review" {
		mode := req.Mode
		if mode == "" {
			mode = "practice"
		}

		runningSession, err := l.svcCtx.InterviewSessionsModel.FindRunningByUserId(l.ctx, user.id)
		if err == nil && runningSession != nil {
			interviewSessionId = runningSession.Id

			_, _ = db.ExecContext(l.ctx,
				`INSERT INTO chat_messages (group_id, sender_id, sender_type, sender_name, content, created_at)
				 VALUES (?, 0, 'assistant', '面试官', ?, ?)`,
				groupId, "请先做一个简单的自我介绍", now)
		} else {
			sessionResult, err := db.ExecContext(l.ctx,
				`INSERT INTO interview_sessions (user_id, mode, status, total_questions, current_question, average_score, max_score, min_score, duration_seconds, created_at, updated_at)
				 VALUES (?, ?, 'running', 0, 0, 0, 0, 0, 0, ?, ?)`,
				user.id, mode, now, now)
			if err != nil {
				logx.Errorf("create interview session failed: %v", err)
			} else {
				interviewSessionId, _ = sessionResult.LastInsertId()

				firstQuestion := "请先做一个简单的自我介绍"
				_, _ = db.ExecContext(l.ctx,
					`INSERT INTO chat_messages (group_id, sender_id, sender_type, sender_name, content, created_at)
					 VALUES (?, 0, 'assistant', '面试官', ?, ?)`,
					groupId, firstQuestion, now)
			}
		}

		if interviewSessionId > 0 {
			_, err = db.ExecContext(l.ctx,
				`UPDATE chat_groups SET interview_session_id = ? WHERE id = ?`,
				interviewSessionId, groupId)
			if err != nil {
				logx.Errorf("update chat_groups interview_session_id failed: %v", err)
			}
		}
	}

	conversation := &types.AIConversation{
		Id:                  groupId,
		SchoolId:           schoolID,
		Name:               name,
		ChatType:           chatType,
		InterviewSessionId: interviewSessionId,
		CreatedBy:          user.id,
		CreatedAt:          now,
		UpdatedAt:          now,
	}

	if chatType == "interview_review" {
		conversation.InterviewSessionId = interviewSessionId
	}

	return conversation, nil
}

func (l *CreateAIConversationLogic) getInterviewSessionId(db *sql.DB, groupId int64) (int64, error) {
	var id sql.NullInt64
	err := db.QueryRowContext(l.ctx,
		`SELECT interview_session_id FROM chat_groups WHERE id = ?`,
		groupId).Scan(&id)
	if err != nil {
		return 0, err
	}
	if !id.Valid {
		return 0, nil
	}
	return id.Int64, nil
}