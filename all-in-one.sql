-- ============================================================
-- 职业规划助手系统 - All-in-One 数据库脚本
-- 数据库密码: 123456zj
-- 创建时间: 2026-04-09
-- ============================================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS career_planning DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE career_planning;

-- ============================================================
-- 1. 用户表
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id BIGINT NOT NULL AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'user',
    created_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP()),
    updated_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP()),
    PRIMARY KEY (id),
    UNIQUE KEY idx_username (username),
    UNIQUE KEY idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- ============================================================
-- 2. 职位表
-- ============================================================
CREATE TABLE IF NOT EXISTS jobs (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    company VARCHAR(100),
    industry VARCHAR(50),
    location VARCHAR(100),
    salary_range VARCHAR(50),
    skills JSON,
    certificates JSON,
    soft_skills JSON,
    requirements JSON,
    growth_potential VARCHAR(255),
    created_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP()),
    updated_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP()),
    PRIMARY KEY (id),
    KEY idx_industry (industry),
    KEY idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='职位表';

-- ============================================================
-- 3. 职业发展路径表
-- ============================================================
CREATE TABLE IF NOT EXISTS job_promotion_paths (
    id BIGINT NOT NULL AUTO_INCREMENT,
    from_job_id BIGINT NOT NULL,
    to_job_id BIGINT NOT NULL,
    match_score FLOAT,
    transfer_skills JSON,
    learning_path JSON,
    PRIMARY KEY (id),
    KEY idx_from_job (from_job_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='职业发展路径表';

-- ============================================================
-- 4. 学生档案表
-- ============================================================
CREATE TABLE IF NOT EXISTS students (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    name VARCHAR(50) NOT NULL,
    education VARCHAR(50),
    major VARCHAR(100),
    graduation_year INT,
    skills JSON,
    certificates JSON,
    soft_skills JSON,
    internship JSON,
    projects JSON,
    completeness_score FLOAT DEFAULT 0,
    competitiveness_score FLOAT DEFAULT 0,
    resume_url VARCHAR(255),
    suggestions JSON COMMENT '简历优化建议',
    resume_content TEXT COMMENT '原始简历文本内容',
    created_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP()),
    updated_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP()),
    PRIMARY KEY (id),
    KEY idx_user (user_id),
    KEY idx_major (major)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='学生档案表';

-- ============================================================
-- 5. 职业规划报告表
-- ============================================================
CREATE TABLE IF NOT EXISTS career_reports (
    id BIGINT NOT NULL AUTO_INCREMENT,
    student_id BIGINT NOT NULL,
    target_job_id BIGINT,
    title VARCHAR(200),
    content TEXT,
    overview JSON,
    match_analysis JSON,
    career_path JSON,
    action_plan JSON,
    status VARCHAR(20) DEFAULT 'draft',
    created_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP()),
    updated_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP()),
    PRIMARY KEY (id),
    KEY idx_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='职业规划报告表';

-- ============================================================
-- 6. 匹配记录表
-- ============================================================
CREATE TABLE IF NOT EXISTS match_records (
    id BIGINT NOT NULL AUTO_INCREMENT,
    student_id BIGINT NOT NULL,
    job_id BIGINT NOT NULL,
    overall_score FLOAT,
    skills_match FLOAT,
    certs_match FLOAT,
    soft_skills_match FLOAT,
    experience_match FLOAT,
    gap_analysis JSON,
    created_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP()),
    PRIMARY KEY (id),
    KEY idx_student (student_id),
    KEY idx_job (job_id),
    KEY idx_score (overall_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='匹配记录表';

-- ============================================================
-- 7. 霍兰德职业倾向测试结果表
-- ============================================================
CREATE TABLE IF NOT EXISTS holland_test_results (
    id BIGINT NOT NULL AUTO_INCREMENT,
    student_id BIGINT NOT NULL,
    career_code VARCHAR(10) NOT NULL COMMENT '职业代码，如RIA、SEC',
    scores JSON NOT NULL COMMENT '各类型得分，如{"R":4,"I":3,"A":2,"S":1,"E":1,"C":0}',
    suitable_jobs JSON NOT NULL COMMENT '推荐职业列表',
    description TEXT COMMENT '测试结果描述',
    created_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP()),
    PRIMARY KEY (id),
    KEY idx_student_id (student_id),
    KEY idx_career_code (career_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='霍兰德职业倾向测试结果表';

-- ============================================================
-- 8. 简历解析历史记录表
-- ============================================================
CREATE TABLE IF NOT EXISTS resume_parse_history (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    student_id BIGINT COMMENT '关联的学生档案ID（可选）',
    resume_file_name VARCHAR(255) COMMENT '上传的简历文件名',
    resume_content TEXT COMMENT '原始简历文本内容',
    parsed_profile JSON COMMENT '解析后的学生档案',
    suggestions JSON COMMENT '简历优化建议',
    completeness_score FLOAT DEFAULT 0 COMMENT '完整度评分',
    competitiveness_score FLOAT DEFAULT 0 COMMENT '竞争力评分',
    created_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP()) COMMENT '创建时间戳',
    PRIMARY KEY (id),
    KEY idx_user (user_id),
    KEY idx_student (student_id),
    KEY idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='简历解析历史记录';

-- ============================================================
-- 9. 面试会话表
-- ============================================================
CREATE TABLE IF NOT EXISTS interview_sessions (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '面试会话ID',
    user_id BIGINT NOT NULL COMMENT '用户ID，关联users表',
    student_id BIGINT COMMENT '学生ID，关联students表',
    mode VARCHAR(50) NOT NULL COMMENT '面试模式：practice-练习模式, assessment-评估模式',
    status VARCHAR(50) NOT NULL DEFAULT 'running' COMMENT '状态：running-进行中, completed-已完成, cancelled-已取消',
    total_questions INT DEFAULT 0 COMMENT '总问题数',
    current_question INT DEFAULT 0 COMMENT '当前问题序号',
    average_score DECIMAL(5,2) DEFAULT 0 COMMENT '平均分数',
    max_score DECIMAL(5,2) DEFAULT 0 COMMENT '最高分数',
    min_score DECIMAL(5,2) DEFAULT 0 COMMENT '最低分数',
    duration_seconds INT DEFAULT 0 COMMENT '面试时长（秒）',
    created_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP()) COMMENT '创建时间',
    updated_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP()) COMMENT '更新时间',
    completed_at BIGINT COMMENT '完成时间',
    PRIMARY KEY (id),
    KEY idx_user (user_id),
    KEY idx_student (student_id),
    KEY idx_status (status),
    KEY idx_created (created_at),
    KEY idx_user_status (user_id, status),
    KEY idx_created_desc (created_at DESC),
    CONSTRAINT fk_interview_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_interview_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='面试会话表';

-- ============================================================
-- 10. 面试对话记录表
-- ============================================================
CREATE TABLE IF NOT EXISTS interview_messages (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '消息ID',
    session_id BIGINT NOT NULL COMMENT '会话ID，关联interview_sessions表',
    role VARCHAR(20) NOT NULL COMMENT '角色：user-用户, assistant-AI面试官',
    content TEXT NOT NULL COMMENT '消息内容',
    question_type VARCHAR(50) COMMENT '问题类型：self_intro-自我介绍, project-项目经验, technical-技术问题, hr-人事问题',
    score DECIMAL(5,2) COMMENT '评分（仅AI回复时有效）',
    feedback TEXT COMMENT '反馈内容（仅AI回复时有效）',
    created_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP()) COMMENT '创建时间',
    PRIMARY KEY (id),
    KEY idx_session (session_id),
    KEY idx_role (role),
    KEY idx_created (created_at),
    KEY idx_session_created (session_id, created_at),
    CONSTRAINT fk_interview_message_session FOREIGN KEY (session_id) REFERENCES interview_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='面试对话记录表';

-- ============================================================
-- 11. 面试评估报告表
-- ============================================================
CREATE TABLE IF NOT EXISTS interview_reports (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '报告ID',
    session_id BIGINT NOT NULL COMMENT '会话ID，关联interview_sessions表',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    overall_score DECIMAL(5,2) NOT NULL COMMENT '综合评分',
    skill_score DECIMAL(5,2) COMMENT '技能评分',
    communication_score DECIMAL(5,2) COMMENT '沟通能力评分',
    logic_score DECIMAL(5,2) COMMENT '逻辑思维评分',
    confidence_score DECIMAL(5,2) COMMENT '自信程度评分',
    strengths JSON COMMENT '优势分析',
    weaknesses JSON COMMENT '劣势分析',
    improvement_suggestions JSON COMMENT '改进建议',
    summary TEXT COMMENT '总结',
    created_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP()) COMMENT '创建时间',
    updated_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP()) COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY idx_session (session_id),
    KEY idx_user (user_id),
    KEY idx_score (overall_score),
    KEY idx_user_score (user_id, overall_score DESC),
    CONSTRAINT fk_interview_report_session FOREIGN KEY (session_id) REFERENCES interview_sessions(id) ON DELETE CASCADE,
    CONSTRAINT fk_interview_report_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='面试评估报告表';

-- ============================================================
-- 自动更新 updated_at 的触发器
-- ============================================================

DELIMITER //

-- 用户表触发器
CREATE TRIGGER IF NOT EXISTS users_before_update
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
    SET NEW.updated_at = UNIX_TIMESTAMP();
END//

-- 学生档案表触发器
CREATE TRIGGER IF NOT EXISTS students_before_update
BEFORE UPDATE ON students
FOR EACH ROW
BEGIN
    SET NEW.updated_at = UNIX_TIMESTAMP();
END//

-- 职位表触发器
CREATE TRIGGER IF NOT EXISTS jobs_before_update
BEFORE UPDATE ON jobs
FOR EACH ROW
BEGIN
    SET NEW.updated_at = UNIX_TIMESTAMP();
END//

-- 职业规划报告表触发器
CREATE TRIGGER IF NOT EXISTS career_reports_before_update
BEFORE UPDATE ON career_reports
FOR EACH ROW
BEGIN
    SET NEW.updated_at = UNIX_TIMESTAMP();
END//

DELIMITER ;

-- ============================================================
-- 示例数据
-- ============================================================

-- 创建测试用户（密码: 123456zj 的 bcrypt 哈希）
-- 注意：这是示例哈希，实际使用时应该使用真实的 bcrypt 哈希
INSERT INTO users (username, password, email, phone, role) VALUES
('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin@example.com', '13800138000', 'admin'),
('testuser', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'test@example.com', '13800138001', 'user');

-- 创建示例学生档案
INSERT INTO students (user_id, name, education, major, graduation_year, skills, certificates, soft_skills) VALUES
(2, '张三', 'bachelor', '计算机科学与技术', 2025, 
 '[{"name":"Java","level":4,"years":2},{"name":"Python","level":3,"years":1},{"name":"Go","level":2,"years":0.5}]',
 '[{"name":"计算机二级","level":"优秀","year":2023},{"name":"英语四级","level":"及格","year":2022}]',
 '{"innovation":7,"learning":8,"pressure":6,"communication":7,"teamwork":8}');

-- 创建示例职位
INSERT INTO jobs (name, description, company, industry, location, salary_range, skills, requirements) VALUES
('Java后端工程师', '负责后端系统的开发和维护，要求熟悉Spring Boot框架', '某科技公司', '互联网', '北京', '15k-25k',
 '["Java","Spring Boot","MySQL","Redis"]', '["3年以上Java开发经验","熟悉微服务架构","良好的沟通能力"]'),
('前端开发工程师', '负责Web前端开发，要求熟悉React或Vue框架', '某科技公司', '互联网', '上海', '12k-20k',
 '["JavaScript","React","Vue","CSS"]', '["2年以上前端开发经验","熟悉前端工程化","良好的UI设计感"]'),
('数据分析师', '负责数据分析和报表制作，要求熟悉SQL和Python', '某数据公司', '大数据', '深圳', '18k-30k',
 '["Python","SQL","Excel","Tableau"]', '["3年以上数据分析经验","熟悉统计学知识","良好的数据敏感度"]');

-- ============================================================
-- 完成提示
-- ============================================================
SELECT 'Database setup completed successfully!' AS message;
SELECT 'Database name: career_planning' AS info;
SELECT 'Default user: admin / 123456zj' AS info;
SELECT 'Test user: testuser / 123456zj' AS info;