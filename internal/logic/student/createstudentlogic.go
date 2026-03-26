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

type CreateStudentLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// Create student profile
func NewCreateStudentLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateStudentLogic {
	return &CreateStudentLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *CreateStudentLogic) CreateStudent(req *types.CreateStudentReq) (resp *types.StudentResp, err error) {
	if req.Name == "" {
		return &types.StudentResp{
			Code: 400,
			Msg:  "name is required",
		}, nil
	}

	userId, ok := l.ctx.Value("userId").(int64)
	if !ok {
		return &types.StudentResp{
			Code: 401,
			Msg:  "unauthorized",
		}, nil
	}

	completeness := l.calculateCompleteness(req)
	competitiveness := l.calculateCompetitiveness(req)

	// 序列化JSON字段
	skillsJSON, _ := json.Marshal(req.Skills)
	certificatesJSON, _ := json.Marshal(req.Certificates)
	softSkillsJSON, _ := json.Marshal(req.SoftSkills)
	internshipJSON, _ := json.Marshal(req.Internship)
	projectsJSON, _ := json.Marshal(req.Projects)

	// 创建学生档案
	student := &model.Students{
		UserId:               userId,
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
		CreatedAt:            time.Now().Unix(),
		UpdatedAt:            time.Now().Unix(),
	}

	result, err := l.svcCtx.StudentModel.Insert(l.ctx, student)
	if err != nil {
		logx.Errorf("Insert student failed: %v", err)
		return &types.StudentResp{
			Code: 500,
			Msg:  "failed to create student profile",
		}, nil
	}

	studentId, err := result.LastInsertId()
	if err != nil {
		logx.Errorf("Get last insert id failed: %v", err)
		return &types.StudentResp{
			Code: 500,
			Msg:  "failed to get student id",
		}, nil
	}

	// 查询学生档案以获取完整数据
	studentInfo, err := l.svcCtx.StudentModel.FindOne(l.ctx, studentId)
	if err != nil {
		logx.Errorf("FindOne failed: %v", err)
		return &types.StudentResp{
			Code: 500,
			Msg:  "failed to get student info",
		}, nil
	}

	logx.Infof("Created student profile for: %s (id: %d)", req.Name, studentId)

	return &types.StudentResp{
		Code: 0,
		Msg:  "success",
		Data: &types.StudentProfile{
			Id:              studentId,
			UserId:          userId,
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

func (l *CreateStudentLogic) calculateCompleteness(req *types.CreateStudentReq) float64 {
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

func (l *CreateStudentLogic) calculateCompetitiveness(req *types.CreateStudentReq) float64 {
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
