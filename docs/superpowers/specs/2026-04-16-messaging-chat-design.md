# 站内信和聊天室设计方案

## 概述

实现教师端和学生端的站内信系统和一对一聊天室功能，支持教师提醒学生完善资料和学生与教师沟通。

## 现有资源

### 站内信 (已实现后端)
- 表: `messages` (已在 career.go:505)
- API: `/teachers/messages` (POST 发送, GET 列表)
- API: `/students/messages` (GET 列表)
- API: `/students/messages/:id/read` (PUT 标记已读)

## 设计方案

### 1. 数据库设计

#### 1.1 chat_groups - 群组表
```sql
CREATE TABLE IF NOT EXISTS chat_groups (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='聊天群组表'
```

#### 1.2 chat_group_members - 群组成员表
```sql
CREATE TABLE IF NOT EXISTS chat_group_members (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='群组成员表'
```

#### 1.3 chat_messages - 聊天消息表
```sql
CREATE TABLE IF NOT EXISTS chat_messages (
  id BIGINT(20) NOT NULL AUTO_INCREMENT,
  group_id BIGINT(20) NOT NULL COMMENT '群组ID',
  sender_id BIGINT(20) NOT NULL COMMENT '发送者ID',
  sender_type VARCHAR(20) NOT NULL COMMENT '发送者类型: teacher, student',
  sender_name VARCHAR(100) DEFAULT NULL COMMENT '发送者名称',
  content TEXT NOT NULL COMMENT '消息内容',
  created_at BIGINT(20) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_group (group_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='聊天消息表'
```

### 2. 后端 API 设计

#### 2.1 聊天室 API

| Method | Path | 说明 |
|--------|------|------|
| POST | /chat/groups | 创建群组 |
| GET | /chat/groups | 获取用户的群组列表 |
| GET | /chat/groups/:id/messages | 获取群组消息历史 |
| POST | /chat/groups/:id/messages | 发送消息 |
| GET | /chat/groups/:id/members | 获取群组成员 |

#### 2.2 站内信 API (补充)

| Method | Path | 说明 |
|--------|------|------|
| POST | /teachers/messages | 教师发送站内信 |
| GET | /teachers/messages | 教师获取发送列表 |
| GET | /students/messages | 学生获取收信列表 |
| PUT | /students/messages/:id/read | 标记已读 |
| DELETE | /teachers/messages/:id | 删除站内信 |

### 3. 前端页面设计

#### 3.1 消息页面结构
```
/teacher/messages     教师端消息页面
/student/messages    学生端消息页面

Tabs:
- 站内信: 收发的站内信列表
- 聊天室: 聊天群组列表和对话
```

#### 3.2 站内信页面
- 列表视图: 发件人/收件人、标题、摘要、时间、未读状态
- 详情弹窗: 查看完整内容
- 教师端: 发信表单(选择学生、输入标��和内容)

#### 3.3 聊天室页面
- 左侧: 群组列表 (显示成员名称、最近消息、头像)
- 右侧: 聊天窗口 (消息历史、输入框、发送按钮)

### 4. 自动创建群组逻辑

学生加入学校时自动创建教师-学生私聊群组:
```go
// 在 student/joinschoollogic.go 中, 学生加入学校成功后
// 1. 获取该学校的教师列表
// 2. 为每个教师创建一个一对一chat_group
// 3. 将教师和学生都加入群组
```

### 5. 实现顺序

#### Phase 1: 后端 (聊天室)
1. 数据库表创建
2. 创建群组 API
3. 发送消息 API
4. 消息历史 API
5. 自动创建群组逻辑

#### Phase 2: 前端 - 教师端
1. API 接口定义
2. 消息页面框架 (Tabs)
3. 站内信发信功能
4. 聊天室功能

#### Phase 3: 前端 - 学生端
1. 消息页面
2. 站内信查看
3. 聊天室功能

## 注意事项

1. 聊天室采用一对一 (direct) 类型，不支持群组扩展
2. 消息只支持纯文本，后续可扩展
3. 未读数统计: 站内信 + 聊天室各自独立计算
4. 侧边栏显示未读总数badge