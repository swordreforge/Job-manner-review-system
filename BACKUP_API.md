# 数据库备份恢复 API 文档

本文档描述了教师端应用的数据库备份和恢复 API。

## 概述

数据库备份恢复功能使用 `mysqldump`/`mariadb-dump` 和 `mysql` 命令来执行备份和恢复操作。所有备份文件以 `.sql` 格式存储在指定的目录中。

## 平台支持

| 功能 | Linux | macOS | Windows |
|------|-------|-------|---------|
| 创建备份 | ✅ | ✅ | ❌ |
| 恢复数据库 | ✅ | ✅ | ❌ |
| 列出备份 | ✅ | ✅ | ✅ |
| 下载备份 | ✅ | ✅ | ✅ |
| 删除备份 | ✅ | ✅ | ✅ |

**Windows 限制：**
- 备份和恢复功能在 Windows 上不可用
- 会返回友好的错误提示，建议使用其他工具
- 查看和删除备份功能仍然可用

**Windows 替代方案：**
1. 使用 MySQL Workbench 手动导出/导入数据库
2. 使用命令行工具：
   ```bash
   # 备份
   mysqldump -h localhost -P 3306 -u root -p career_db > backup.sql
   
   # 恢复
   mysql -h localhost -P 3306 -u root -p career_db < backup.sql
   ```
3. 在 Linux/macOS 环境中使用 `backup-db.sh` 脚本

## API 端点

### 1. 创建备份

**端点**: `POST /api/v1/ops/backup`

**认证**: 需要认证

**请求体**:
```json
{
  "output_dir": "."  // 可选，默认为当前目录
}
```

**响应**:
```json
{
  "code": 200,
  "message": "Database backup completed successfully",
  "data": {
    "backup_id": "550e8400-e29b-41d4-a716-446655440000",
    "filename": "career_db_backup_20260413_123456.sql",
    "file_path": "./career_db_backup_20260413_123456.sql",
    "file_size": 123456,
    "created_at": 1718285096
  }
}
```

### 2. 恢复数据库

**端点**: `POST /api/v1/ops/restore`

**认证**: 需要认证

**请求体**:
```json
{
  "filename": "career_db_backup_20260413_123456.sql",
  "backup_dir": "."  // 可选，默认为当前目录
}
```

**响应**:
```json
{
  "code": 200,
  "message": "Database restored successfully",
  "data": {
    "filename": "career_db_backup_20260413_123456.sql",
    "restored_at": 1718285096
  }
}
```

### 3. 列出备份文件

**端点**: `GET /api/v1/ops/backups?backup_dir=.`

**认证**: 需要认证

**查询参数**:
- `backup_dir`: 可选，默认为当前目录

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "filename": "career_db_backup_20260413_123456.sql",
        "file_size": 123456,
        "created_at": 1718285096,
        "file_path": "./career_db_backup_20260413_123456.sql"
      }
    ],
    "total": 1
  }
}
```

### 4. 下载备份文件

**端点**: `GET /api/v1/ops/backups/{filename}?backup_dir=.`

**认证**: 需要认证

**路径参数**:
- `filename`: 备份文件名

**查询参数**:
- `backup_dir`: 可选，默认为当前目录

**响应**: 返回备份文件的二进制内容

## 使用示例

### 使用 curl 创建备份

```bash
curl -X POST http://localhost:8081/api/v1/ops/backup \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"output_dir": "./backups"}'
```

### 使用 curl 恢复数据库

```bash
curl -X POST http://localhost:8081/api/v1/ops/restore \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"filename": "career_db_backup_20260413_123456.sql", "backup_dir": "./backups"}'
```

### 使用 curl 列出备份

```bash
curl -X GET "http://localhost:8081/api/v1/ops/backups?backup_dir=./backups" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 使用 curl 下载备份

```bash
curl -X GET "http://localhost:8081/api/v1/ops/backups/career_db_backup_20260413_123456.sql?backup_dir=./backups" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o downloaded_backup.sql
```

## 配置要求

### 环境变量

数据库配置通过命令行参数传递，与 `backup-db.sh` 脚本类似：

- `--mysql-host`: MySQL 主机地址（默认：localhost）
- `--mysql-port`: MySQL 端口（默认：3306）
- `--mysql-username`: MySQL 用户名（默认：root）
- `--mysql-password`: MySQL 密码（必须）
- `--mysql-database`: MySQL 数据库名称（默认：career_db）

### 系统要求

- 必须安装 `mysqldump` 或 `mariadb-dump` 命令
- 必须安装 `mysql` 命令
- 应用必须有权限访问指定的备份目录

## 注意事项

1. **备份文件命名**: 备份文件使用时间戳命名，格式为 `career_db_backup_YYYYMMDD_HHMMSS.sql`

2. **恢复操作**: 恢复操作会覆盖整个数据库，请谨慎使用

3. **权限**: 确保应用有读写备份目录的权限

4. **安全性**: 备份文件可能包含敏感数据，请妥善保管

5. **存储空间**: 确保有足够的磁盘空间存储备份文件

6. **密码要求**: 如果未配置数据库密码，备份操作会失败

## 实现细节

### 数据库备份流程

1. 从配置中获取数据库连接信息
2. 创建指定的备份目录
3. 生成时间戳文件名
4. 使用 `mysqldump` 或 `mariadb-dump` 导出数据库
5. 将导出的 SQL 内容写入文件
6. 返回备份文件信息

### 数据库恢复流程

1. 从配置中获取数据库连接信息
2. 验证备份文件是否存在
3. 读取备份文件内容
4. 使用 `mysql` 命令将 SQL 内容导入数据库
5. 返回恢复结果

### 文件列表流程

1. 读取指定目录中的所有 `.sql` 文件
2. 获取每个文件的元数据（大小、创建时间）
3. 按创建时间倒序排列
4. 返回文件列表

## 错误处理

所有 API 都会返回标准的 JSON 响应格式：

```json
{
  "code": 500,
  "message": "错误描述",
  "data": null
}
```

常见错误：
- 500: 内部服务器错误（如命令执行失败、文件读写失败）
- 404: 备份文件未找到

## 与 backup-db.sh 的关系

本实现复用了 `backup-db.sh` 脚本中的数据库配置参数和备份逻辑，但提供了：
- RESTful API 接口
- 集成的身份验证
- 更灵活的目录管理
- 在线恢复功能
- 备份文件管理功能

`backup-db.sh` 脚本仍然可以在命令行中使用，适用于自动化备份任务。