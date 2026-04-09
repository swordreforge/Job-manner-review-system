# 数据库迁移说明

## 运行迁移脚本

### 方法1：使用MySQL命令行

```bash
# 登录MySQL
mysql -u your_username -p

# 选择数据库
USE career_api;

# 执行迁移脚本
source /path/to/sql/migrations/004_add_interview_tables.sql;
```

### 方法2：使用mysql命令

```bash
mysql -u your_username -p career_api < sql/migrations/004_add_interview_tables.sql
```

## 迁移脚本说明

### 004_add_interview_tables.sql

创建面试模块相关的三个表：

1. **interview_sessions** - 面试会话表
   - 存储面试会话的基本信息
   - 关联用户表和学生表
   - 记录面试模式、状态、评分统计等

2. **interview_messages** - 面试对话记录表
   - 存储面试过程中的所有对话
   - 包含用户和AI的消息
   - 记录评分和反馈

3. **interview_reports** - 面试评估报告表
   - 存储面试评估报告
   - 包含各项评分和能力分析
   - 提供改进建议

## 验证迁移

迁移完成后，可以执行以下SQL验证表是否创建成功：

```sql
SHOW TABLES LIKE 'interview_%';

DESC interview_sessions;
DESC interview_messages;
DESC interview_reports;
```

## 回滚迁移

如果需要回滚，可以执行以下SQL：

```sql
DROP TABLE IF EXISTS interview_reports;
DROP TABLE IF EXISTS interview_messages;
DROP TABLE IF EXISTS interview_sessions;
```

## 注意事项

1. 执行迁移前请备份数据库
2. 确保数据库用户有创建表的权限
3. 迁移脚本会创建外键约束，确保相关表存在
4. 如果外键约束创建失败，可能需要先禁用外键检查：

```sql
SET FOREIGN_KEY_CHECKS=0;
source sql/migrations/004_add_interview_tables.sql;
SET FOREIGN_KEY_CHECKS=1;
```