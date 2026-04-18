package model

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

var _ JobsModel = (*customJobsModel)(nil)

type (
	// JobsModel is an interface to be customized, add more methods here,
	// and implement the added methods in customJobsModel.
	JobsModel interface {
		jobsModel
		withSession(session sqlx.Session) JobsModel
		FindAll(ctx context.Context, page, pageSize int, industry, category string) ([]*Jobs, int64, error)
		Search(ctx context.Context, req *JobSearchReq) ([]*Jobs, int64, error)
	}

	JobSearchReq struct {
		Page            int    `json:"page"`
		PageSize        int    `json:"pageSize"`
		Keyword         string `json:"keyword"`
		Industry        string `json:"industry"`
		Category        string `json:"category"`
		Location        string `json:"location"`
		CompanyScale    string `json:"companyScale"`
		SalaryMin       int    `json:"salaryMin"`
		SalaryMax       int    `json:"salaryMax"`
	}

	customJobsModel struct {
		*defaultJobsModel
	}
)

// NewJobsModel returns a model for the database table.
func NewJobsModel(conn sqlx.SqlConn) JobsModel {
	return &customJobsModel{
		defaultJobsModel: newJobsModel(conn),
	}
}

func (m *customJobsModel) withSession(session sqlx.Session) JobsModel {
	return NewJobsModel(sqlx.NewSqlConnFromSession(session))
}

// FindAll 分页查询职位列表，支持按industry和category过滤
func (m *customJobsModel) FindAll(ctx context.Context, page, pageSize int, industry, category string) ([]*Jobs, int64, error) {
	// 构建查询条件
	conditions := []string{}
	args := []interface{}{}

	if industry != "" {
		conditions = append(conditions, "`industry` = ?")
		args = append(args, industry)
	}

	if category != "" {
		conditions = append(conditions, "`category` = ?")
		args = append(args, category)
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = "where " + strings.Join(conditions, " and ")
	}

	// 查询总数
	countQuery := fmt.Sprintf("select count(*) from %s %s", m.table, whereClause)
	var total int64
	err := m.conn.QueryRowCtx(ctx, &total, countQuery, args...)
	if err != nil {
		return nil, 0, err
	}

	// 查询数据
	offset := (page - 1) * pageSize
	query := fmt.Sprintf("select %s from %s %s order by `created_at` desc limit ? offset ?", jobsRows, m.table, whereClause)
	args = append(args, pageSize, offset)

	var resp []*Jobs
	err = m.conn.QueryRowsCtx(ctx, &resp, query, args...)
	if err != nil {
		return nil, 0, err
	}

	return resp, total, nil
}

// Search 高级搜索分页查询
func (m *customJobsModel) Search(ctx context.Context, req *JobSearchReq) ([]*Jobs, int64, error) {
	conditions := []string{}
	args := []interface{}{}

	// 关键词搜索 (岗位名、公司名、行业)
	if req.Keyword != "" {
		conditions = append(conditions, "(`name` LIKE ? OR `company` LIKE ? OR `industry` LIKE ?)")
		keyword := "%" + req.Keyword + "%"
		args = append(args, keyword, keyword, keyword)
	}

	// 行业筛选
	if req.Industry != "" {
		conditions = append(conditions, "`industry` LIKE ?")
		args = append(args, "%"+req.Industry+"%")
	}

	// 分类筛选
	if req.Category != "" {
		conditions = append(conditions, "`category` = ?")
		args = append(args, req.Category)
	}

	// 地点筛选 (城市)
	if req.Location != "" {
		conditions = append(conditions, "`location` LIKE ?")
		args = append(args, req.Location+"%")
	}

	// 公司规模筛选
	if req.CompanyScale != "" {
		conditions = append(conditions, "`company_scale` = ?")
		args = append(args, req.CompanyScale)
	}

	// 薪资范围筛选
	if req.SalaryMin > 0 || req.SalaryMax > 0 {
		salaryConditions := []string{}
		if req.SalaryMin > 0 {
			salaryConditions = append(salaryConditions, "(salary_range REGEXP ? OR salary_range REGEXP ?)")
			args = append(args, fmt.Sprintf("[0-9]+%d", req.SalaryMin), fmt.Sprintf("[0-9]+\\.%d", req.SalaryMin))
		}
		if len(salaryConditions) > 0 {
			conditions = append(conditions, strings.Join(salaryConditions, " OR "))
		}
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = "where " + strings.Join(conditions, " and ")
	}

	// 查询总数
	countQuery := fmt.Sprintf("select count(*) from %s %s", m.table, whereClause)
	var total int64
	err := m.conn.QueryRowCtx(ctx, &total, countQuery, args...)
	if err != nil {
		return nil, 0, err
	}

	// 查询数据
	offset := (req.Page - 1) * req.PageSize
	query := fmt.Sprintf("select %s from %s %s order by `created_at` desc limit ? offset ?", jobsRows, m.table, whereClause)
	args = append(args, req.PageSize, offset)

	var resp []*Jobs
	err = m.conn.QueryRowsCtx(ctx, &resp, query, args...)
	if err != nil {
		return nil, 0, err
	}

	return resp, total, nil
}

// Insert 插入职位记录，自动设置时间戳
// 重写生成的Insert方法，自动设置created_at和updated_at
func (m *customJobsModel) Insert(ctx context.Context, data *Jobs) (sql.Result, error) {
	now := time.Now().Unix()
	if data.CreatedAt == 0 {
		data.CreatedAt = now
	}
	if data.UpdatedAt == 0 {
		data.UpdatedAt = now
	}

	query := fmt.Sprintf("insert into %s (`name`, `description`, `company`, `industry`, `category`, `location`, `salary_range`, `job_code`, `company_scale`, `company_funding_status`, `company_description`, `source_url`, `update_date`, `job_detail`, `skills`, `certificates`, `soft_skills`, `requirements`, `growth_potential`, `created_at`, `updated_at`) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", m.table)
	ret, err := m.conn.ExecCtx(ctx, query, data.Name, data.Description, data.Company, data.Industry, data.Category, data.Location, data.SalaryRange, data.JobCode, data.CompanyScale, data.CompanyFundingStatus, data.CompanyDescription, data.SourceUrl, data.UpdateDate, data.JobDetail, data.Skills, data.Certificates, data.SoftSkills, data.Requirements, data.GrowthPotential, data.CreatedAt, data.UpdatedAt)
	return ret, err
}
