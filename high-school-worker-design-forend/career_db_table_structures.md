# Career Database 表结构文档

数据库: career_db
生成时间: 2026-04-09

## 表列表

1. career_reports - 职业规划报告表
2. holland_test_results - 霍兰德测试结果表
3. interview_messages - 面试对话记录表
4. interview_reports - 面试评估报告表
5. interview_sessions - 面试会话表
6. job_promotion_paths - 职业发展路径表
7. jobs - 职位信息表
8. match_records - 匹配记录表
9. resume_parse_history - 简历解析历史记录表
10. students - 学生档案表
11. users - 用户表

---

## 详细表结构

### 1. career_reports - 职业规划报告表

```sql
CREATE TABLE `career_reports` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `student_id` bigint(20) NOT NULL,
  `target_job_id` bigint(20) DEFAULT NULL,
  `title` varchar(200) DEFAULT NULL,
  `content` text DEFAULT NULL,
  `overview` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`overview`)),
  `match_analysis` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`match_analysis`)),
  `career_path` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`career_path`)),
  `action_plan` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`action_plan`)),
  `status` varchar(20) DEFAULT 'draft',
  `created_at` bigint(20) NOT NULL,
  `updated_at` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_student` (`student_id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci
```

**字段说明:**
- `id`: 主键ID
- `student_id`: 学生ID
- `target_job_id`: 目标职位ID
- `title`: 报告标题
- `content`: 报告内容
- `overview`: 概览信息（JSON格式）
- `match_analysis`: 匹配分析（JSON格式）
- `career_path`: 职业路径（JSON格式）
- `action_plan`: 行动计划（JSON格式）
- `status`: 状态（draft-草稿）
- `created_at`: 创建时间
- `updated_at`: 更新时间

**索引:**
- PRIMARY: id
- idx_student: student_id

---

### 2. holland_test_results - 霍兰德测试结果表

```sql
CREATE TABLE `holland_test_results` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `student_id` bigint(20) NOT NULL,
  `career_code` varchar(10) NOT NULL,
  `scores` longtext NOT NULL,
  `suitable_jobs` longtext NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_student` (`student_id`),
  KEY `idx_career_code` (`career_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci
```

**字段说明:**
- `id`: 主键ID
- `student_id`: 学生ID
- `career_code`: 职业代码
- `scores`: 测试分数
- `suitable_jobs`: 适合的职位
- `description`: 描述
- `created_at`: 创建时间

**索引:**
- PRIMARY: id
- idx_student: student_id
- idx_career_code: career_code

---

### 3. interview_messages - 面试对话记录表

```sql
CREATE TABLE `interview_messages` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '消息ID',
  `session_id` bigint(20) NOT NULL COMMENT '会话ID，关联interview_sessions表',
  `role` varchar(20) NOT NULL COMMENT '角色：user-用户, assistant-AI面试官',
  `content` text NOT NULL COMMENT '消息内容',
  `question_type` varchar(50) DEFAULT NULL COMMENT '问题类型：self_intro-自我介绍, project-项目经验, technical-技术问题, hr-人事问题',
  `score` decimal(5,2) DEFAULT NULL COMMENT '评分（仅AI回复时有效）',
  `feedback` text DEFAULT NULL COMMENT '反馈内容（仅AI回复时有效）',
  `created_at` bigint(20) NOT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_session` (`session_id`),
  KEY `idx_role` (`role`),
  KEY `idx_created` (`created_at`),
  KEY `idx_session_created` (`session_id`,`created_at`),
  CONSTRAINT `fk_interview_message_session` FOREIGN KEY (`session_id`) REFERENCES `interview_sessions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=59 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci COMMENT='面试对话记录表'
```

**字段说明:**
- `id`: 消息ID
- `session_id`: 会话ID，关联interview_sessions表
- `role`: 角色（user-用户, assistant-AI面试官）
- `content`: 消息内容
- `question_type`: 问题类型（self_intro-自我介绍, project-项目经验, technical-技术问题, hr-人事问题）
- `score`: 评分（仅AI回复时有效）
- `feedback`: 反馈内容（仅AI回复时有效）
- `created_at`: 创建时间

**索引:**
- PRIMARY: id
- idx_session: session_id
- idx_role: role
- idx_created: created_at
- idx_session_created: session_id, created_at

**外键约束:**
- fk_interview_message_session: session_id -> interview_sessions.id (ON DELETE CASCADE)

---

### 4. interview_reports - 面试评估报告表

```sql
CREATE TABLE `interview_reports` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '报告ID',
  `session_id` bigint(20) NOT NULL COMMENT '会话ID，关联interview_sessions表',
  `user_id` bigint(20) NOT NULL COMMENT '用户ID',
  `overall_score` decimal(5,2) NOT NULL COMMENT '综合评分',
  `skill_score` decimal(5,2) DEFAULT NULL COMMENT '技能评分',
  `communication_score` decimal(5,2) DEFAULT NULL COMMENT '沟通能力评分',
  `logic_score` decimal(5,2) DEFAULT NULL COMMENT '逻辑思维评分',
  `confidence_score` decimal(5,2) DEFAULT NULL COMMENT '自信程度评分',
  `strengths` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '优势分析' CHECK (json_valid(`strengths`)),
  `weaknesses` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '劣势分析' CHECK (json_valid(`weaknesses`)),
  `improvement_suggestions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '改进建议' CHECK (json_valid(`improvement_suggestions`)),
  `summary` text DEFAULT NULL COMMENT '总结',
  `created_at` bigint(20) NOT NULL COMMENT '创建时间',
  `updated_at` bigint(20) NOT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_session` (`session_id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_score` (`overall_score`),
  KEY `idx_user_score` (`user_id`,`overall_score` DESC),
  CONSTRAINT `fk_interview_report_session` FOREIGN KEY (`session_id`) REFERENCES `interview_sessions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_interview_report_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci COMMENT='面试评估报告表'
```

**字段说明:**
- `id`: 报告ID
- `session_id`: 会话ID，关联interview_sessions表
- `user_id`: 用户ID
- `overall_score`: 综合评分
- `skill_score`: 技能评分
- `communication_score`: 沟通能力评分
- `logic_score`: 逻辑思维评分
- `confidence_score`: 自信程度评分
- `strengths`: 优势分析（JSON格式）
- `weaknesses`: 劣势分析（JSON格式）
- `improvement_suggestions`: 改进建议（JSON格式）
- `summary`: 总结
- `created_at`: 创建时间
- `updated_at`: 更新时间

**索引:**
- PRIMARY: id
- idx_session: session_id (UNIQUE)
- idx_user: user_id
- idx_score: overall_score
- idx_user_score: user_id, overall_score (DESC)

**外键约束:**
- fk_interview_report_session: session_id -> interview_sessions.id (ON DELETE CASCADE)
- fk_interview_report_user: user_id -> users.id (ON DELETE CASCADE)

---

### 5. interview_sessions - 面试会话表

```sql
CREATE TABLE `interview_sessions` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) NOT NULL,
  `student_id` bigint(20) DEFAULT NULL,
  `mode` varchar(50) NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'running',
  `total_questions` int(11) DEFAULT 0,
  `current_question` int(11) DEFAULT 0,
  `average_score` decimal(5,2) DEFAULT 0.00,
  `max_score` decimal(5,2) DEFAULT 0.00,
  `min_score` decimal(5,2) DEFAULT 0.00,
  `duration_seconds` int(11) DEFAULT 0,
  `created_at` bigint(20) NOT NULL,
  `updated_at` bigint(20) NOT NULL,
  `completed_at` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_student` (`student_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci
```

**字段说明:**
- `id`: 主键ID
- `user_id`: 用户ID
- `student_id`: 学生ID
- `mode`: 面试模式
- `status`: 状态（running-进行中）
- `total_questions`: 总问题数
- `current_question`: 当前问题序号
- `average_score`: 平均分
- `max_score`: 最高分
- `min_score`: 最低分
- `duration_seconds`: 持续时间（秒）
- `created_at`: 创建时间
- `updated_at`: 更新时间
- `completed_at`: 完成时间

**索引:**
- PRIMARY: id
- idx_user: user_id
- idx_student: student_id
- idx_status: status
- idx_created: created_at

---

### 6. job_promotion_paths - 职业发展路径表

```sql
CREATE TABLE `job_promotion_paths` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `from_job_id` bigint(20) NOT NULL,
  `to_job_id` bigint(20) NOT NULL,
  `match_score` float DEFAULT NULL,
  `transfer_skills` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`transfer_skills`)),
  `learning_path` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`learning_path`)),
  PRIMARY KEY (`id`),
  KEY `idx_from_job` (`from_job_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci
```

**字段说明:**
- `id`: 主键ID
- `from_job_id`: 起始职位ID
- `to_job_id`: 目标职位ID
- `match_score`: 匹配分数
- `transfer_skills`: 可迁移技能（JSON格式）
- `learning_path`: 学习路径（JSON格式）

**索引:**
- PRIMARY: id
- idx_from_job: from_job_id

---

### 7. jobs - 职位信息表

```sql
CREATE TABLE `jobs` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `company` varchar(100) DEFAULT NULL,
  `industry` varchar(50) DEFAULT NULL,
  `location` varchar(100) DEFAULT NULL,
  `salary_range` varchar(50) DEFAULT NULL,
  `skills` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`skills`)),
  `certificates` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`certificates`)),
  `soft_skills` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`soft_skills`)),
  `requirements` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`requirements`)),
  `growth_potential` varchar(255) DEFAULT NULL,
  `created_at` bigint(20) NOT NULL,
  `updated_at` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_industry` (`industry`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci
```

**字段说明:**
- `id`: 主键ID
- `name`: 职位名称
- `description`: 职位描述
- `company`: 公司名称
- `industry`: 行业
- `location`: 地点
- `salary_range`: 薪资范围
- `skills`: 技能要求（JSON格式）
- `certificates`: 证书要求（JSON格式）
- `soft_skills`: 软技能要求（JSON格式）
- `requirements`: 其他要求（JSON格式）
- `growth_potential`: 发展潜力
- `created_at`: 创建时间
- `updated_at`: 更新时间

**索引:**
- PRIMARY: id
- idx_industry: industry
- idx_name: name

---

### 8. match_records - 匹配记录表

```sql
CREATE TABLE `match_records` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `student_id` bigint(20) NOT NULL,
  `job_id` bigint(20) NOT NULL,
  `overall_score` float DEFAULT NULL,
  `skills_match` float DEFAULT NULL,
  `certs_match` float DEFAULT NULL,
  `soft_skills_match` float DEFAULT NULL,
  `experience_match` float DEFAULT NULL,
  `gap_analysis` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`gap_analysis`)),
  `created_at` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_student` (`student_id`),
  KEY `idx_job` (`job_id`),
  KEY `idx_score` (`overall_score`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci
```

**字段说明:**
- `id`: 主键ID
- `student_id`: 学生ID
- `job_id`: 职位ID
- `overall_score`: 综合匹配分数
- `skills_match`: 技能匹配分数
- `certs_match`: 证书匹配分数
- `soft_skills_match`: 软技能匹配分数
- `experience_match`: 经验匹配分数
- `gap_analysis`: 差距分析（JSON格式）
- `created_at`: 创建时间

**索引:**
- PRIMARY: id
- idx_student: student_id
- idx_job: job_id
- idx_score: overall_score

---

### 9. resume_parse_history - 简历解析历史记录表

```sql
CREATE TABLE `resume_parse_history` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) NOT NULL,
  `student_id` bigint(20) DEFAULT NULL COMMENT '关联的学生档案ID（可选）',
  `resume_file_name` varchar(255) DEFAULT NULL COMMENT '上传的简历文件名',
  `resume_content` text DEFAULT NULL COMMENT '原始简历文本内容',
  `parsed_profile` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '解析后的学生档案' CHECK (json_valid(`parsed_profile`)),
  `suggestions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '简历优化建议' CHECK (json_valid(`suggestions`)),
  `completeness_score` float DEFAULT 0 COMMENT '完整度评分',
  `competitiveness_score` float DEFAULT 0 COMMENT '竞争力评分',
  `created_at` bigint(20) NOT NULL COMMENT '创建时间戳',
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_student` (`student_id`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci COMMENT='简历解析历史记录'
```

**字段说明:**
- `id`: 主键ID
- `user_id`: 用户ID
- `student_id`: 关联的学生档案ID（可选）
- `resume_file_name`: 上传的简历文件名
- `resume_content`: 原始简历文本内容
- `parsed_profile`: 解析后的学生档案（JSON格式）
- `suggestions`: 简历优化建议（JSON格式）
- `completeness_score`: 完整度评分
- `competitiveness_score`: 竞争力评分
- `created_at`: 创建时间戳

**索引:**
- PRIMARY: id
- idx_user: user_id
- idx_student: student_id
- idx_created: created_at

---

### 10. students - 学生档案表

```sql
CREATE TABLE `students` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) NOT NULL,
  `name` varchar(50) NOT NULL,
  `education` varchar(50) DEFAULT NULL,
  `major` varchar(100) DEFAULT NULL,
  `graduation_year` int(11) DEFAULT NULL,
  `skills` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`skills`)),
  `certificates` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`certificates`)),
  `soft_skills` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`soft_skills`)),
  `internship` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`internship`)),
  `projects` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`projects`)),
  `completeness_score` float DEFAULT 0,
  `competitiveness_score` float DEFAULT 0,
  `resume_url` varchar(255) DEFAULT NULL,
  `created_at` bigint(20) NOT NULL,
  `updated_at` bigint(20) NOT NULL,
  `suggestions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '简历优化建议' CHECK (json_valid(`suggestions`)),
  `resume_content` text DEFAULT NULL COMMENT '原始简历文本内容',
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_major` (`major`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci
```

**字段说明:**
- `id`: 主键ID
- `user_id`: 用户ID
- `name`: 姓名
- `education`: 学历
- `major`: 专业
- `graduation_year`: 毕业年份
- `skills`: 技能（JSON格式）
- `certificates`: 证书（JSON格式）
- `soft_skills`: 软技能（JSON格式）
- `internship`: 实习经历（JSON格式）
- `projects`: 项目经历（JSON格式）
- `completeness_score`: 完整度评分
- `competitiveness_score`: 竞争力评分
- `resume_url`: 简历URL
- `created_at`: 创建时间
- `updated_at`: 更新时间
- `suggestions`: 简历优化建议（JSON格式）
- `resume_content`: 原始简历文本内容

**索引:**
- PRIMARY: id
- idx_user: user_id
- idx_major: major

---

### 11. users - 用户表

```sql
CREATE TABLE `users` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `role` varchar(20) DEFAULT 'user',
  `created_at` bigint(20) NOT NULL,
  `updated_at` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_username` (`username`),
  UNIQUE KEY `idx_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci
```

**字段说明:**
- `id`: 主键ID
- `username`: 用户名
- `password`: 密码
- `email`: 邮箱
- `phone`: 电话
- `role`: 角色（默认'user'）
- `created_at`: 创建时间
- `updated_at`: 更新时间

**索引:**
- PRIMARY: id
- idx_username: username (UNIQUE)
- idx_email: email (UNIQUE)

---

## 总结

career_db数据库共包含11个表，涵盖了高中生职业规划系统的完整功能：

1. **用户管理**: users表存储用户基础信息
2. **学生档案**: students表存储学生详细信息
3. **简历管理**: resume_parse_history表记录简历解析历史
4. **职位信息**: jobs表存储职位详情
5. **匹配系统**: match_records表记录学生与职位的匹配结果
6. **职业规划**: career_reports表存储职业规划报告
7. **职业发展**: job_promotion_paths表存储职业晋升路径
8. **霍兰德测试**: holland_test_results表存储测试结果
9. **面试系统**: 
   - interview_sessions表管理面试会话
   - interview_messages表记录面试对话
   - interview_reports表生成面试评估报告

所有表均使用InnoDB引擎，支持事务和外键约束，字符集为utf8mb4，支持存储emoji等多字节字符。