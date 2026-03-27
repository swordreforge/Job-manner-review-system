-- 添加简历优化建议和历史记录功能
-- Date: 2026-03-27

-- 1. 为students表添加优化建议和简历内容字段
ALTER TABLE students ADD COLUMN suggestions JSON COMMENT '简历优化建议';
ALTER TABLE students ADD COLUMN resume_content TEXT COMMENT '原始简历文本内容';

-- 2. 创建简历解析历史记录表
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
    created_at BIGINT NOT NULL COMMENT '创建时间戳',
    PRIMARY KEY (id),
    KEY idx_user (user_id),
    KEY idx_student (student_id),
    KEY idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='简历解析历史记录';