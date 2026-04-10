package main

import (
	"bufio"
	"database/sql"
	"fmt"
	"os"
	"strings"

	_ "github.com/go-sql-driver/mysql"
	"gopkg.in/yaml.v3"
)

type Config struct {
	Name    string `yaml:"Name"`
	Host    string `yaml:"Host"`
	Port    int    `yaml:"Port"`
	Mode    string `yaml:"Mode"`
	Timeout int    `yaml:"Timeout"`

	Log struct {
		ServiceName string `yaml:"ServiceName"`
		Mode        string `yaml:"Mode"`
		Level       string `yaml:"Level"`
		KeepDays    int    `yaml:"KeepDays"`
		Encoding    string `yaml:"Encoding"`
	} `yaml:"Log"`

	Mysql struct {
		DataSource      string `yaml:"DataSource"`
		MaxOpenConns    int    `yaml:"MaxOpenConns"`
		MaxIdleConns    int    `yaml:"MaxIdleConns"`
		ConnMaxLifetime int    `yaml:"ConnMaxLifetime"`
	} `yaml:"Mysql"`

	Redis struct {
		Host     string `yaml:"Host"`
		Type     string `yaml:"Type"`
		Pass     string `yaml:"Pass"`
		DB       int    `yaml:"DB"`
		PoolSize int    `yaml:"PoolSize"`
	} `yaml:"Redis"`

	CacheRedis struct {
		Host     string `yaml:"Host"`
		Pass     string `yaml:"Pass"`
		DB       int    `yaml:"DB"`
		PoolSize int    `yaml:"PoolSize"`
	} `yaml:"CacheRedis"`

	Auth struct {
		AccessSecret string `yaml:"AccessSecret"`
		AccessExpire int64  `yaml:"AccessExpire"`
	} `yaml:"Auth"`

	AI struct {
		Provider string `yaml:"Provider"`
		ApiKey   string `yaml:"ApiKey"`
		Model    string `yaml:"Model"`
		BaseURL  string `yaml:"BaseURL"`
		Timeout  int    `yaml:"Timeout"`
	} `yaml:"AI"`

	Prometheus struct {
		Host string `yaml:"Host"`
		Port int    `yaml:"Port"`
	} `yaml:"Prometheus"`

	CORS struct {
		Origins []string `yaml:"Origins"`
		Methods []string `yaml:"Methods"`
		Headers []string `yaml:"Headers"`
	} `yaml:"CORS"`

	RateLimit struct {
		TokensPerSecond int `yaml:"TokensPerSecond"`
		Burst           int `yaml:"Burst"`
	} `yaml:"RateLimit"`

	CircuitBreaker struct {
		ForceOpen             bool `yaml:"ForceOpen"`
		SleepWindow           int  `yaml:"SleepWindow"`
		ErrorPercentThreshold int  `yaml:"ErrorPercentThreshold"`
	} `yaml:"CircuitBreaker"`
}

func main() {
	fmt.Println("=== 职业规划系统 - 数据库初始化程序 ===")
	fmt.Println()

	// 读取配置文件
	configPath := "etc/career-api.yaml"
	config, err := loadConfig(configPath)
	if err != nil {
		fmt.Printf("警告: 无法读取配置文件: %v\n", err)
		fmt.Println("将创建新配置文件...")
		config = &Config{}
	}

	// 询问数据库配置
	dbConfig := promptDatabaseConfig()

	// 测试数据库连接
	fmt.Println("\n[步骤 1/4] 测试数据库连接...")
	if err := testDatabaseConnection(dbConfig); err != nil {
		fmt.Printf("❌ 数据库连接失败: %v\n", err)
		fmt.Println("请检查配置后重试。")
		os.Exit(1)
	}
	fmt.Println("✓ 数据库连接成功")

	// 创建数据库
	fmt.Println("\n[步骤 2/4] 创建数据库...")
	if err := createDatabase(dbConfig); err != nil {
		fmt.Printf("❌ 创建数据库失败: %v\n", err)
		os.Exit(1)
	}
	fmt.Println("✓ 数据库创建成功")

	// 初始化表结构
	fmt.Println("\n[步骤 3/4] 初始化表结构...")
	if err := initTables(dbConfig); err != nil {
		fmt.Printf("❌ 初始化表结构失败: %v\n", err)
		os.Exit(1)
	}
	fmt.Println("✓ 表结构初始化成功")

	// 保存配置文件
	fmt.Println("\n[步骤 4/4] 保存配置文件...")
	config.Mysql.DataSource = buildDataSource(dbConfig)
	if err := saveConfig(configPath, config); err != nil {
		fmt.Printf("❌ 保存配置文件失败: %v\n", err)
		os.Exit(1)
	}
	fmt.Println("✓ 配置文件保存成功")

	fmt.Println("\n=== 初始化完成 ===")
	fmt.Printf("配置文件: %s\n", configPath)
	fmt.Printf("数据库: %s@%s:%d/%s\n", dbConfig.Username, dbConfig.Host, dbConfig.Port, dbConfig.Database)
	fmt.Println("\n现在可以使用以下命令启动后端服务:")
	fmt.Println("  go run career.go -f etc/career-api.yaml")
}

type DatabaseConfig struct {
	Host     string
	Port     int
	Username string
	Password string
	Database string
}

func promptDatabaseConfig() *DatabaseConfig {
	reader := bufio.NewReader(os.Stdin)

	fmt.Println("请输入数据库连接信息:")
	fmt.Println()

	// 默认值
	defaultHost := "localhost"
	defaultPort := 3306
	defaultUsername := "root"
	defaultDatabase := "career_db"

	// 主机
	fmt.Printf("数据库主机 [%s]: ", defaultHost)
	host := readLine(reader)
	if host == "" {
		host = defaultHost
	}

	// 端口
	fmt.Printf("数据库端口 [%d]: ", defaultPort)
	portStr := readLine(reader)
	port := defaultPort
	if portStr != "" {
		fmt.Sscanf(portStr, "%d", &port)
	}

	// 用户名
	fmt.Printf("数据库用户名 [%s]: ", defaultUsername)
	username := readLine(reader)
	if username == "" {
		username = defaultUsername
	}

	// 密码
	fmt.Print("数据库密码: ")
	password := readPassword(reader)

	// 数据库名
	fmt.Printf("数据库名 [%s]: ", defaultDatabase)
	database := readLine(reader)
	if database == "" {
		database = defaultDatabase
	}

	return &DatabaseConfig{
		Host:     host,
		Port:     port,
		Username: username,
		Password: password,
		Database: database,
	}
}

func readLine(reader *bufio.Reader) string {
	line, _ := reader.ReadString('\n')
	return strings.TrimSpace(line)
}

func readPassword(reader *bufio.Reader) string {
	line, _ := reader.ReadString('\n')
	return strings.TrimSpace(line)
}

func loadConfig(path string) (*Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	var config Config
	if err := yaml.Unmarshal(data, &config); err != nil {
		return nil, err
	}

	return &config, nil
}

func saveConfig(path string, config *Config) error {
	data, err := yaml.Marshal(config)
	if err != nil {
		return err
	}

	// 确保目录存在
	if err := os.MkdirAll("etc", 0755); err != nil {
		return err
	}

	return os.WriteFile(path, data, 0644)
}

func buildDataSource(dbConfig *DatabaseConfig) string {
	return fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=utf8mb4&parseTime=true&loc=Local",
		dbConfig.Username, dbConfig.Password, dbConfig.Host, dbConfig.Port, dbConfig.Database)
}

func testDatabaseConnection(dbConfig *DatabaseConfig) error {
	// 先不指定数据库，只测试服务器连接
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%d)/?charset=utf8mb4&parseTime=true&loc=Local",
		dbConfig.Username, dbConfig.Password, dbConfig.Host, dbConfig.Port)

	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return fmt.Errorf("无法打开数据库连接: %w", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		return fmt.Errorf("数据库ping失败: %w", err)
	}

	return nil
}

func createDatabase(dbConfig *DatabaseConfig) error {
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%d)/?charset=utf8mb4&parseTime=true&loc=Local",
		dbConfig.Username, dbConfig.Password, dbConfig.Host, dbConfig.Port)

	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return fmt.Errorf("无法打开数据库连接: %w", err)
	}
	defer db.Close()

	// 创建数据库
	createSQL := fmt.Sprintf("CREATE DATABASE IF NOT EXISTS `%s` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
		dbConfig.Database)
	if _, err := db.Exec(createSQL); err != nil {
		return fmt.Errorf("创建数据库失败: %w", err)
	}

	return nil
}

func initTables(dbConfig *DatabaseConfig) error {
	dsn := buildDataSource(dbConfig)

	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return fmt.Errorf("无法打开数据库连接: %w", err)
	}
	defer db.Close()

	// 创建所有表
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
		fmt.Printf("  - 创建表: %s\n", table.name)
		if _, err := db.Exec(table.createSQL); err != nil {
			return fmt.Errorf("创建表 %s 失败: %w", table.name, err)
		}
	}

	return nil
}
