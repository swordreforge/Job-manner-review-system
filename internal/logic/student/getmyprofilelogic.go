// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package student

import (
	"context"
	"encoding/json"

	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetMyProfileLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// Get current student profile
func NewGetMyProfileLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetMyProfileLogic {
	return &GetMyProfileLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetMyProfileLogic) GetMyProfile() (resp *types.StudentResp, err error) {
	userId, ok := l.ctx.Value("userId").(int64)
	if !ok {
		return &types.StudentResp{
			Code: 401,
			Msg:  "unauthorized",
		}, nil
	}

	student, err := l.svcCtx.StudentModel.FindOneByUserId(l.ctx, userId)
	if err != nil {
		return &types.StudentResp{
			Code: 404,
			Msg:  "student profile not found",
		}, nil
	}

	// 反序列化JSON字段
	var skills []types.StudentSkill
	var certificates []types.StudentCert
	var softSkills types.SoftSkills
	var internship []types.Internship
	var projects []types.Project

	if student.Skills.Valid {
		json.Unmarshal([]byte(student.Skills.String), &skills)
	}
	if student.Certificates.Valid {
		json.Unmarshal([]byte(student.Certificates.String), &certificates)
	}
	if student.SoftSkills.Valid {
		json.Unmarshal([]byte(student.SoftSkills.String), &softSkills)
	}
	if student.Internship.Valid {
		json.Unmarshal([]byte(student.Internship.String), &internship)
	}
	if student.Projects.Valid {
		json.Unmarshal([]byte(student.Projects.String), &projects)
	}

	graduationYear := 0
	if student.GraduationYear.Valid {
		graduationYear = int(student.GraduationYear.Int64)
	}

	return &types.StudentResp{
		Code: 0,
		Msg:  "success",
		Data: &types.StudentProfile{
			Id:              student.Id,
			UserId:          student.UserId,
			Name:            student.Name,
			Education:       student.Education.String,
			Major:           student.Major.String,
			GraduationYear:  graduationYear,
			Skills:          skills,
			Certificates:    certificates,
			SoftSkills:      softSkills,
			Internship:      internship,
			Projects:        projects,
			Completeness:    student.CompletenessScore,
			Competitiveness: student.CompetitivenessScore,
			CreatedAt:       student.CreatedAt,
			UpdatedAt:       student.UpdatedAt,
		},
	}, nil
}
