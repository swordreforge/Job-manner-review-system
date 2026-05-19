package model

import (
	"context"
	"database/sql"
	"fmt"
	"strconv"
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
		GetFilterOptions(ctx context.Context) (industries, companyScales, locations []string, err error)
	}

	JobSearchReq struct {
		Page         int    `json:"page"`
		PageSize     int    `json:"pageSize"`
		Keyword      string `json:"keyword"`
		Industry     string `json:"industry"`
		Category     string `json:"category"`
		Location     string `json:"location"`
		CompanyScale string `json:"companyScale"`
		SalaryMin    int    `json:"salaryMin"`
		SalaryMax    int    `json:"salaryMax"`
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

	// 薪资范围筛选（使用 salary_min/salary_max 数值列）
	if req.SalaryMin > 0 || req.SalaryMax > 0 {
		if req.SalaryMin > 0 && req.SalaryMax > 0 {
			conditions = append(conditions, "salary_min <= ? AND salary_max >= ?")
			args = append(args, req.SalaryMax*1000, req.SalaryMin*1000)
		} else if req.SalaryMin > 0 {
			conditions = append(conditions, "salary_max >= ?")
			args = append(args, req.SalaryMin*1000)
		} else {
			conditions = append(conditions, "salary_min <= ?")
			args = append(args, req.SalaryMax*1000)
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

// Insert 插入职位记录，自动设置时间戳和薪资数值
// 重写生成的Insert方法，自动设置created_at、updated_at、salary_min、salary_max
func (m *customJobsModel) Insert(ctx context.Context, data *Jobs) (sql.Result, error) {
	now := time.Now().Unix()
	if data.CreatedAt == 0 {
		data.CreatedAt = now
	}
	if data.UpdatedAt == 0 {
		data.UpdatedAt = now
	}

	sMin, sMax := parseSalaryRange(data.SalaryRange.String)
	data.SalaryMin = sMin
	data.SalaryMax = sMax

	query := fmt.Sprintf("insert into %s (`name`, `description`, `company`, `industry`, `category`, `location`, `salary_range`, `salary_min`, `salary_max`, `job_code`, `company_scale`, `company_funding_status`, `company_description`, `source_url`, `update_date`, `job_detail`, `skills`, `certificates`, `soft_skills`, `requirements`, `growth_potential`, `created_at`, `updated_at`) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", m.table)
	ret, err := m.conn.ExecCtx(ctx, query, data.Name, data.Description, data.Company, data.Industry, data.Category, data.Location, data.SalaryRange, data.SalaryMin, data.SalaryMax, data.JobCode, data.CompanyScale, data.CompanyFundingStatus, data.CompanyDescription, data.SourceUrl, data.UpdateDate, data.JobDetail, data.Skills, data.Certificates, data.SoftSkills, data.Requirements, data.GrowthPotential, data.CreatedAt, data.UpdatedAt)
	return ret, err
}

// GetFilterOptions 获取筛选选项（行业、公司规模、城市）
func (m *customJobsModel) GetFilterOptions(ctx context.Context) (industries, companyScales, locations []string, err error) {
	indQuery := fmt.Sprintf("SELECT DISTINCT `industry` FROM %s WHERE `industry` IS NOT NULL AND `industry` != '' ORDER BY `industry`", m.table)
	var indResults []struct {
		Industry string `db:"industry"`
	}
	err = m.conn.QueryRowsCtx(ctx, &indResults, indQuery)
	if err != nil {
		return nil, nil, nil, err
	}
	for _, r := range indResults {
		industries = append(industries, r.Industry)
	}

	scaleQuery := fmt.Sprintf("SELECT DISTINCT `company_scale` FROM %s WHERE `company_scale` IS NOT NULL AND `company_scale` != '' ORDER BY `company_scale`", m.table)
	var scaleResults []struct {
		CompanyScale string `db:"company_scale"`
	}
	err = m.conn.QueryRowsCtx(ctx, &scaleResults, scaleQuery)
	if err != nil {
		return nil, nil, nil, err
	}
	for _, r := range scaleResults {
		companyScales = append(companyScales, r.CompanyScale)
	}

	locQuery := fmt.Sprintf("SELECT DISTINCT `location` FROM %s WHERE `location` IS NOT NULL AND `location` != '' ORDER BY `location`", m.table)
	var locResults []struct {
		Location string `db:"location"`
	}
	err = m.conn.QueryRowsCtx(ctx, &locResults, locQuery)
	if err != nil {
		return nil, nil, nil, err
	}
	for _, r := range locResults {
		locations = append(locations, r.Location)
	}

	return industries, companyScales, locations, nil
}

// ParseSalaryRange parses salary range strings into monthly amounts in yuan.
// Exported for use by other packages.
func ParseSalaryRange(s string) (int64, int64) {
	return parseSalaryRange(s)
}

// parseSalaryRange parses salary range strings into monthly amounts in yuan.
// Formats: "3000-4000元", "1-2万", "120-150元/天", "面议"
// Returns (min, max) in yuan. Both 0 if unparseable.
func parseSalaryRange(s string) (int64, int64) {
	if s == "" {
		return 0, 0
	}

	s = strings.TrimSpace(s)

	if s == "面议" || s == " negotiable" || s == "N/A" {
		return 0, 0
	}

	isDaily := strings.Contains(s, "/天")
	isWan := strings.Contains(s, "万")

	// Strip suffixes: "元·13薪", "元/天", "万·14薪", "元", "万"
	cleaned := s
	cleaned = strings.Split(cleaned, "·")[0]
	cleaned = strings.Split(cleaned, "/")[0]
	cleaned = strings.TrimRight(cleaned, "元")
	cleaned = strings.TrimRight(cleaned, "万")
	cleaned = strings.TrimSpace(cleaned)

	// Split on "-"
	parts := strings.SplitN(cleaned, "-", 2)
	if len(parts) != 2 {
		// Try single value
		v, err := parseFloatChinese(parts[0])
		if err != nil {
			return 0, 0
		}
		if isWan {
			v *= 10000
		}
		if isDaily {
			v *= 22
		}
		return int64(v), int64(v)
	}

	var min64, max64 int64
	for i, p := range parts {
		v, err := parseFloatChinese(p)
		if err != nil {
			return 0, 0
		}
		if isWan {
			v *= 10000
		}
		if isDaily {
			v *= 22
		}
		if i == 0 {
			min64 = int64(v)
		} else {
			max64 = int64(v)
		}
	}

	if min64 > max64 && max64 > 0 {
		min64, max64 = max64, min64
	}

	return min64, max64
}

func parseFloatChinese(s string) (float64, error) {
	s = strings.TrimSpace(s)
	return strconv.ParseFloat(s, 64)
}

// BackfillSalaryColumns sets salary_min/salary_max for all rows where they are 0
func (m *customJobsModel) BackfillSalaryColumns(ctx context.Context) error {
	query := fmt.Sprintf("SELECT `id`, `salary_range` FROM %s WHERE `salary_min` = 0 AND `salary_max` = 0 AND `salary_range` IS NOT NULL AND `salary_range` != ''", m.table)
	var rows []struct {
		Id          int64          `db:"id"`
		SalaryRange sql.NullString `db:"salary_range"`
	}
	if err := m.conn.QueryRowsCtx(ctx, &rows, query); err != nil {
		return err
	}

	for _, row := range rows {
		sMin, sMax := parseSalaryRange(row.SalaryRange.String)
		if sMin == 0 && sMax == 0 {
			continue
		}
		update := fmt.Sprintf("UPDATE %s SET `salary_min` = ?, `salary_max` = ? WHERE `id` = ?", m.table)
		if _, err := m.conn.ExecCtx(ctx, update, sMin, sMax, row.Id); err != nil {
			return err
		}
	}
	return nil
}
