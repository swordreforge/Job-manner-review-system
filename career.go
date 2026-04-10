package main

import (
	"database/sql"
	"flag"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/zeromicro/go-zero/core/conf"
	"github.com/zeromicro/go-zero/core/logx"
	"github.com/zeromicro/go-zero/rest"
	"golang.org/x/crypto/bcrypt"

	"career-api/internal/config"
	"career-api/internal/handler"
	"career-api/internal/middleware"
	"career-api/internal/svc"
)

var configFile = flag.String("f", "etc/career-api.yaml", "the config file")
var skipAll = flag.Bool("skip-all", false, "skip all database initialization prompts")

func main() {
	flag.Parse()

	var c config.Config
	conf.MustLoad(*configFile, &c)

	// 配置日志使用 console 模式以支持颜色
	logx.MustSetup(logx.LogConf{
		ServiceName: c.Log.ServiceName,
		Mode:        "console",
		Encoding:    "plain",
		Level:       c.Log.Level,
		KeepDays:    c.Log.KeepDays,
	})

	// 检查数据库是否需要初始化
	needsInit, err := checkDatabaseNeedsInit(c.Mysql.DataSource)
	if err != nil {
		logx.Errorf("Database check failed: %v", err)
		os.Exit(1)
	}

	if needsInit {
		if !*skipAll {
			fmt.Println("========================================")
			fmt.Println("数据库尚未初始化")
			fmt.Println("========================================")
			fmt.Println()
			fmt.Println("系统需要初始化数据库。请选择:")
			fmt.Println("  1. 现在初始化 (推荐)")
			fmt.Println("  2. 跳过并使用现有数据库 (可能失败)")
			fmt.Println("  3. 退出并手动运行 ./init-db.sh")
			fmt.Println()
			fmt.Print("请输入选项 (1-3): ")

			var choice string
			fmt.Scanln(&choice)

			switch choice {
			case "1":
				fmt.Println()
				if err := runInteractiveInit(c); err != nil {
					logx.Errorf("Initialization failed: %v", err)
					os.Exit(1)
				}
			case "2":
				logx.Info("跳过初始化，继续启动服务...")
			case "3":
				logx.Info("已退出。请运行 ./init-db.sh 来初始化数据库")
				os.Exit(0)
			default:
				logx.Info("无效选项，退出")
				os.Exit(1)
			}
		} else {
			logx.Info("使用 --skip-all 参数，跳过初始化检查")
		}
	}

	if err := autoMigrate(c.Mysql.DataSource); err != nil {
		logx.Errorf("Auto migration failed: %v", err)
		os.Exit(1)
	}

	server := rest.MustNewServer(c.RestConf, rest.WithCors())
	defer server.Stop()

	ctx := svc.NewServiceContext(&c)
	handler.RegisterHandlers(server, ctx)

	// 应用认证中间件
	server.Use(middleware.NewAuthMiddleware(ctx.Config.Auth.AccessSecret).Handle)

	fmt.Printf("Starting server at %s:%d...\n", c.Host, c.Port)
	server.Start()
}

func autoMigrate(dataSource string) error {
	idx := strings.Index(dataSource, "/")
	if idx == -1 {
		return fmt.Errorf("invalid datasource format")
	}

	prefix := dataSource[:idx]
	rest := dataSource[idx+1:]

	queryIdx := strings.Index(rest, "?")
	var dbName string
	if queryIdx == -1 {
		dbName = rest
	} else {
		dbName = rest[:queryIdx]
	}

	baseDSN := prefix + "/?charset=utf8mb4&parseTime=true&loc=Local"

	db, err := sql.Open("mysql", baseDSN)
	if err != nil {
		return fmt.Errorf("failed to connect to mysql: %w", err)
	}
	defer db.Close()

	if _, err := db.Exec(fmt.Sprintf("CREATE DATABASE IF NOT EXISTS %s CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci", dbName)); err != nil {
		return fmt.Errorf("failed to create database: %w", err)
	}
	logx.Infof("Database %s ensured", dbName)

	db.Close()

	db, err = sql.Open("mysql", dataSource)
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}
	defer db.Close()

	// 直接在 Golang 层面创建表结构
	tables := []struct {
		name      string
		createSQL string
	}{
		{
			name: "users",
			createSQL: `CREATE TABLE IF NOT EXISTS users (
				id BIGINT(20) NOT NULL AUTO_INCREMENT,
				username VARCHAR(50) NOT NULL UNIQUE,
				password VARCHAR(255) NOT NULL,
				email VARCHAR(100) DEFAULT NULL,
				phone VARCHAR(20) DEFAULT NULL,
				role VARCHAR(20) NOT NULL DEFAULT 'student',
				created_at BIGINT(20) NOT NULL,
				updated_at BIGINT(20) NOT NULL,
				PRIMARY KEY (id),
				KEY idx_username (username)
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
		},
		{
			name: "students",
			createSQL: `CREATE TABLE IF NOT EXISTS students (
				id BIGINT(20) NOT NULL AUTO_INCREMENT,
				user_id BIGINT(20) NOT NULL,
				name VARCHAR(50) NOT NULL,
				education VARCHAR(50) DEFAULT NULL,
				major VARCHAR(100) DEFAULT NULL,
				graduation_year BIGINT(20) DEFAULT NULL,
				skills TEXT DEFAULT NULL,
				certificates TEXT DEFAULT NULL,
				soft_skills TEXT DEFAULT NULL,
				internship TEXT DEFAULT NULL,
				projects TEXT DEFAULT NULL,
				completeness_score DOUBLE NOT NULL DEFAULT 0,
				competitiveness_score DOUBLE NOT NULL DEFAULT 0,
				resume_url VARCHAR(255) DEFAULT NULL,
				suggestions TEXT DEFAULT NULL,
				resume_content TEXT DEFAULT NULL,
				created_at BIGINT(20) NOT NULL,
				updated_at BIGINT(20) NOT NULL,
				PRIMARY KEY (id),
				KEY idx_user_id (user_id),
				KEY idx_name (name)
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
		},
		{
			name: "jobs",
			createSQL: `CREATE TABLE IF NOT EXISTS jobs (
				id BIGINT(20) NOT NULL AUTO_INCREMENT,
				title VARCHAR(200) NOT NULL,
				category VARCHAR(100) DEFAULT NULL,
				description TEXT DEFAULT NULL,
				requirements TEXT DEFAULT NULL,
				salary_range VARCHAR(100) DEFAULT NULL,
				company VARCHAR(100) DEFAULT NULL,
				location VARCHAR(100) DEFAULT NULL,
				education_requirement VARCHAR(50) DEFAULT NULL,
				experience_requirement VARCHAR(50) DEFAULT NULL,
				holland_code VARCHAR(10) DEFAULT NULL,
				created_at BIGINT(20) NOT NULL,
				updated_at BIGINT(20) NOT NULL,
				PRIMARY KEY (id),
				KEY idx_category (category),
				KEY idx_holland_code (holland_code)
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
		},
		{
			name: "job_promotion_paths",
			createSQL: `CREATE TABLE IF NOT EXISTS job_promotion_paths (
				id BIGINT(20) NOT NULL AUTO_INCREMENT,
				from_job_id BIGINT(20) NOT NULL,
				to_job_id BIGINT(20) NOT NULL,
				path_description TEXT DEFAULT NULL,
				required_skills TEXT DEFAULT NULL,
				estimated_years INT DEFAULT NULL,
				created_at BIGINT(20) NOT NULL,
				updated_at BIGINT(20) NOT NULL,
				PRIMARY KEY (id),
				KEY idx_from_job (from_job_id),
				KEY idx_to_job (to_job_id)
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
		},
		{
			name: "holland_test_results",
			createSQL: `CREATE TABLE IF NOT EXISTS holland_test_results (
				id BIGINT(20) NOT NULL AUTO_INCREMENT,
				student_id BIGINT(20) NOT NULL,
				career_code VARCHAR(10) NOT NULL COMMENT '职业代码，如RIA、SEC',
				scores LONGTEXT NOT NULL COMMENT '各类型得分，如{"R":4,"I":3,"A":2,"S":1,"E":1,"C":0}' CHECK (json_valid(scores)),
				suitable_jobs LONGTEXT NOT NULL COMMENT '推荐职业列表' CHECK (json_valid(suitable_jobs)),
				description TEXT DEFAULT NULL COMMENT '测试结果描述',
				created_at BIGINT(20) NOT NULL,
				PRIMARY KEY (id),
				KEY idx_student_id (student_id),
				KEY idx_career_code (career_code)
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
		},
		{
			name: "career_reports",
			createSQL: `CREATE TABLE IF NOT EXISTS career_reports (
				id BIGINT(20) NOT NULL AUTO_INCREMENT,
				student_id BIGINT(20) NOT NULL,
				target_job_id BIGINT(20) DEFAULT NULL,
				title VARCHAR(200) DEFAULT NULL,
				content TEXT DEFAULT NULL,
				overview LONGTEXT DEFAULT NULL CHECK (json_valid(overview)),
				match_analysis LONGTEXT DEFAULT NULL CHECK (json_valid(match_analysis)),
				career_path LONGTEXT DEFAULT NULL CHECK (json_valid(career_path)),
				action_plan LONGTEXT DEFAULT NULL CHECK (json_valid(action_plan)),
				status VARCHAR(20) DEFAULT 'draft',
				created_at BIGINT(20) NOT NULL,
				updated_at BIGINT(20) NOT NULL,
				PRIMARY KEY (id),
				KEY idx_student (student_id)
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
		},
		{
			name: "interview_sessions",
			createSQL: `CREATE TABLE IF NOT EXISTS interview_sessions (
				id BIGINT(20) NOT NULL AUTO_INCREMENT,
				user_id BIGINT(20) NOT NULL,
				student_id BIGINT(20) DEFAULT NULL,
				mode VARCHAR(50) NOT NULL,
				status VARCHAR(50) NOT NULL DEFAULT 'running',
				total_questions INT DEFAULT 0,
				current_question INT DEFAULT 0,
				average_score DECIMAL(5,2) DEFAULT 0.00,
				max_score DECIMAL(5,2) DEFAULT 0.00,
				min_score DECIMAL(5,2) DEFAULT 0.00,
				duration_seconds INT DEFAULT 0,
				created_at BIGINT(20) NOT NULL,
				updated_at BIGINT(20) NOT NULL,
				completed_at BIGINT(20) DEFAULT NULL,
				PRIMARY KEY (id),
				KEY idx_user (user_id),
				KEY idx_student (student_id),
				KEY idx_status (status),
				KEY idx_created (created_at),
				KEY idx_user_status (user_id, status)
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
		},
		{
			name: "interview_messages",
			createSQL: `CREATE TABLE IF NOT EXISTS interview_messages (
				id BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT '消息ID',
				session_id BIGINT(20) NOT NULL COMMENT '会话ID，关联interview_sessions表',
				role VARCHAR(20) NOT NULL COMMENT '角色：user-用户, assistant-AI面试官',
				content TEXT NOT NULL COMMENT '消息内容',
				question_type VARCHAR(50) DEFAULT NULL COMMENT '问题类型：self_intro-自我介绍, project-项目经验, technical-技术问题, hr-人事问题',
				score DECIMAL(5,2) DEFAULT NULL COMMENT '评分（仅AI回复时有效）',
				feedback TEXT DEFAULT NULL COMMENT '反馈内容（仅AI回复时有效）',
				created_at BIGINT(20) NOT NULL COMMENT '创建时间',
				PRIMARY KEY (id),
				KEY idx_session (session_id),
				KEY idx_role (role),
				KEY idx_created (created_at),
				KEY idx_session_created (session_id, created_at),
				CONSTRAINT fk_interview_message_session FOREIGN KEY (session_id) REFERENCES interview_sessions (id) ON DELETE CASCADE
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='面试对话记录表'`,
		},
		{
			name: "interview_reports",
			createSQL: `CREATE TABLE IF NOT EXISTS interview_reports (
				id BIGINT(20) NOT NULL AUTO_INCREMENT,
				session_id BIGINT(20) NOT NULL,
				student_id BIGINT(20) NOT NULL,
				title VARCHAR(200) DEFAULT NULL,
				summary TEXT DEFAULT NULL,
				strengths TEXT DEFAULT NULL,
				weaknesses TEXT DEFAULT NULL,
				suggestions TEXT DEFAULT NULL,
				overall_score DECIMAL(5,2) DEFAULT NULL,
				created_at BIGINT(20) NOT NULL,
				updated_at BIGINT(20) NOT NULL,
				PRIMARY KEY (id),
				KEY idx_session_id (session_id),
				KEY idx_student_id (student_id),
				CONSTRAINT fk_interview_report_session FOREIGN KEY (session_id) REFERENCES interview_sessions (id) ON DELETE CASCADE
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
		},
		{
			name: "match_records",
			createSQL: `CREATE TABLE IF NOT EXISTS match_records (
				id BIGINT(20) NOT NULL AUTO_INCREMENT,
				student_id BIGINT(20) NOT NULL,
				job_id BIGINT(20) NOT NULL,
				match_score DECIMAL(5,2) NOT NULL,
				match_details LONGTEXT DEFAULT NULL CHECK (json_valid(match_details)),
				created_at BIGINT(20) NOT NULL,
				PRIMARY KEY (id),
				KEY idx_student_id (student_id),
				KEY idx_job_id (job_id),
				KEY idx_match_score (match_score)
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
		},
		{
			name: "resume_parse_history",
			createSQL: `CREATE TABLE IF NOT EXISTS resume_parse_history (
				id BIGINT(20) NOT NULL AUTO_INCREMENT,
				user_id BIGINT(20) NOT NULL,
				student_id BIGINT(20) DEFAULT NULL,
				resume_file_name VARCHAR(255) DEFAULT NULL,
				resume_content TEXT DEFAULT NULL,
				parsed_profile TEXT DEFAULT NULL,
				suggestions TEXT DEFAULT NULL,
				completeness_score DOUBLE NOT NULL DEFAULT 0,
				competitiveness_score DOUBLE NOT NULL DEFAULT 0,
				created_at BIGINT(20) NOT NULL,
				PRIMARY KEY (id),
				KEY idx_user_id (user_id),
				KEY idx_student_id (student_id),
				KEY idx_created (created_at)
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
		},
	}

	for _, table := range tables {
		if _, err := db.Exec(table.createSQL); err != nil {
			return fmt.Errorf("创建表 %s 失败: %w", table.name, err)
		}
	}

	logx.Infof("Database migration completed")
	return nil
}

func seedData(dataSource string) error {
	db, err := sql.Open("mysql", dataSource)
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}
	defer db.Close()

	now := time.Now().Unix()

	var userCount int
	err = db.QueryRow("SELECT COUNT(*) FROM users WHERE username = 'testuser'").Scan(&userCount)
	if err != nil && err != sql.ErrNoRows {
		return fmt.Errorf("failed to check user: %w", err)
	}
	if userCount == 0 {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte("123456"), bcrypt.DefaultCost)
		if err != nil {
			return fmt.Errorf("failed to hash password: %w", err)
		}
		_, err = db.Exec("INSERT INTO users (username, password, email, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
			"testuser", string(hashedPassword), "test@example.com", "user", now, now)
		if err != nil {
			return fmt.Errorf("failed to insert test user: %w", err)
		}
		logx.Infof("Test user created: testuser / 123456")
	}

	var jobCount int
	err = db.QueryRow("SELECT COUNT(*) FROM jobs").Scan(&jobCount)
	if err != nil && err != sql.ErrNoRows {
		return fmt.Errorf("failed to check jobs: %w", err)
	}
	if jobCount == 0 {
		jobs := []struct {
			title        string
			category     string
			description  string
			requirements string
			salaryRange  string
			company      string
			location     string
			hollandCode  string
		}{
			{"Golang后端开发工程师", "技术", "负责公司后端服务开发，参与微服务架构设计与实现", "熟练掌握Golang编程语言，熟悉MySQL/Redis，了解微服务架构", "15000-30000", "字节跳动", "北京", "IRC"},
			{"Java开发工程师", "技术", "负责企业级应用后端开发，参与系统架构设计", "熟练掌握Java，熟悉Spring框架，了解分布式系统", "12000-25000", "阿里巴巴", "杭州", "IRC"},
			{"前端开发工程师", "技术", "负责Web前端开发，与后端工程师协作完成产品功能", "熟练掌握Vue/React，熟悉HTML/CSS/JavaScript", "12000-22000", "腾讯", "深圳", "AIR"},
			{"Python数据分析师", "数据", "负责数据分析和可视化，为业务决策提供支持", "熟练掌握Python，熟悉Pandas/NumPy，了解数据可视化", "15000-28000", "美团", "北京", "IEC"},
			{"产品经理", "产品", "负责产品规划与设计，协调研发团队推动产品迭代", "良好的沟通能力，了解互联网产品，有项目管理经验", "18000-35000", "字节跳动", "北京", "ESA"},
			{"UI设计师", "设计", "负责产品界面设计，提升用户体验", "熟练掌握Figma/Sketch，了解用户体验设计原则", "15000-28000", "网易", "杭州", "AIR"},
			{"测试工程师", "技术", "负责产品测试工作，保障软件质量", "熟悉测试流程，了解自动化测试框架", "10000-20000", "华为", "深圳", "RIC"},
			{"运维工程师", "技术", "负责服务器运维，保障系统稳定运行", "熟悉Linux，了解Docker/K8s，有运维经验", "15000-25000", "阿里巴巴", "杭州", "RIC"},
			{"新媒体运营", "运营", "负责新媒体平台运营，策划优质内容", "熟悉各平台运营规则，有内容策划能力", "8000-15000", "小红书", "上海", "SEA"},
			{"内容编辑", "内容", "负责内容策划与编辑，产出优质文章", "良好的文字功底，了解内容运营", "7000-14000", "今日头条", "北京", "AES"},
		}

		for _, job := range jobs {
			_, err = db.Exec(`INSERT INTO jobs (title, category, description, requirements, salary_range, company, location, education_requirement, experience_requirement, holland_code, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
				job.title, job.category, job.description, job.requirements, job.salaryRange, job.company, job.location, "本科", "1-3年", job.hollandCode, now, now)
			if err != nil {
				logx.Errorf("Failed to insert job %s: %v", job.title, err)
			}
		}
		logx.Infof("Sample jobs seeded: %d jobs", len(jobs))
	}

	return nil
}

// checkDatabaseNeedsInit 检查数据库是否需要初始化
func checkDatabaseNeedsInit(dataSource string) (bool, error) {
	idx := strings.Index(dataSource, "/")
	if idx == -1 {
		return false, fmt.Errorf("invalid datasource format")
	}

	rest := dataSource[idx+1:]

	queryIdx := strings.Index(rest, "?")
	var dbName string
	if queryIdx == -1 {
		dbName = rest
	} else {
		dbName = rest[:queryIdx]
	}

	// 检查配置文件是否存在
	if _, err := os.Stat(*configFile); os.IsNotExist(err) {
		return true, nil
	}

	// 尝试连接数据库
	db, err := sql.Open("mysql", dataSource)
	if err != nil {
		// 无法连接，可能需要初始化
		return true, nil
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		// 数据库可能不存在，需要初始化
		return true, nil
	}

	// 检查关键表是否存在
	var count int
	err = db.QueryRow("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = ? AND table_name = 'career_reports'", dbName).Scan(&count)
	if err != nil {
		return false, err
	}

	return count == 0, nil
}

// runInteractiveInit 运行交互式初始化
func runInteractiveInit(c config.Config) error {
	fmt.Println("正在启动交互式初始化程序...")
	fmt.Println()

	// 调用初始化程序
	cmd := os.Args[0]
	args := []string{cmd, "run", "cmd/init-db/main.go"}
	if *configFile != "" {
		args = append(args, "-config", *configFile)
	}

	// 读取现有配置中的数据库信息
	fmt.Println("检测到当前配置:")
	fmt.Printf("  数据库: %s\n", c.Mysql.DataSource)
	fmt.Println()
	fmt.Println("将使用现有配置进行初始化...")
	fmt.Println()

	// 直接调用autoMigrate函数创建表结构
	if err := autoMigrate(c.Mysql.DataSource); err != nil {
		return fmt.Errorf("初始化失败: %w", err)
	}

	// 插入测试数据
	if err := seedData(c.Mysql.DataSource); err != nil {
		logx.Errorf("Seed data failed: %v", err)
	}

	fmt.Println()
	fmt.Println("✓ 数据库初始化完成")
	fmt.Println("现在可以正常使用系统了")
	return nil
}
