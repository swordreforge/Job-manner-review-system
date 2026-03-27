// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package student

import (
	"context"
	"database/sql"
	"encoding/json"
	"time"

	"career-api/internal/model"
	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type UpdateStudentLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// Update student profile
func NewUpdateStudentLogic(ctx context.Context, svcCtx *svc.ServiceContext) *UpdateStudentLogic {
	return &UpdateStudentLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *UpdateStudentLogic) UpdateStudent(req *types.UpdateStudentReq) (resp *types.StudentResp, err error) {
	// 验证 ID
	if req.Id <= 0 {
		return &types.StudentResp{
			Code: 400,
			Msg:  "invalid student id",
		}, nil
	}

	// 检查学生是否存在
	student, err := l.svcCtx.StudentModel.FindOne(l.ctx, req.Id)
	if err != nil {
		logx.Errorf("FindOne failed: %v", err)
		return &types.StudentResp{
			Code: 404,
			Msg:  "student profile not found",
		}, nil
	}

	// 验证权限：只能更新自己的资料
	userId, ok := l.ctx.Value("userId").(int64)
	if !ok || student.UserId != userId {
		return &types.StudentResp{
			Code: 403,
			Msg:  "forbidden",
		}, nil
	}

	// 计算完整度和竞争力
	completeness := l.calculateCompleteness(req)
	competitiveness := l.calculateCompetitiveness(req)

	// 序列化JSON字段
	skillsJSON, _ := json.Marshal(req.Skills)
	certificatesJSON, _ := json.Marshal(req.Certificates)
	softSkillsJSON, _ := json.Marshal(req.SoftSkills)
	internshipJSON, _ := json.Marshal(req.Internship)
	projectsJSON, _ := json.Marshal(req.Projects)

	// 更新学生资料
	updatedStudent := &model.Students{
		Id:                   req.Id,
		UserId:               student.UserId,
		Name:                 req.Name,
		Education:            sql.NullString{String: req.Education, Valid: req.Education != ""},
		Major:                sql.NullString{String: req.Major, Valid: req.Major != ""},
		GraduationYear:       sql.NullInt64{Int64: int64(req.GraduationYear), Valid: req.GraduationYear > 0},
		Skills:               sql.NullString{String: string(skillsJSON), Valid: len(req.Skills) > 0},
		Certificates:         sql.NullString{String: string(certificatesJSON), Valid: len(req.Certificates) > 0},
		SoftSkills:           sql.NullString{String: string(softSkillsJSON), Valid: true},
		Internship:           sql.NullString{String: string(internshipJSON), Valid: len(req.Internship) > 0},
		Projects:             sql.NullString{String: string(projectsJSON), Valid: len(req.Projects) > 0},
		CompletenessScore:    completeness,
		CompetitivenessScore: competitiveness,
		CreatedAt:            student.CreatedAt,
		UpdatedAt:            time.Now().Unix(),
	}

	err = l.svcCtx.StudentModel.Update(l.ctx, updatedStudent)
	if err != nil {
		logx.Errorf("Update student failed: %v", err)
		return &types.StudentResp{
			Code: 500,
			Msg:  "failed to update student profile",
		}, nil
	}

	// 查询更新后的学生资料
	studentInfo, err := l.svcCtx.StudentModel.FindOne(l.ctx, req.Id)
	if err != nil {
		logx.Errorf("FindOne failed: %v", err)
		return &types.StudentResp{
			Code: 500,
			Msg:  "failed to get student info",
		}, nil
	}

	logx.Infof("Updated student profile for: %s (id: %d)", req.Name, req.Id)

	return &types.StudentResp{
		Code: 0,
		Msg:  "success",
		Data: &types.StudentProfile{
			Id:              req.Id,
			UserId:          student.UserId,
			Name:            req.Name,
			Education:       req.Education,
			Major:           req.Major,
			GraduationYear:  req.GraduationYear,
			Skills:          req.Skills,
			Certificates:    req.Certificates,
			SoftSkills:      req.SoftSkills,
			Internship:      req.Internship,
			Projects:        req.Projects,
			Completeness:    completeness,
			Competitiveness: competitiveness,
			CreatedAt:       studentInfo.CreatedAt,
			UpdatedAt:       studentInfo.UpdatedAt,
		},
	}, nil
}

func (l *UpdateStudentLogic) calculateCompleteness(req *types.UpdateStudentReq) float64 {
	score := 0.0
	total := 7.0

	if req.Name != "" {
		score += 1
	}
	if req.Education != "" {
		score += 1
	}
	if req.Major != "" {
		score += 1
	}
	if len(req.Skills) > 0 {
		score += 1
	}
	if len(req.Certificates) > 0 {
		score += 1
	}
	if len(req.Internship) > 0 {
		score += 1
	}
	if len(req.Projects) > 0 {
		score += 1
	}

	return score / total * 100
}

func (l *UpdateStudentLogic) calculateCompetitiveness(req *types.UpdateStudentReq) float64 {
	score := 50.0

	if len(req.Skills) > 5 {
		score += 10
	}
	if len(req.Certificates) > 3 {
		score += 10
	}
	if len(req.Internship) > 1 {
		score += 15
	}
	if len(req.Projects) > 2 {
		score += 15
	}

	return score
}
