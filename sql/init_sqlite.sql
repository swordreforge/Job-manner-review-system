-- 教师端 API SQLite 数据库初始化脚本（用于登录功能）

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'teacher',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_username ON users(username);

-- 插入默认管理员用户 (密码: admin123)
-- 注意：这里的 UUID 是固定的，实际使用时应该由应用生成
INSERT OR IGNORE INTO users (id, username, password_hash, name, role, created_at, updated_at)
VALUES (
    '550e8400-e29b-41d4-a716-446655440001',
    'admin',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4wJqQqJqJqJqJqJq',
    '管理员',
    'admin',
    datetime('now'),
    datetime('now')
);

-- 插入默认教师用户 (密码: teacher123)
INSERT OR IGNORE INTO users (id, username, password_hash, name, role, created_at, updated_at)
VALUES (
    '550e8400-e29b-41d4-a716-446655440002',
    'teacher',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4wJqQqJqJqJqJqJq',
    '教师',
    'teacher',
    datetime('now'),
    datetime('now')
);