CREATE TABLE IF NOT EXISTS users (
    id BIGINT NOT NULL AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'user',
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY idx_username (username),
    UNIQUE KEY idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    PRIMARY KEY (id),
    KEY idx_industry (industry),
    KEY idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS job_promotion_paths (
    id BIGINT NOT NULL AUTO_INCREMENT,
    from_job_id BIGINT NOT NULL,
    to_job_id BIGINT NOT NULL,
    match_score FLOAT,
    transfer_skills JSON,
    learning_path JSON,
    PRIMARY KEY (id),
    KEY idx_from_job (from_job_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    PRIMARY KEY (id),
    KEY idx_user (user_id),
    KEY idx_major (major)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    PRIMARY KEY (id),
    KEY idx_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
    created_at BIGINT NOT NULL,
    PRIMARY KEY (id),
    KEY idx_student (student_id),
    KEY idx_job (job_id),
    KEY idx_score (overall_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS holland_test_results (
    id BIGINT NOT NULL AUTO_INCREMENT,
    student_id BIGINT NOT NULL,
    career_code VARCHAR(10) NOT NULL COMMENT '职业代码，如RIA、SEC',
    scores JSON NOT NULL COMMENT '各类型得分，如{"R":4,"I":3,"A":2,"S":1,"E":1,"C":0}',
    suitable_jobs JSON NOT NULL COMMENT '推荐职业列表',
    description TEXT COMMENT '测试结果描述',
    created_at BIGINT NOT NULL,
    PRIMARY KEY (id),
    KEY idx_student_id (student_id),
    KEY idx_career_code (career_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
