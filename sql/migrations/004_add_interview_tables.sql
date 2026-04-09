-- 面试模块数据库迁移脚本
-- 创建时间: 2026-04-09

-- 1. 创建面试会话表
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
    created_at BIGINT NOT NULL COMMENT '创建时间',
    updated_at BIGINT NOT NULL COMMENT '更新时间',
    completed_at BIGINT COMMENT '完成时间',
    PRIMARY KEY (id),
    KEY idx_user (user_id),
    KEY idx_student (student_id),
    KEY idx_status (status),
    KEY idx_created (created_at),
    KEY idx_user_status (user_id, status),
    CONSTRAINT fk_interview_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_interview_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='面试会话表';

-- 2. 创建面试对话记录表
CREATE TABLE IF NOT EXISTS interview_messages (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '消息ID',
    session_id BIGINT NOT NULL COMMENT '会话ID，关联interview_sessions表',
    role VARCHAR(20) NOT NULL COMMENT '角色：user-用户, assistant-AI面试官',
    content TEXT NOT NULL COMMENT '消息内容',
    question_type VARCHAR(50) COMMENT '问题类型：self_intro-自我介绍, project-项目经验, technical-技术问题, hr-人事问题',
    score DECIMAL(5,2) COMMENT '评分（仅AI回复时有效）',
    feedback TEXT COMMENT '反馈内容（仅AI回复时有效）',
    created_at BIGINT NOT NULL COMMENT '创建时间',
    PRIMARY KEY (id),
    KEY idx_session (session_id),
    KEY idx_role (role),
    KEY idx_created (created_at),
    KEY idx_session_created (session_id, created_at),
    CONSTRAINT fk_interview_message_session FOREIGN KEY (session_id) REFERENCES interview_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='面试对话记录表';

-- 3. 创建面试评估报告表
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
    created_at BIGINT NOT NULL COMMENT '创建时间',
    updated_at BIGINT NOT NULL COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY idx_session (session_id),
    KEY idx_user (user_id),
    KEY idx_score (overall_score),
    KEY idx_user_score (user_id, overall_score DESC),
    CONSTRAINT fk_interview_report_session FOREIGN KEY (session_id) REFERENCES interview_sessions(id) ON DELETE CASCADE,
    CONSTRAINT fk_interview_report_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='面试评估报告表';

-- 创建额外的优化索引
CREATE INDEX idx_interview_sessions_created_desc ON interview_sessions(created_at DESC);

-- 插入测试数据（可选）
-- INSERT INTO interview_sessions (user_id, student_id, mode, status, created_at, updated_at) VALUES (1, 1, 'practice', 'completed', UNIX_TIMESTAMP(), UNIX_TIMESTAMP());