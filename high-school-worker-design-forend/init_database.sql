-- Career Database 初始化脚本
-- 生成时间: 2026-04-09
-- 用途: 创建career_db数据库及其所有表结构

-- 删除已存在的数据库（如果需要）
-- DROP DATABASE IF EXISTS career_db;

-- 创建数据库
CREATE DATABASE IF NOT EXISTS career_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;

-- 使用数据库
USE career_db;

-- ============================================
-- 表创建（按依赖关系顺序）
-- ============================================

-- 1. 用户表
CREATE TABLE IF NOT EXISTS `users` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- 2. 职位信息表
CREATE TABLE IF NOT EXISTS `jobs` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- 3. 学生档案表
CREATE TABLE IF NOT EXISTS `students` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- 4. 面试会话表
CREATE TABLE IF NOT EXISTS `interview_sessions` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- 5. 面试对话记录表（有外键约束，需要在interview_sessions之后创建）
CREATE TABLE IF NOT EXISTS `interview_messages` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci COMMENT='面试对话记录表';

-- 6. 面试评估报告表（有外键约束，需要在interview_sessions和users之后创建）
CREATE TABLE IF NOT EXISTS `interview_reports` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci COMMENT='面试评估报告表';

-- 7. 职业发展路径表
CREATE TABLE IF NOT EXISTS `job_promotion_paths` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `from_job_id` bigint(20) NOT NULL,
  `to_job_id` bigint(20) NOT NULL,
  `match_score` float DEFAULT NULL,
  `transfer_skills` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`transfer_skills`)),
  `learning_path` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`learning_path`)),
  PRIMARY KEY (`id`),
  KEY `idx_from_job` (`from_job_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- 8. 匹配记录表
CREATE TABLE IF NOT EXISTS `match_records` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- 9. 简历解析历史记录表
CREATE TABLE IF NOT EXISTS `resume_parse_history` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci COMMENT='简历解析历史记录';

-- 10. 霍兰德测试结果表
CREATE TABLE IF NOT EXISTS `holland_test_results` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- 11. 职业规划报告表
CREATE TABLE IF NOT EXISTS `career_reports` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- ============================================
-- 示例数据插入
-- ============================================

-- 插入用户数据
INSERT INTO `users` (`id`, `username`, `password`, `email`, `phone`, `role`, `created_at`, `updated_at`) VALUES
(1, 'student1', '$2b$10$N9qo8uLOickgx2ZMRZoMy.MI8aBzXZxJXwzZQjG8X8X8X8X8X8X8', 'student1@example.com', '13800138001', 'user', UNIX_TIMESTAMP() * 1000, UNIX_TIMESTAMP() * 1000),
(2, 'student2', '$2b$10$N9qo8uLOickgx2ZMRZoMy.MI8aBzXZxJXwzZQjG8X8X8X8X8X8X8', 'student2@example.com', '13800138002', 'user', UNIX_TIMESTAMP() * 1000, UNIX_TIMESTAMP() * 1000),
(3, 'teacher1', '$2b$10$N9qo8uLOickgx2ZMRZoMy.MI8aBzXZxJXwzZQjG8X8X8X8X8X8X8', 'teacher1@example.com', '13800138003', 'teacher', UNIX_TIMESTAMP() * 1000, UNIX_TIMESTAMP() * 1000),
(4, 'admin', '$2b$10$N9qo8uLOickgx2ZMRZoMy.MI8aBzXZxJXwzZQjG8X8X8X8X8X8X8', 'admin@example.com', '13800138000', 'admin', UNIX_TIMESTAMP() * 1000, UNIX_TIMESTAMP() * 1000);

-- 插入职位数据
INSERT INTO `jobs` (`id`, `name`, `description`, `company`, `industry`, `location`, `salary_range`, `skills`, `certificates`, `soft_skills`, `requirements`, `growth_potential`, `created_at`, `updated_at`) VALUES
(1, 'Java开发工程师', '负责企业级Java应用开发', '腾讯', '互联网', '深圳', '15K-25K', '["Java", "Spring", "MySQL", "Redis"]', '["Oracle认证", "阿里云认证"]', '["沟通能力", "团队协作"]', '["本科", "计算机专业"]', '高', UNIX_TIMESTAMP() * 1000, UNIX_TIMESTAMP() * 1000),
(2, 'Python数据分析师', '负责数据挖掘和分析', '阿里巴巴', '互联网', '杭州', '18K-30K', '["Python", "Pandas", "NumPy", "SQL"]', '["Python认证", "数据分析师认证"]', '["逻辑思维", "分析能力"]', '["本科", "统计学或数学专业"]', '高', UNIX_TIMESTAMP() * 1000, UNIX_TIMESTAMP() * 1000),
(3, '前端开发工程师', '负责Web前端开发', '字节跳动', '互联网', '北京', '20K-35K', '["JavaScript", "React", "Vue", "CSS"]', '["前端开发认证"]', '["创意思维", "用户体验"]', '["本科", "计算机或设计专业"]', '中高', UNIX_TIMESTAMP() * 1000, UNIX_TIMESTAMP() * 1000),
(4, '产品经理', '负责产品规划和设计', '美团', '互联网', '上海', '25K-40K', '["产品设计", "用户研究", "数据分析"]', '["PMP认证"]', '["沟通能力", "创新能力"]', '["本科", "MBA优先"]', '高', UNIX_TIMESTAMP() * 1000, UNIX_TIMESTAMP() * 1000),
(5, 'UI设计师', '负责界面设计和视觉设计', '网易', '互联网', '广州', '15K-25K', '["Figma", "Sketch", "Photoshop"]', '["UI设计认证"]', '["审美能力", "创意思维"]', '["本科", "设计专业"]', '中', UNIX_TIMESTAMP() * 1000, UNIX_TIMESTAMP() * 1000);

-- 插入学生数据
INSERT INTO `students` (`id`, `user_id`, `name`, `education`, `major`, `graduation_year`, `skills`, `certificates`, `soft_skills`, `internship`, `projects`, `completeness_score`, `competitiveness_score`, `resume_url`, `created_at`, `updated_at`, `suggestions`, `resume_content`) VALUES
(1, 1, '张三', '本科', '计算机科学与技术', 2025, '["Java", "Python", "MySQL", "JavaScript"]', '["英语六级", "计算机二级"]', '["沟通能力", "团队协作"]', '[]', '[]', 75.5, 68.2, NULL, UNIX_TIMESTAMP() * 1000, UNIX_TIMESTAMP() * 1000, '["增加项目经验", "获得更多证书"]', '张三，计算机专业大三学生，掌握Java和Python编程语言'),
(2, 2, '李四', '本科', '软件工程', 2024, '["React", "Vue", "Node.js", "MongoDB"]', '["前端开发认证", "JavaScript高级认证"]', '["创意思维", "学习能力"]', '[{"company":"某互联网公司","position":"前端实习生","duration":"3个月"}]', '[{"name":"电商网站","role":"前端开发","description":"使用React开发电商前端页面"}]', 82.3, 76.8, NULL, UNIX_TIMESTAMP() * 1000, UNIX_TIMESTAMP() * 1000, '["提升算法能力", "参与开源项目"]', '李四，软件工程大四学生，前端开发能力强，有实习经验');

-- 插入职业发展路径数据
INSERT INTO `job_promotion_paths` (`from_job_id`, `to_job_id`, `match_score`, `transfer_skills`, `learning_path`) VALUES
(1, 4, 0.85, '["Java", "沟通能力", "团队协作"]', '["学习产品设计知识", "提升商业思维", "参与产品讨论"]'),
(5, 4, 0.78, '["用户体验", "创意思维"]', '["学习用户研究方法", "学习数据分析", "参与产品会议"]'),
(2, 4, 0.82, '["数据分析", "逻辑思维"]', '["学习产品设计", "学习项目管理", "提升沟通能力"]');

-- 插入匹配记录数据
INSERT INTO `match_records` (`student_id`, `job_id`, `overall_score`, `skills_match`, `certs_match`, `soft_skills_match`, `experience_match`, `gap_analysis`, `created_at`) VALUES
(1, 1, 72.5, 80.0, 65.0, 75.0, 70.0, '["缺少实战项目经验", "需要提升高级Java技能"]', UNIX_TIMESTAMP() * 1000),
(1, 2, 68.0, 70.0, 60.0, 72.0, 70.0, '["数据分析经验不足", "需要统计学基础"]', UNIX_TIMESTAMP() * 1000),
(2, 3, 88.5, 92.0, 85.0, 88.0, 89.0, '["可以尝试高级框架", "增加后端知识"]', UNIX_TIMESTAMP() * 1000),
(2, 1, 65.0, 70.0, 60.0, 65.0, 65.0, '["需要学习Java", "缺少后端经验"]', UNIX_TIMESTAMP() * 1000);

-- 插入霍兰德测试结果数据
INSERT INTO `holland_test_results` (`student_id`, `career_code`, `scores`, `suitable_jobs`, `description`, `created_at`) VALUES
(1, 'RIA', '{"R":85,"I":78,"A":72,"S":65,"E":60,"C":55}', '["Java开发工程师", "数据分析师", "系统架构师"]', '你的职业兴趣类型为RIA，适合技术型和研究型工作', UNIX_TIMESTAMP() * 1000),
(2, 'AIS', '{"A":90,"I":82,"S":78,"R":70,"E":65,"C":60}', '["UI设计师", "产品经理", "用户体验设计师"]', '你的职业兴趣类型为AIS，适合创意型和社交型工作', UNIX_TIMESTAMP() * 1000);

-- 插入职业规划报告数据
INSERT INTO `career_reports` (`student_id`, `target_job_id`, `title`, `content`, `overview`, `match_analysis`, `career_path`, `action_plan`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, 'Java开发工程师职业规划', '基于你的技能和兴趣，Java开发工程师是一个很好的职业选择', '{"current_skills":"Java基础扎实","gaps":"缺少项目经验","potential":"发展前景良好"}', '{"overall_score":72.5,"skills_match":80,"recommendation":"建议增加实战项目"}', '{"entry_level":"初级Java开发","mid_level":"高级Java开发","senior_level":"架构师"}', '{"short_term":"学习Spring框架","medium_term":"参与开源项目","long_term":"成为架构师"}', 'completed', UNIX_TIMESTAMP() * 1000, UNIX_TIMESTAMP() * 1000),
(2, 3, '前端开发工程师职业规划', '你的前端技能很强，建议继续深耕前端领域', '{"current_skills":"React和Vue熟练","gaps":"可以学习更多框架","potential":"成为全栈工程师"}', '{"overall_score":88.5,"skills_match":92,"recommendation":"可以尝试高级前端框架"}', '{"entry_level":"前端开发工程师","mid_level":"高级前端开发","senior_level":"前端架构师"}', '{"short_term":"深入学习TypeScript","medium_term":"学习Node.js","long_term":"成为全栈工程师"}', 'draft', UNIX_TIMESTAMP() * 1000, UNIX_TIMESTAMP() * 1000);

-- 插入简历解析历史数据
INSERT INTO `resume_parse_history` (`user_id`, `student_id`, `resume_file_name`, `resume_content`, `parsed_profile`, `suggestions`, `completeness_score`, `competitiveness_score`, `created_at`) VALUES
(1, 1, 'zhangsan_resume.pdf', '张三，计算机科学与技术专业，掌握Java和Python，英语六级...', '{"name":"张三","education":"本科","major":"计算机科学与技术","skills":["Java","Python"],"certificates":["英语六级"]}', '["建议增加项目经验描述","添加实习经历"]', 75.5, 68.2, UNIX_TIMESTAMP() * 1000),
(2, 2, 'lisi_resume.docx', '李四，软件工程专业，熟悉React和Vue，有前端实习经验...', '{"name":"李四","education":"本科","major":"软件工程","skills":["React","Vue"],"internship":[{"company":"某互联网公司","position":"前端实习生"}]}', '["建议详细描述项目成果","增加技术深度描述"]', 82.3, 76.8, UNIX_TIMESTAMP() * 1000);

-- 插入面试会话数据
INSERT INTO `interview_sessions` (`id`, `user_id`, `student_id`, `mode`, `status`, `total_questions`, `current_question`, `average_score`, `max_score`, `min_score`, `duration_seconds`, `created_at`, `updated_at`, `completed_at`) VALUES
(1, 1, 1, '技术面试', 'completed', 5, 5, 78.5, 85.0, 72.0, 1800, UNIX_TIMESTAMP() * 1000 - 3600000, UNIX_TIMESTAMP() * 1000 - 1800000, UNIX_TIMESTAMP() * 1000 - 1800000),
(2, 2, 2, '综合面试', 'running', 3, 2, 82.0, 88.0, 76.0, 900, UNIX_TIMESTAMP() * 1000 - 1800000, UNIX_TIMESTAMP() * 1000, NULL);

-- 插入面试对话数据
INSERT INTO `interview_messages` (`session_id`, `role`, `content`, `question_type`, `score`, `feedback`, `created_at`) VALUES
(1, 'assistant', '请先做一下自我介绍', 'self_intro', NULL, NULL, UNIX_TIMESTAMP() * 1000 - 3500000),
(1, 'user', '我是张三，计算机专业大三学生，掌握Java和Python编程语言，英语六级，热爱编程，希望能从事软件开发工作', 'self_intro', 78.0, '自我介绍比较清晰，但可以更加突出自己的优势和项目经验', UNIX_TIMESTAMP() * 1000 - 3400000),
(1, 'assistant', '请介绍一下你最熟悉的项目', 'project', NULL, NULL, UNIX_TIMESTAMP() * 1000 - 3300000),
(1, 'user', '我做过一个学生管理系统，使用Java和MySQL开发，实现了学生信息管理、课程管理等功能', 'project', 85.0, '项目描述比较清楚，建议可以详细介绍技术难点和解决方案', UNIX_TIMESTAMP() * 1000 - 3200000),
(1, 'assistant', 'Java中ArrayList和LinkedList的区别是什么？', 'technical', NULL, NULL, UNIX_TIMESTAMP() * 1000 - 3100000),
(1, 'user', 'ArrayList基于数组实现，查询快增删慢；LinkedList基于链表实现，增删快查询慢', 'technical', 82.0, '回答正确，但可以进一步展开讲讲它们的应用场景', UNIX_TIMESTAMP() * 1000 - 3000000),
(1, 'assistant', '你有什么问题想问我吗？', 'hr', NULL, NULL, UNIX_TIMESTAMP() * 1000 - 2900000),
(1, 'user', '我想了解一下团队的技术栈和项目情况', 'hr', 72.0, '问题很好，体现了对工作的兴趣，但可以更具体一些', UNIX_TIMESTAMP() * 1000 - 2800000),
(1, 'assistant', '面试结束，感谢你的参与', 'hr', NULL, NULL, UNIX_TIMESTAMP() * 1000 - 2700000),
(2, 'assistant', '你好，欢迎参加面试，请先做个自我介绍', 'self_intro', NULL, NULL, UNIX_TIMESTAMP() * 1000 - 1700000),
(2, 'user', '我是李四，软件工程专业大四学生，熟悉React和Vue前端框架，有3个月的前端实习经验，曾参与电商网站的开发', 'self_intro', 88.0, '自我介绍非常棒，突出了自己的技能和经验', UNIX_TIMESTAMP() * 1000 - 1600000),
(2, 'assistant', 'React中useState和useEffect的作用是什么？', 'technical', NULL, NULL, UNIX_TIMESTAMP() * 1000 - 1500000),
(2, 'user', 'useState用于管理组件状态，useEffect用于处理副作用，比如数据获取、订阅等', 'technical', 85.0, '回答准确，可以举例说明具体使用场景', UNIX_TIMESTAMP() * 1000 - 1400000),
(2, 'assistant', '你在实习中遇到的最大困难是什么？如何解决的？', 'project', NULL, NULL, UNIX_TIMESTAMP() * 1000 - 1300000);

-- 插入面试报告数据
INSERT INTO `interview_reports` (`session_id`, `user_id`, `overall_score`, `skill_score`, `communication_score`, `logic_score`, `confidence_score`, `strengths`, `weaknesses`, `improvement_suggestions`, `summary`, `created_at`, `updated_at`) VALUES
(1, 1, 78.5, 82.0, 76.0, 80.0, 76.0, '["技术基础扎实","逻辑清晰","学习能力强"]', '["项目经验不足","表达能力有待提升","缺乏实际项目细节"]', '["增加项目实战经验","提升沟通表达能力","深入理解技术原理"]', '张三具有良好的技术基础和学习能力，但需要增加项目经验和提升表达能力。建议多参与实际项目，加强技术深度，同时注重沟通能力的培养。', UNIX_TIMESTAMP() * 1000 - 1800000, UNIX_TIMESTAMP() * 1000 - 1800000);

-- ============================================
-- 初始化完成
-- ============================================
-- 所有表结构已创建，示例数据已插入
-- 数据库名称: career_db
-- 表数量: 11
-- 示例数据: 已插入基础测试数据