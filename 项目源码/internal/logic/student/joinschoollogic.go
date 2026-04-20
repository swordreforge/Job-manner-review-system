package student

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type JoinSchoolLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewJoinSchoolLogic(ctx context.Context, svcCtx *svc.ServiceContext) *JoinSchoolLogic {
	return &JoinSchoolLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *JoinSchoolLogic) JoinSchool(req *types.JoinSchoolReq) (*types.JoinSchoolResp, error) {
	db, err := l.svcCtx.DB.RawDB()
	if err != nil {
		logx.Errorf("get raw db failed: %v", err)
		return &types.JoinSchoolResp{
			Code: 500,
			Msg:  "database error",
		}, nil
	}

	userId, ok := l.ctx.Value("userId").(int64)
	if !ok || userId == 0 {
		return &types.JoinSchoolResp{
			Code: 401,
			Msg:  "not logged in",
		}, nil
	}

	student, err := l.svcCtx.StudentModel.FindOneByUserId(l.ctx, userId)
	if err != nil {
		return &types.JoinSchoolResp{
			Code: 400,
			Msg:  "student profile not found",
		}, nil
	}

	studentId := student.Id

	var codeId, schoolId, teacherId int64
	var maxUses, usedCount int
	var status string
	var expiresAt int64

	err = db.QueryRowContext(l.ctx,
		"SELECT id, school_id, teacher_id, status, expires_at, max_uses, used_count FROM invite_codes WHERE code = ?",
		req.InviteCode).Scan(&codeId, &schoolId, &teacherId, &status, &expiresAt, &maxUses, &usedCount)

	if err != nil {
		return &types.JoinSchoolResp{
			Code: 400,
			Msg:  "invalid invite code",
		}, nil
	}

	if status != "active" {
		return &types.JoinSchoolResp{
			Code: 400,
			Msg:  "invite code is not active",
		}, nil
	}

	if expiresAt > 0 && expiresAt < time.Now().Unix() {
		return &types.JoinSchoolResp{
			Code: 400,
			Msg:  "invite code has expired",
		}, nil
	}

	if usedCount >= maxUses {
		return &types.JoinSchoolResp{
			Code: 400,
			Msg:  "invite code has reached max uses",
		}, nil
	}

	var schoolName string
	err = db.QueryRowContext(l.ctx, "SELECT name FROM schools WHERE id = ?", schoolId).Scan(&schoolName)
	if err != nil {
		schoolName = "未知学校"
	}

	now := time.Now().Unix()

	if req.Name != "" {
		_, err = db.ExecContext(l.ctx, "UPDATE students SET name = ?, updated_at = ? WHERE id = ?", req.Name, now, studentId)
		if err != nil {
			logx.Errorf("update student name failed: %v", err)
		}
	}

	_, err = db.ExecContext(l.ctx,
		"INSERT INTO student_schools (student_id, school_id, teacher_id, invite_code_id, status, joined_at, created_at, updated_at) VALUES (?, ?, ?, ?, 'active', ?, ?, ?)",
		studentId, schoolId, teacherId, codeId, now, now, now)
	if err != nil {
		logx.Errorf("insert student_schools failed: %v, studentId=%d, schoolId=%d, teacherId=%d, codeId=%d", err, studentId, schoolId, teacherId, codeId)
		return &types.JoinSchoolResp{
			Code: 500,
			Msg:  "failed to join school",
		}, nil
	}

	_, err = db.ExecContext(l.ctx,
		"UPDATE invite_codes SET used_count = used_count + 1 WHERE id = ?",
		codeId)
	if err != nil {
		logx.Errorf("increment invite code usage failed: %v", err)
	}

	studentName := req.Name
	if studentName == "" {
		studentName = student.Name
	}

	if err := l.createChatGroups(schoolId, studentId, studentName); err != nil {
		logx.Errorf("create chat groups failed: %v", err)
	}

	return &types.JoinSchoolResp{
		Code: 0,
		Msg:  "success",
		Data: &types.JoinSchoolData{
			SchoolId:   schoolId,
			SchoolName: schoolName,
			JoinedAt:   now,
		},
	}, nil
}

	func (l *JoinSchoolLogic) createChatGroups(schoolId, studentId int64, studentName string) error {
		db, err := l.svcCtx.DB.RawDB()
		if err != nil {
			return err
		}

		rows, err := db.QueryContext(l.ctx, `
			SELECT t.user_id, t.name
			FROM teachers t
			WHERE t.school_id = ? AND t.status = 'active'
			ORDER BY t.id ASC
		`, schoolId)
		if err != nil {
			return err
		}
		defer rows.Close()

		type teacherInfo struct {
			userID int64
			name   string
		}
		teachers := make([]teacherInfo, 0)
		for rows.Next() {
			var teacher teacherInfo
			if err := rows.Scan(&teacher.userID, &teacher.name); err != nil {
				continue
			}
			teachers = append(teachers, teacher)
		}

		now := time.Now().Unix()
		for _, teacher := range teachers {
			var existingID int64
			err := db.QueryRowContext(l.ctx, `
				SELECT g.id
				FROM chat_groups g
				JOIN chat_group_members m1 ON g.id = m1.group_id
				JOIN chat_group_members m2 ON g.id = m2.group_id
				WHERE g.school_id = ? AND g.chat_type = 'direct'
				  AND m1.user_id = ? AND m1.user_type = 'student'
				  AND m2.user_id = ? AND m2.user_type = 'teacher'
				LIMIT 1
			`, schoolId, studentId, teacher.userID).Scan(&existingID)
			if err == nil && existingID > 0 {
				continue
			}
			if err != nil && err != sql.ErrNoRows {
				logx.Errorf("query existing chat group failed: %v", err)
				continue
			}

			tx, err := db.BeginTx(l.ctx, nil)
			if err != nil {
				return err
			}

			groupName := fmt.Sprintf("%s & %s", studentName, teacher.name)
			result, err := tx.ExecContext(l.ctx, `
				INSERT INTO chat_groups (school_id, name, chat_type, created_by, created_at, updated_at)
				VALUES (?, ?, 'direct', ?, ?, ?)
			`, schoolId, groupName, teacher.userID, now, now)
			if err != nil {
				_ = tx.Rollback()
				logx.Errorf("insert chat group failed: %v", err)
				continue
			}

			groupID, _ := result.LastInsertId()
			if _, err := tx.ExecContext(l.ctx, `
				INSERT INTO chat_group_members (group_id, user_id, user_type, user_name, role, joined_at)
				VALUES (?, ?, 'student', ?, 'member', ?)
			`, groupID, studentId, studentName, now); err != nil {
				_ = tx.Rollback()
				logx.Errorf("insert student group member failed: %v", err)
				continue
			}
			if _, err := tx.ExecContext(l.ctx, `
				INSERT INTO chat_group_members (group_id, user_id, user_type, user_name, role, joined_at)
				VALUES (?, ?, 'teacher', ?, 'owner', ?)
			`, groupID, teacher.userID, teacher.name, now); err != nil {
				_ = tx.Rollback()
				logx.Errorf("insert teacher group member failed: %v", err)
				continue
			}

			if err := tx.Commit(); err != nil {
				logx.Errorf("commit chat group failed: %v", err)
				continue
			}
		}

		return nil
	}
