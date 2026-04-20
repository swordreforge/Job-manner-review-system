package main

import (
	"database/sql"
	"flag"
	"fmt"
	"os"
	"regexp"
	"strings"
	"time"

	"github.com/zeromicro/go-zero/core/conf"
	"github.com/zeromicro/go-zero/core/logx"
	"github.com/zeromicro/go-zero/rest"
	"golang.org/x/crypto/bcrypt"

	"career-api/internal/config"
	"career-api/internal/handler"
	"career-api/internal/middleware"
	"career-api/internal/pkg"
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
			logx.Info("使用 --skip-all 参数，自动初始化数据库...")
			if err := runInteractiveInit(c); err != nil {
				logx.Errorf("Auto initialization failed: %v", err)
				os.Exit(1)
			}
		}
	}

	if err := autoMigrate(c.Mysql.DataSource); err != nil {
		logx.Errorf("Auto migration failed: %v", err)
		os.Exit(1)
	}

	// Run column migration for existing tables (adds new columns without breaking)
	if err := migrateColumns(c.Mysql.DataSource); err != nil {
		logx.Errorf("Column migration failed: %v", err)
	}

	if err := seedData(c.Mysql.DataSource); err != nil {
		logx.Errorf("Seed data failed: %v", err)
	}

	server := rest.MustNewServer(c.RestConf, rest.WithCors())
	defer server.Stop()

	ctx := svc.NewServiceContext(&c)
	handler.RegisterHandlers(server, ctx)

	// 应用认证中间件
	server.Use(middleware.NewAuthMiddlewareWithDSN(c.Auth.AccessSecret, c.Mysql.DataSource).Handle)

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
				avatar VARCHAR(255) DEFAULT NULL,
				role VARCHAR(20) NOT NULL DEFAULT 'student',
				school_id BIGINT(20) DEFAULT NULL,
				first_login TINYINT NOT NULL DEFAULT 1,
				created_at BIGINT(20) NOT NULL,
				updated_at BIGINT(20) NOT NULL,
				PRIMARY KEY (id),
				KEY idx_username (username),
				KEY idx_school_id (school_id)
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
				task_completion_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT '8系列任务总完成度',
				last_activity_at BIGINT(20) DEFAULT NULL COMMENT '最后活动时间',
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
				name VARCHAR(200) NOT NULL COMMENT '岗位名称',
				description TEXT DEFAULT NULL COMMENT '简短描述(纯文本)',
				company VARCHAR(200) DEFAULT NULL COMMENT '公司名称',
				industry VARCHAR(100) DEFAULT NULL COMMENT '所属行业',
				category VARCHAR(100) DEFAULT NULL COMMENT '岗位分类',
				location VARCHAR(100) DEFAULT NULL COMMENT '工作地点',
				salary_range VARCHAR(100) DEFAULT NULL COMMENT '薪资范围',
				job_code VARCHAR(50) DEFAULT NULL COMMENT '外部岗位编码',
				company_scale VARCHAR(50) DEFAULT NULL COMMENT '公司规模',
				company_funding_status VARCHAR(50) DEFAULT NULL COMMENT '融资状态',
				company_description TEXT DEFAULT NULL COMMENT '公司详情',
				source_url VARCHAR(500) DEFAULT NULL COMMENT '来源URL',
				update_date DATE DEFAULT NULL COMMENT '更新日期',
				job_detail TEXT DEFAULT NULL COMMENT '详细岗位职责',
				skills TEXT DEFAULT NULL,
				certificates TEXT DEFAULT NULL,
				soft_skills TEXT DEFAULT NULL,
				requirements TEXT DEFAULT NULL,
				growth_potential TEXT DEFAULT NULL,
				created_at BIGINT(20) NOT NULL,
				updated_at BIGINT(20) NOT NULL,
				PRIMARY KEY (id),
				KEY idx_industry (industry),
				KEY idx_category (category),
				KEY idx_location (location),
				KEY idx_job_code (job_code),
				KEY idx_company_scale (company_scale)
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
		},
		{
			name: "job_promotion_paths",
			createSQL: `CREATE TABLE IF NOT EXISTS job_promotion_paths (
				id BIGINT(20) NOT NULL AUTO_INCREMENT,
				from_job_id BIGINT(20) NOT NULL,
				to_job_id BIGINT(20) NOT NULL,
				match_score DECIMAL(5,2) DEFAULT NULL,
				transfer_skills TEXT DEFAULT NULL,
				learning_path TEXT DEFAULT NULL,
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
				user_id BIGINT(20) NOT NULL,
				overall_score DECIMAL(5,2) NOT NULL DEFAULT 0,
				skill_score DECIMAL(5,2) DEFAULT NULL,
				communication_score DECIMAL(5,2) DEFAULT NULL,
				logic_score DECIMAL(5,2) DEFAULT NULL,
				confidence_score DECIMAL(5,2) DEFAULT NULL,
				strengths TEXT DEFAULT NULL,
				weaknesses TEXT DEFAULT NULL,
				improvement_suggestions TEXT DEFAULT NULL,
				summary TEXT DEFAULT NULL,
				created_at BIGINT(20) NOT NULL,
				updated_at BIGINT(20) NOT NULL,
				PRIMARY KEY (id),
				KEY idx_session_id (session_id),
				KEY idx_user_id (user_id)
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
		// Teacher side tables
		{
			name: "schools",
			createSQL: `CREATE TABLE IF NOT EXISTS schools (
				id BIGINT(20) NOT NULL AUTO_INCREMENT,
				name VARCHAR(100) NOT NULL COMMENT '学校名称',
				code VARCHAR(20) NOT NULL UNIQUE COMMENT '学校代码',
				address VARCHAR(200) DEFAULT NULL COMMENT '学校地址',
				contact_person VARCHAR(50) DEFAULT NULL COMMENT '联系人',
				contact_phone VARCHAR(20) DEFAULT NULL COMMENT '联系电话',
				contact_email VARCHAR(100) DEFAULT NULL COMMENT '联系邮箱',
				status VARCHAR(20) NOT NULL DEFAULT 'active' COMMENT '状态: active, inactive, suspended',
				created_at BIGINT(20) NOT NULL,
				updated_at BIGINT(20) NOT NULL,
				PRIMARY KEY (id),
				UNIQUE KEY uk_code (code),
				KEY idx_status (status)
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学校表'`,
		},
		{
			name: "teachers",
			createSQL: `CREATE TABLE IF NOT EXISTS teachers (
				id BIGINT(20) NOT NULL AUTO_INCREMENT,
				user_id BIGINT(20) NOT NULL COMMENT '关联用户ID',
				school_id BIGINT(20) NOT NULL COMMENT '所属学校ID',
				name VARCHAR(50) NOT NULL COMMENT '教师姓名',
				employee_id VARCHAR(50) DEFAULT NULL COMMENT '工号',
				department VARCHAR(100) DEFAULT NULL COMMENT '院系/部门',
				phone VARCHAR(20) DEFAULT NULL COMMENT '联系电话',
				status VARCHAR(20) NOT NULL DEFAULT 'active' COMMENT '状态: active, inactive',
				created_at BIGINT(20) NOT NULL,
				updated_at BIGINT(20) NOT NULL,
				PRIMARY KEY (id),
				UNIQUE KEY uk_user_id (user_id),
				KEY idx_school_id (school_id),
				KEY idx_status (status)
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='教师表'`,
		},
		{
			name: "invite_codes",
			createSQL: `CREATE TABLE IF NOT EXISTS invite_codes (
				id BIGINT(20) NOT NULL AUTO_INCREMENT,
				code VARCHAR(50) NOT NULL UNIQUE COMMENT '邀请码',
				school_id BIGINT(20) NOT NULL COMMENT '学校ID',
				teacher_id BIGINT(20) NOT NULL COMMENT '创建教师ID',
				type VARCHAR(20) NOT NULL DEFAULT 'student' COMMENT '类型: student, teacher',
				max_uses INT NOT NULL DEFAULT 100 COMMENT '最大使用次数',
				used_count INT NOT NULL DEFAULT 0 COMMENT '已使用次数',
				status VARCHAR(20) NOT NULL DEFAULT 'active' COMMENT '状态: active, expired, revoked',
				expires_at BIGINT(20) DEFAULT NULL COMMENT '过期时间',
				created_at BIGINT(20) NOT NULL,
				updated_at BIGINT(20) NOT NULL,
				PRIMARY KEY (id),
				UNIQUE KEY uk_code (code),
				KEY idx_school_id (school_id),
				KEY idx_teacher_id (teacher_id),
				KEY idx_status (status)
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='邀请码表'`,
		},
		{
			name: "student_schools",
			createSQL: `CREATE TABLE IF NOT EXISTS student_schools (
				id BIGINT(20) NOT NULL AUTO_INCREMENT,
				student_id BIGINT(20) NOT NULL COMMENT '学生ID',
				school_id BIGINT(20) NOT NULL COMMENT '学校ID',
				teacher_id BIGINT(20) DEFAULT NULL COMMENT '教师ID',
				class_name VARCHAR(50) DEFAULT NULL COMMENT '班级名称',
				grade VARCHAR(20) DEFAULT NULL COMMENT '年级',
				invite_code_id BIGINT(20) DEFAULT NULL COMMENT '使用的邀请码ID',
				status VARCHAR(20) NOT NULL DEFAULT 'active' COMMENT '状态: active, graduated, transferred',
				joined_at BIGINT(20) NOT NULL COMMENT '加入时间',
				created_at BIGINT(20) NOT NULL,
				updated_at BIGINT(20) NOT NULL,
				PRIMARY KEY (id),
				UNIQUE KEY uk_student_school (student_id, school_id),
				KEY idx_school_id (school_id),
				KEY idx_status (status)
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学生-学校关联表'`,
		},
		{
			name: "student_task_progress",
			createSQL: `CREATE TABLE IF NOT EXISTS student_task_progress (
				id BIGINT(20) NOT NULL AUTO_INCREMENT,
				student_id BIGINT(20) NOT NULL COMMENT '学生ID',
				school_id BIGINT(20) NOT NULL COMMENT '学校ID',
				task_series_id INT NOT NULL COMMENT '任务系列ID (1-8)',
				task_name VARCHAR(100) NOT NULL COMMENT '任务名称',
				task_type VARCHAR(50) NOT NULL COMMENT '任务类型: holland_test, resume_upload, career_plan, interview, etc.',
				status VARCHAR(20) NOT NULL DEFAULT 'not_started' COMMENT '状态: not_started, in_progress, completed, skipped',
				completion_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT '完成度 (0-100)',
				score DECIMAL(5,2) DEFAULT NULL COMMENT '任务得分',
				started_at BIGINT(20) DEFAULT NULL COMMENT '开始时间',
				completed_at BIGINT(20) DEFAULT NULL COMMENT '完成时间',
				created_at BIGINT(20) NOT NULL,
				updated_at BIGINT(20) NOT NULL,
				PRIMARY KEY (id),
				UNIQUE KEY uk_student_series (student_id, task_series_id),
				KEY idx_school_id (school_id),
				KEY idx_status (status),
				KEY idx_completion_rate (completion_rate)
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学生任务进度表'`,
		},
		{
			name: "alert_records",
			createSQL: `CREATE TABLE IF NOT EXISTS alert_records (
				id BIGINT(20) NOT NULL AUTO_INCREMENT,
				student_id BIGINT(20) NOT NULL COMMENT '学生ID',
				school_id BIGINT(20) NOT NULL COMMENT '学校ID',
				teacher_id BIGINT(20) NOT NULL COMMENT '教师ID',
				alert_type VARCHAR(50) NOT NULL COMMENT '预警类型: low_completion, no_activity, deadline_warning',
				alert_level VARCHAR(20) NOT NULL COMMENT '预警级别: low, medium, high, critical',
				description TEXT NOT NULL COMMENT '预警描述',
				completion_rate DECIMAL(5,2) NOT NULL COMMENT '当前完成度',
				total_tasks INT NOT NULL COMMENT '总任务数',
				completed_tasks INT NOT NULL COMMENT '已完成任务数',
				status VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT '状态: pending, resolved, ignored',
				resolved_at BIGINT(20) DEFAULT NULL COMMENT '解决时间',
				created_at BIGINT(20) NOT NULL,
				updated_at BIGINT(20) NOT NULL,
				PRIMARY KEY (id),
				KEY idx_student_id (student_id),
				KEY idx_school_id (school_id),
				KEY idx_teacher_id (teacher_id),
				KEY idx_status (status),
				KEY idx_alert_type (alert_type),
				KEY idx_created_at (created_at)
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='预警记录表'`,
		},
		{
			name: "messages",
			createSQL: `CREATE TABLE IF NOT EXISTS messages (
				id BIGINT(20) NOT NULL AUTO_INCREMENT,
				sender_id BIGINT(20) NOT NULL COMMENT '发送者ID',
				sender_type VARCHAR(20) NOT NULL COMMENT '��送者类型: teacher, student, system',
				receiver_id BIGINT(20) NOT NULL COMMENT '接收者ID',
				receiver_type VARCHAR(20) NOT NULL COMMENT '接收者类型: teacher, student',
				title VARCHAR(200) DEFAULT NULL COMMENT '消息标题',
				content TEXT NOT NULL COMMENT '消息内容',
				message_type VARCHAR(50) NOT NULL DEFAULT 'system' COMMENT '消息类型: task_reminder, alert, system, note',
				status VARCHAR(20) NOT NULL DEFAULT 'unread' COMMENT '状态: unread, read',
				created_at BIGINT(20) NOT NULL,
				read_at BIGINT(20) DEFAULT NULL COMMENT '阅读时间',
				PRIMARY KEY (id),
				KEY idx_sender (sender_id, sender_type),
				KEY idx_receiver (receiver_id, receiver_type),
				KEY idx_status (status),
				KEY idx_created (created_at)
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='消息表'`,
		},
		{
			name: "chat_groups",
			createSQL: `CREATE TABLE IF NOT EXISTS chat_groups (
				id BIGINT(20) NOT NULL AUTO_INCREMENT,
				school_id BIGINT(20) NOT NULL COMMENT '学校ID',
				name VARCHAR(100) DEFAULT NULL COMMENT '群组名称',
				chat_type VARCHAR(20) NOT NULL DEFAULT 'direct' COMMENT '群组类型: direct(一对一)',
				created_by BIGINT(20) NOT NULL COMMENT '创建者ID',
				created_at BIGINT(20) NOT NULL,
				updated_at BIGINT(20) NOT NULL,
				PRIMARY KEY (id),
				KEY idx_school (school_id),
				KEY idx_created_by (created_by)
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='聊天群组表'`,
		},
		{
			name: "chat_group_members",
			createSQL: `CREATE TABLE IF NOT EXISTS chat_group_members (
				id BIGINT(20) NOT NULL AUTO_INCREMENT,
				group_id BIGINT(20) NOT NULL COMMENT '群组ID',
				user_id BIGINT(20) NOT NULL COMMENT '用户ID',
				user_type VARCHAR(20) NOT NULL COMMENT '用户类型: teacher, student',
				user_name VARCHAR(100) DEFAULT NULL COMMENT '用户名称',
				role VARCHAR(20) NOT NULL DEFAULT 'member' COMMENT '角色: owner(创建者), member(成员)',
				joined_at BIGINT(20) NOT NULL,
				last_read_at BIGINT(20) DEFAULT NULL COMMENT '最后已读时间',
				PRIMARY KEY (id),
				UNIQUE KEY uk_group_user (group_id, user_id, user_type),
				KEY idx_user (user_id, user_type)
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='群组成员表'`,
		},
		{
			name: "chat_messages",
			createSQL: `CREATE TABLE IF NOT EXISTS chat_messages (
				id BIGINT(20) NOT NULL AUTO_INCREMENT,
				group_id BIGINT(20) NOT NULL COMMENT '群组ID',
				sender_id BIGINT(20) NOT NULL COMMENT '发送者ID',
				sender_type VARCHAR(20) NOT NULL COMMENT '发送者类型: teacher, student',
				sender_name VARCHAR(100) DEFAULT NULL COMMENT '发送者名称',
				content TEXT NOT NULL COMMENT '消息内容',
				created_at BIGINT(20) NOT NULL,
				PRIMARY KEY (id),
				KEY idx_group (group_id, created_at)
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='聊天消息表'`,
		},
	}

	for _, table := range tables {
		exists, err := tableExists(db, table.name)
		if err != nil {
			return fmt.Errorf("检查表 %s 是否存在失败: %w", table.name, err)
		}

		if !exists {
			if _, err := db.Exec(table.createSQL); err != nil {
				return fmt.Errorf("创建表 %s 失败: %w", table.name, err)
			}
			fmt.Printf("[DB-SYNC] 表 %s 不存在，已按内置结构创建\n", table.name)
			continue
		}

		matched, err := isTableSchemaMatched(db, table.name, table.createSQL)
		if err != nil {
			return fmt.Errorf("比对表 %s 结构失败: %w", table.name, err)
		}

		if matched {
			continue
		}

		fmt.Printf("[DB-SYNC] 检测到表 %s 结构不一致，正在同步为内置结构（保留数据）...\n", table.name)
		if err := syncTableByBuiltinSchema(db, table.name, table.createSQL); err != nil {
			return fmt.Errorf("同步表 %s 结构失败: %w", table.name, err)
		}
		fmt.Printf("[DB-SYNC] 表 %s 已完成结构同步\n", table.name)
		logx.Infof("Table %s schema synced from builtin definition", table.name)
	}

	logx.Infof("Database migration completed")

	// Seed initial data using existing seedData function
	if err := seedData(dataSource); err != nil {
		logx.Errorf("Seed data failed: %v", err)
	} else {
		logx.Info("Initial data seeded successfully")
	}

	return nil
}

func tableExists(db *sql.DB, tableName string) (bool, error) {
	var count int
	err := db.QueryRow(`
		SELECT COUNT(*)
		FROM information_schema.tables
		WHERE table_schema = DATABASE() AND table_name = ?
	`, tableName).Scan(&count)
	if err != nil {
		return false, err
	}

	return count > 0, nil
}

func isTableSchemaMatched(db *sql.DB, tableName, expectedCreateSQL string) (bool, error) {
	query := fmt.Sprintf("SHOW CREATE TABLE `%s`", tableName)

	var currentTableName string
	var currentCreateSQL string
	if err := db.QueryRow(query).Scan(&currentTableName, &currentCreateSQL); err != nil {
		return false, err
	}

	currentSchema, err := parseCreateTableSchema(currentCreateSQL)
	if err != nil {
		return false, err
	}

	expectedSchema, err := parseCreateTableSchema(expectedCreateSQL)
	if err != nil {
		return false, err
	}

	for name := range expectedSchema.Columns {
		if _, ok := currentSchema.Columns[name]; !ok {
			return false, nil
		}
	}

	return true, nil
}

func syncTableByBuiltinSchema(db *sql.DB, tableName, createSQL string) error {
	var currentTableName string
	var currentCreateSQL string
	showSQL := fmt.Sprintf("SHOW CREATE TABLE `%s`", tableName)
	if err := db.QueryRow(showSQL).Scan(&currentTableName, &currentCreateSQL); err != nil {
		return fmt.Errorf("read current create sql failed: %w", err)
	}

	currentSchema, err := parseCreateTableSchema(currentCreateSQL)
	if err != nil {
		return fmt.Errorf("parse current schema failed: %w", err)
	}

	expectedSchema, err := parseCreateTableSchema(createSQL)
	if err != nil {
		return fmt.Errorf("parse expected schema failed: %w", err)
	}

	if _, err := db.Exec("SET FOREIGN_KEY_CHECKS = 0"); err != nil {
		return fmt.Errorf("disable foreign key checks failed: %w", err)
	}
	defer func() {
		if _, err := db.Exec("SET FOREIGN_KEY_CHECKS = 1"); err != nil {
			logx.Errorf("failed to re-enable foreign key checks: %v", err)
		}
	}()

	statements := buildAlterStatements(currentSchema, expectedSchema)
	for _, stmt := range statements {
		alterSQL := fmt.Sprintf("ALTER TABLE `%s` %s", tableName, stmt)
		fmt.Printf("[DB-SYNC] 执行: %s\n", alterSQL)
		if _, err := db.Exec(alterSQL); err != nil {
			return fmt.Errorf("execute alter failed: %w", err)
		}
	}

	if len(statements) == 0 {
		fmt.Printf("[DB-SYNC] 表 %s 无需 ALTER 变更\n", tableName)
	}

	return nil
}

type tableSchema struct {
	Columns     map[string]string
	ColumnOrder []string
	PrimaryKey  string
	Indexes     map[string]string
	ForeignKeys map[string]string
}

func parseCreateTableSchema(createSQL string) (*tableSchema, error) {
	start := strings.Index(createSQL, "(")
	end := strings.LastIndex(createSQL, ")")
	if start == -1 || end == -1 || end <= start {
		return nil, fmt.Errorf("invalid create table sql")
	}

	body := createSQL[start+1 : end]
	lines := strings.Split(body, "\n")

	schema := &tableSchema{
		Columns:     make(map[string]string),
		ColumnOrder: make([]string, 0),
		Indexes:     make(map[string]string),
		ForeignKeys: make(map[string]string),
	}

	for _, rawLine := range lines {
		line := strings.TrimSpace(rawLine)
		line = strings.TrimSuffix(line, ",")
		if line == "" {
			continue
		}

		upper := strings.ToUpper(line)
		switch {
		case strings.HasPrefix(upper, "PRIMARY KEY"):
			schema.PrimaryKey = line
		case strings.HasPrefix(upper, "UNIQUE KEY") || strings.HasPrefix(upper, "KEY "):
			name, ok := parseIndexName(line)
			if ok {
				schema.Indexes[name] = line
			}
		case strings.HasPrefix(upper, "CONSTRAINT "):
			name, ok := parseConstraintName(line)
			if ok {
				schema.ForeignKeys[name] = line
			}
		default:
			name, ok := parseColumnName(line)
			if ok {
				schema.Columns[name] = line
				schema.ColumnOrder = append(schema.ColumnOrder, name)
			}
		}
	}

	return schema, nil
}

func parseColumnName(line string) (string, bool) {
	if strings.HasPrefix(line, "`") {
		end := strings.Index(line[1:], "`")
		if end == -1 {
			return "", false
		}
		return line[1 : end+1], true
	}

	parts := strings.Fields(line)
	if len(parts) == 0 {
		return "", false
	}

	first := strings.ToUpper(parts[0])
	if first == "PRIMARY" || first == "KEY" || first == "UNIQUE" || first == "CONSTRAINT" {
		return "", false
	}

	return parts[0], true
}

func parseIndexName(line string) (string, bool) {
	re := regexp.MustCompile(`(?i)^(?:unique\s+key|key)\s+` + "`" + `?([a-zA-Z0-9_]+)` + "`" + `?`)
	matches := re.FindStringSubmatch(line)
	if len(matches) < 2 {
		return "", false
	}

	return matches[1], true
}

func parseConstraintName(line string) (string, bool) {
	re := regexp.MustCompile(`(?i)^constraint\s+` + "`" + `?([a-zA-Z0-9_]+)` + "`" + `?`)
	matches := re.FindStringSubmatch(line)
	if len(matches) < 2 {
		return "", false
	}

	return matches[1], true
}

func buildAlterStatements(current, expected *tableSchema) []string {
	statements := make([]string, 0)

	for _, colName := range expected.ColumnOrder {
		expectedDef := expected.Columns[colName]
		_, ok := current.Columns[colName]
		if !ok {
			statements = append(statements, fmt.Sprintf("ADD COLUMN %s", expectedDef))
		}
	}

	return statements
}

func normalizeCreateSQL(sqlText string) string {
	normalized := strings.ToLower(sqlText)
	normalized = strings.ReplaceAll(normalized, "`", "")

	// Ignore runtime auto-increment values when comparing schemas.
	autoIncrementPattern := regexp.MustCompile(`auto_increment=\d+`)
	normalized = autoIncrementPattern.ReplaceAllString(normalized, "")

	spacePattern := regexp.MustCompile(`\s+`)
	normalized = spacePattern.ReplaceAllString(normalized, " ")

	return strings.TrimSpace(normalized)
}

// migrateColumns adds new columns to existing tables without breaking old data
func migrateColumns(dataSource string) error {
	db, err := sql.Open("mysql", dataSource)
	if err != nil {
		return fmt.Errorf("failed to connect: %w", err)
	}
	defer db.Close()

	migrations := []struct {
		table  string
		column string
		sql    string
	}{
		// users table - add school_id
		{"users", "school_id", "ALTER TABLE users ADD COLUMN school_id BIGINT(20) DEFAULT NULL"},
		{"users", "idx_school_id", "ALTER TABLE users ADD KEY idx_school_id (school_id)"},
		// students table - add task_completion_rate and last_activity_at
		{"students", "task_completion_rate", "ALTER TABLE students ADD COLUMN task_completion_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT '8系列任务总完成度'"},
		{"students", "last_activity_at", "ALTER TABLE students ADD COLUMN last_activity_at BIGINT(20) DEFAULT NULL COMMENT '最后活动时间'"},
		// student_schools table - add teacher_id
		{"student_schools", "teacher_id", "ALTER TABLE student_schools ADD COLUMN teacher_id BIGINT(20) DEFAULT NULL COMMENT '教师ID'"},
		// jobs table - add new fields from Excel data
		{"jobs", "job_code", "ALTER TABLE jobs ADD COLUMN job_code VARCHAR(50) DEFAULT NULL COMMENT '外部岗位编码'"},
		{"jobs", "idx_job_code", "ALTER TABLE jobs ADD KEY idx_job_code (job_code)"},
		{"jobs", "company_scale", "ALTER TABLE jobs ADD COLUMN company_scale VARCHAR(50) DEFAULT NULL COMMENT '公司规模'"},
		{"jobs", "idx_company_scale", "ALTER TABLE jobs ADD KEY idx_company_scale (company_scale)"},
		{"jobs", "company_funding_status", "ALTER TABLE jobs ADD COLUMN company_funding_status VARCHAR(50) DEFAULT NULL COMMENT '融资状态'"},
		{"jobs", "company_description", "ALTER TABLE jobs ADD COLUMN company_description TEXT DEFAULT NULL COMMENT '公司详情'"},
		{"jobs", "source_url", "ALTER TABLE jobs ADD COLUMN source_url VARCHAR(500) DEFAULT NULL COMMENT '来源URL'"},
		{"jobs", "update_date", "ALTER TABLE jobs ADD COLUMN update_date DATE DEFAULT NULL COMMENT '更新日期'"},
		{"jobs", "job_detail", "ALTER TABLE jobs ADD COLUMN job_detail TEXT DEFAULT NULL COMMENT '详细岗位职责'"},
	}

	for _, m := range migrations {
		var exists int
		// Check if it's an index migration (ends with _idx)
		isIndex := strings.HasPrefix(m.column, "idx_")

		if isIndex {
			// Check if index exists in information_schema.statistics
			checkSQL := fmt.Sprintf("SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = '%s' AND index_name = '%s'", m.table, m.column)
			if err := db.QueryRow(checkSQL).Scan(&exists); err != nil {
				logx.Errorf("Failed to check index %s.%s: %v", m.table, m.column, err)
				continue
			}
		} else {
			// Check if column exists in information_schema.columns
			checkSQL := fmt.Sprintf("SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = '%s' AND column_name = '%s'", m.table, m.column)
			if err := db.QueryRow(checkSQL).Scan(&exists); err != nil {
				logx.Errorf("Failed to check column %s.%s: %v", m.table, m.column, err)
				continue
			}
		}

		if exists > 0 {
			continue // Column/Index already exists
		}

		// Add column/index
		if _, err := db.Exec(m.sql); err != nil {
			logx.Errorf("Failed to add %s.%s: %v", m.table, m.column, err)
			continue
		}
		logx.Infof("Added %s: %s.%s", map[bool]string{true: "index", false: "column"}[isIndex], m.table, m.column)
	}

	logx.Infof("Column migration completed")
	return nil
}

func seedData(dataSource string) error {
	db, err := sql.Open("mysql", dataSource)
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}
	defer db.Close()

	tx, err := db.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin seed transaction: %w", err)
	}

	fkDisabled := false
	defer func() {
		if fkDisabled {
			if _, setErr := tx.Exec("SET FOREIGN_KEY_CHECKS = 1"); setErr != nil && setErr != sql.ErrTxDone {
				logx.Errorf("failed to restore foreign key checks in seedData: %v", setErr)
			}
		}
		if rollbackErr := tx.Rollback(); rollbackErr != nil && rollbackErr != sql.ErrTxDone {
			logx.Errorf("seed transaction rollback failed: %v", rollbackErr)
		}
	}()

	if _, err := tx.Exec("SET FOREIGN_KEY_CHECKS = 0"); err != nil {
		return fmt.Errorf("failed to disable foreign key checks in seedData: %w", err)
	}
	fkDisabled = true

	now := time.Now().Unix()

	var userCount int
	err = tx.QueryRow("SELECT COUNT(*) FROM users WHERE username = 'testuser'").Scan(&userCount)
	if err != nil && err != sql.ErrNoRows {
		return fmt.Errorf("failed to check user: %w", err)
	}
	if userCount == 0 {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte("123456"), bcrypt.DefaultCost)
		if err != nil {
			return fmt.Errorf("failed to hash password: %w", err)
		}
		_, err = tx.Exec("INSERT INTO users (username, password, email, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
			"testuser", string(hashedPassword), "test@example.com", "user", now, now)
		if err != nil {
			return fmt.Errorf("failed to insert test user: %w", err)
		}
		logx.Infof("Test user created: testuser / 123456")
	}

	// Seed test school
	var schoolCount int
	err = tx.QueryRow("SELECT COUNT(*) FROM schools").Scan(&schoolCount)
	if err != nil && err != sql.ErrNoRows {
		return fmt.Errorf("failed to check school: %w", err)
	}
	if schoolCount == 0 {
		schoolCode := pkg.GenerateSchoolCode()
		_, err = tx.Exec("INSERT INTO schools (name, code, address, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
			"测试高中", schoolCode, "北京市朝阳区", "active", now, now)
		if err != nil {
			return fmt.Errorf("failed to insert test school: %w", err)
		}
		logx.Infof("Test school created: %s - 测试高中", schoolCode)
	}

	var jobCount int
	err = tx.QueryRow("SELECT COUNT(*) FROM jobs").Scan(&jobCount)
	if err != nil && err != sql.ErrNoRows {
		return fmt.Errorf("failed to check jobs: %w", err)
	}
	if jobCount == 0 {
		jobs := []struct {
			name         string
			industry     string
			category     string
			description  string
			requirements string
			salaryRange  string
			company      string
			location     string
		}{
			{"Golang后端开发工程师", "技术", "后端", "负责公司后端服务开发，参与微服务架构设计与实现", "熟练掌握Golang编程语言，熟悉MySQL/Redis，了解微服务架构", "15000-30000", "字节跳动", "北京"},
			{"Java开发工程师", "技术", "后端", "负责企业级应用后端开发，参与系统架构设计", "熟练掌握Java，熟悉Spring框架，了解分布式系统", "12000-25000", "阿里巴巴", "杭州"},
			{"前端开发工程师", "技术", "前端", "负责Web前端开发，与后端工程师协作完成产品功能", "熟练掌握Vue/React，熟悉HTML/CSS/JavaScript", "12000-22000", "腾讯", "深圳"},
			{"Python数据分析师", "数据", "分析", "负责数据分析和可视化，为业务决策提供支持", "熟练掌握Python，熟悉Pandas/NumPy，了解数据可视化", "15000-28000", "美团", "北京"},
			{"产品经理", "产品", "产品", "负责产品规划与设计，协调研发团队推动产品迭代", "良好的沟通能力，了解互联网产品，有项目管理经验", "18000-35000", "字节跳动", "北京"},
			{"UI设计师", "设计", "设计", "负责产品界面设计，提升用户体验", "熟练掌握Figma/Sketch，了解用户体验设计原则", "15000-28000", "网易", "杭州"},
			{"测试工程师", "技术", "测试", "负责产品测试工作，保障软件质量", "熟悉测试流程，了解自动化测试框架", "10000-20000", "华为", "深圳"},
			{"运维工程师", "技术", "运维", "负责服务器运维，保障系统稳定运行", "熟悉Linux，了解Docker/K8s，有运维经验", "15000-25000", "阿里巴巴", "杭州"},
			{"新媒体运营", "运营", "运营", "负责新媒体平台运营，策划优质内容", "熟悉各平台运营规则，有内容策划能力", "8000-15000", "小红书", "上海"},
			{"内容编辑", "内容", "编辑", "负责内容策划与编辑，产出优质文章", "良好的文字功底，了解内容运营", "7000-14000", "今日头条", "北京"},
		}

		inserted := 0
		failed := 0
		for _, job := range jobs {
			_, err = tx.Exec(`INSERT INTO jobs (name, industry, category, description, requirements, salary_range, company, location, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
				job.name, job.industry, job.category, job.description, job.requirements, job.salaryRange, job.company, job.location, now, now)
			if err == nil {
				inserted++
				continue
			}

			if strings.Contains(strings.ToLower(err.Error()), "check constraint") {
				// Some existing databases may have legacy CHECK constraints on optional fields.
				_, fallbackErr := tx.Exec(`INSERT INTO jobs (name, created_at, updated_at) VALUES (?, ?, ?)`, job.name, now, now)
				if fallbackErr == nil {
					inserted++
					logx.Infof("Seed fallback succeeded for job %s (minimal fields)", job.name)
					continue
				}
				logx.Errorf("Failed to insert job %s (fallback also failed): %v", job.name, fallbackErr)
				failed++
				continue
			}

			logx.Errorf("Failed to insert job %s: %v", job.name, err)
			failed++
		}
		logx.Infof("Sample jobs seeded: %d success, %d failed", inserted, failed)
	}

	if _, err := tx.Exec("SET FOREIGN_KEY_CHECKS = 1"); err != nil {
		return fmt.Errorf("failed to re-enable foreign key checks in seedData: %w", err)
	}
	fkDisabled = false

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit seed transaction: %w", err)
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
