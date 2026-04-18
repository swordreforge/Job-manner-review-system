package main

import (
	"database/sql"
	"encoding/csv"
	"flag"
	"fmt"
	"log"
	"os"
	"regexp"
	"strconv"
	"strings"
	"time"

	_ "github.com/go-sql-driver/mysql"
)

var (
	configFile = flag.String("f", "etc/career-api.yaml", "the config file")
	csvFile    = flag.String("csv", "20260226105856_457.csv", "the csv file to import")
	limit      = flag.Int("limit", 0, "limit number of records to import (0 = all)")
	dryRun     = flag.Bool("dry-run", false, "dry run without inserting")
	batchSize  = flag.Int("batch", 100, "batch size for inserting")
	truncate   = flag.Bool("truncate", false, "truncate table before import")
)

type Job struct {
	Name                 string
	Description          string
	Company              string
	Industry             string
	Category             string
	Location             string
	SalaryRange          string
	JobCode              string
	CompanyScale         string
	CompanyFundingStatus string
	CompanyDescription   string
	SourceUrl            string
	UpdateDate           string
	JobDetail            string
	Skills               string
	Certificates         string
	SoftSkills           string
	Requirements         string
	GrowthPotential      string
}

func main() {
	flag.Parse()

	fmt.Println("=== Jobs CSV 导入工具 ===")
	fmt.Printf("CSV文件: %s\n", *csvFile)
	fmt.Printf("导入限制: %d (0=全部)\n", *limit)
	fmt.Printf("模拟运行: %v\n", *dryRun)
	fmt.Println()

	// 打开CSV文件
	f, err := os.Open(*csvFile)
	if err != nil {
		log.Fatalf("打开CSV文件失败: %v", err)
	}
	defer f.Close()

	reader := csv.NewReader(f)
	records, err := reader.ReadAll()
	if err != nil {
		log.Fatalf("读取CSV失败: %v", err)
	}

	fmt.Printf("CSV总行数: %d\n", len(records))

	if len(records) < 2 {
		log.Fatal("CSV数据不足")
	}

	// 解析列名映射
	headerMap := make(map[string]int)
	for i, col := range records[0] {
		headerMap[col] = i
	}

	fmt.Printf("列名映射: %v\n", headerMap)
	fmt.Println()

	// 解析数据行
	var jobs []Job
	for i, row := range records[1:] {
		if *limit > 0 && i >= *limit {
			break
		}

		job := parseRow(row, headerMap)
		if job.Name == "" {
			continue
		}
		jobs = append(jobs, job)
	}

	fmt.Printf("解析到 %d 条有效岗位数据\n", len(jobs))

	if *dryRun {
		fmt.Println("\n=== 模拟运行，输出前3条数据 ===")
		for i, job := range jobs {
			if i >= 3 {
				break
			}
			fmt.Printf("\n--- 记录 %d ---\n", i+1)
			fmt.Printf("岗位名称: %s\n", job.Name)
			fmt.Printf("公司名称: %s\n", job.Company)
			fmt.Printf("行业: %s\n", job.Industry)
			fmt.Printf("地点: %s\n", job.Location)
			fmt.Printf("薪资: %s\n", job.SalaryRange)
			fmt.Printf("公司规模: %s\n", job.CompanyScale)
			fmt.Printf("融资状态: %s\n", job.CompanyFundingStatus)
			fmt.Printf("岗位编码: %s\n", job.JobCode)
		}
		return
	}

	// 连接数据库
	db, err := getDBConnection()
	if err != nil {
		log.Fatalf("数据库连接失败: %v", err)
	}
	defer db.Close()

	// 导入数据
	importJobs(db, jobs)
}

func parseRow(row []string, headerMap map[string]int) Job {
	getVal := func(colName string) string {
		idx, ok := headerMap[colName]
		if !ok || idx >= len(row) {
			return ""
		}
		return strings.TrimSpace(row[idx])
	}

	job := Job{
		Name:                 getVal("岗位名称"),
		Location:             getVal("地址"),
		SalaryRange:          getVal("薪资范围"),
		Company:              getVal("公司名称"),
		Industry:             getVal("所属行业"),
		CompanyScale:         normalizeCompanyScale(getVal("公司规模")),
		CompanyFundingStatus: normalizeFundingStatus(getVal("公司类型")),
		JobCode:              getVal("岗位编码"),
		JobDetail:            stripHtml(getVal("岗位详情")),
		CompanyDescription:   stripHtml(getVal("公司详情")),
		SourceUrl:            getVal("岗位来源地址"),
		UpdateDate:           parseUpdateDate(getVal("更新日期")),
	}

	// 从行业提取分类
	job.Category = extractCategory(job.Industry)

	// 生成简短描述
	job.Description = generateDescription(job.JobDetail)

	return job
}

func normalizeCompanyScale(scale string) string {
	scaleMap := map[string]string{
		"20人以下":    "20人以下",
		"20-99人":   "20-99人",
		"100-299人": "100-299人",
		"300-499人": "300-499人",
		"500-999人": "500-999人",
		"1000-9999人": "1000-9999人",
		"10000人以上": "10000人以上",
	}

	for k, v := range scaleMap {
		if strings.Contains(scale, k) || k == scale {
			return v
		}
	}
	return scale
}

func normalizeFundingStatus(status string) string {
	statusMap := map[string]string{
		"未融资":     "未融资",
		"不需要融资":  "不需要融资",
		"天使轮":     "天使轮",
		"Pre-A":    "Pre-A",
		"A轮":       "A轮",
		"A+轮":      "A+轮",
		"B轮":       "B轮",
		"B+轮":      "B+轮",
		"C轮":       "C轮",
		"D轮":       "D轮",
		"E轮":       "E轮",
		"已上市":     "已上市",
	}

	for k, v := range statusMap {
		if strings.Contains(status, k) || k == status {
			return v
		}
	}
	return status
}

func extractCategory(industry string) string {
	if industry == "" {
		return ""
	}

	parts := strings.Split(industry, ",")
	if len(parts) > 0 {
		return strings.TrimSpace(parts[0])
	}
	return industry
}

func generateDescription(detail string) string {
	desc := strings.ReplaceAll(detail, "\n", " ")
	desc = strings.ReplaceAll(desc, "<br>", " ")
	desc = strings.ReplaceAll(desc, "<br/>", " ")
	desc = strings.ReplaceAll(desc, "<br />", " ")

	if len(desc) > 200 {
		lastPunct := strings.LastIndexAny(desc[:200], "。,，.、")
		if lastPunct > 100 {
			desc = desc[:lastPunct+1]
		} else {
			desc = desc[:200] + "..."
		}
	}
	return sanitizeString(desc)
}

func stripHtml(html string) string {
	re := regexp.MustCompile(`<br\s*/?>`)
	html = re.ReplaceAllString(html, "\n")

	re = regexp.MustCompile(`<[^>]+>`)
	html = re.ReplaceAllString(html, "")

	html = strings.ReplaceAll(html, "&nbsp;", " ")
	html = strings.ReplaceAll(html, "&amp;", "&")
	html = strings.ReplaceAll(html, "&lt;", "<")
	html = strings.ReplaceAll(html, "&gt;", ">")
	html = strings.ReplaceAll(html, "&quot;", "\"")
	html = strings.ReplaceAll(html, "&#39;", "'")

	return sanitizeString(strings.TrimSpace(html))
}

func sanitizeString(s string) string {
	// 移除无效的UTF-8字符
	clean := strings.ToValidUTF8(s, "")
	return clean
}

func parseUpdateDate(dateStr string) string {
	if dateStr == "" {
		return ""
	}

	re := regexp.MustCompile(`(\d+)月(\d+)日`)
	matches := re.FindStringSubmatch(dateStr)
	if matches != nil {
		month, _ := strconv.Atoi(matches[1])
		day, _ := strconv.Atoi(matches[2])
		now := time.Now()
		return fmt.Sprintf("%d-%02d-%02d", now.Year(), month, day)
	}

	return dateStr
}

func getDBConnection() (*sql.DB, error) {
	var dsn string

	if _, err := os.Stat(*configFile); err == nil {
		data, err := os.ReadFile(*configFile)
		if err == nil {
			re := regexp.MustCompile(`DataSource:\s*(.+)`)
			matches := re.FindStringSubmatch(string(data))
			if len(matches) > 1 {
				dsn = strings.TrimSpace(matches[1])
			}
		}
	}

	if dsn == "" {
		fmt.Print("请输入数据库连接字符串 (DSN): ")
		fmt.Scanln(&dsn)
	}

	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return nil, err
	}

	if err := db.Ping(); err != nil {
		return nil, err
	}

	fmt.Println("数据库连接成功")
	return db, nil
}

func importJobs(db *sql.DB, jobs []Job) {
	now := time.Now().Unix()

	var count int
	db.QueryRow("SELECT COUNT(*) FROM jobs").Scan(&count)
	fmt.Printf("当前jobs表已有 %d 条记录\n", count)

	if *truncate || count > 0 {
		if !*truncate {
			fmt.Print("是否清空现有数据后导入? (y/n): ")
			var confirm string
			fmt.Scanln(&confirm)
			if confirm != "y" && confirm != "Y" {
				fmt.Println("取消导入")
				return
			}
		}
		_, err := db.Exec("TRUNCATE TABLE jobs")
		if err != nil {
			log.Fatalf("清空表失败: %v", err)
		}
		fmt.Println("已清空jobs表")
	}

	total := len(jobs)
	success := 0
	failed := 0

	query := `INSERT INTO jobs (
		name, description, company, industry, category, location, salary_range,
		job_code, company_scale, company_funding_status, company_description,
		source_url, update_date, job_detail,
		skills, certificates, soft_skills, requirements, growth_potential,
		created_at, updated_at
	) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

	for i := 0; i < total; i += *batchSize {
		end := i + *batchSize
		if end > total {
			end = total
		}

		batch := jobs[i:end]

		for _, job := range batch {
			_, err := db.Exec(query,
				job.Name, job.Description, job.Company, job.Industry, job.Category,
				job.Location, job.SalaryRange, job.JobCode, job.CompanyScale,
				job.CompanyFundingStatus, job.CompanyDescription, job.SourceUrl,
				job.UpdateDate, job.JobDetail, job.Skills, job.Certificates,
				job.SoftSkills, job.Requirements, job.GrowthPotential, now, now,
			)

			if err != nil {
				log.Printf("插入失败 [%s]: %v", job.Name, err)
				failed++
				continue
			}
			success++
		}

		fmt.Printf("进度: %d/%d (%.1f%%)\n", end, total, float64(end)/float64(total)*100)
	}

	fmt.Printf("\n=== 导入完成 ===\n")
	fmt.Printf("成功: %d\n", success)
	fmt.Printf("失败: %d\n", failed)
	fmt.Printf("总计: %d\n", total)
}