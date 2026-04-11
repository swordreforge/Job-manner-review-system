-- 教师端 API 数据库初始化脚本

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(50) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'teacher',
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建学生表
CREATE TABLE IF NOT EXISTS students (
    id CHAR(36) PRIMARY KEY,
    student_no VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL,
    gender VARCHAR(10),
    age INT,
    class_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    address VARCHAR(255),
    parent_name VARCHAR(50),
    parent_phone VARCHAR(20),
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    INDEX idx_student_no (student_no),
    INDEX idx_class_name (class_name),
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入默认管理员用户 (密码: admin123)
INSERT INTO users (id, username, password_hash, name, role, created_at, updated_at)
VALUES (
    UUID(),
    'admin',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4wJqQqJqJqJqJqJq',
    '管理员',
    'admin',
    NOW(),
    NOW()
) ON DUPLICATE KEY UPDATE username=username;

-- 插入默认教师用户 (密码: teacher123)
INSERT INTO users (id, username, password_hash, name, role, created_at, updated_at)
VALUES (
    UUID(),
    'teacher',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4wJqQqJqJqJqJqJq',
    '教师',
    'teacher',
    NOW(),
    NOW()
) ON DUPLICATE KEY UPDATE username=username;