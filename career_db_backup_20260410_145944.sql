CREATE DATABASE IF NOT EXISTS `career_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `career_db`;
SET FOREIGN_KEY_CHECKS=0;
DROP TABLE IF EXISTS `career_reports`;
CREATE TABLE `career_reports`(
`id` bigint(20) NOT NULL AUTO_INCREMENT,
`student_id` bigint(20) NOT NULL,
`target_job_id` bigint(20) DEFAULT NULL,
`title` varchar(200) DEFAULT NULL,
`content` text DEFAULT NULL,
`overview` json DEFAULT NULL,
`match_analysis` json DEFAULT NULL,
`career_path` json DEFAULT NULL,
`action_plan` json DEFAULT NULL,
`status` varchar(20) DEFAULT 'draft',
`created_at` bigint(20) NOT NULL,
`updated_at` bigint(20) NOT NULL,
PRIMARY KEY(`id`),
KEY `idx_student`(`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
DROP TABLE IF EXISTS `holland_test_results`;
CREATE TABLE `holland_test_results`(
`id` bigint(20) NOT NULL AUTO_INCREMENT,
`student_id` bigint(20) NOT NULL,
`career_code` varchar(10) NOT NULL,
`scores` json  NOT NULL,
`suitable_jobs` json  NOT NULL,
`description` text DEFAULT NULL,
`created_at` bigint(20) NOT NULL,
PRIMARY KEY(`id`),
KEY `idx_student_id`(`student_id`),
KEY `idx_career_code`(`career_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
DROP TABLE IF EXISTS `interview_messages`;
CREATE TABLE `interview_messages`(
`id` bigint(20) NOT NULL AUTO_INCREMENT,
`session_id` bigint(20) NOT NULL,
`role` varchar(20) NOT NULL,
`content` text NOT NULL,
`question_type` varchar(50) DEFAULT NULL,
`score` decimal(5,2) DEFAULT NULL,
`feedback` text DEFAULT NULL,
`created_at` bigint(20) NOT NULL,
PRIMARY KEY(`id`),
KEY `idx_session`(`session_id`),
KEY `idx_role`(`role`),
KEY `idx_created`(`created_at`),
KEY `idx_session_created`(`session_id`,`created_at`),
CONSTRAINT `fk_interview_message_session` FOREIGN KEY(`session_id`) REFERENCES `interview_sessions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='面试对话记录表';
INSERT INTO `interview_messages` VALUES
(1,1,'user','/',NULL,NULL,NULL,1775804326),
(2,1,'assistant','{\n \"question\": \"请简单介绍一下你自己\",\n \"score\": 0,\n \"feedback\": \"请开始你的自我介绍，我会根据你的回答进行评分和反馈。\",\n \"questionType\": \"self_intro\",\n \"sessionEnd\": false\n}','self_intro',0.00,'请开始你的自我介绍，我会根据你的回答进行评分和反馈。',1775804328);
DROP TABLE IF EXISTS `interview_reports`;
CREATE TABLE `interview_reports`(
`id` bigint(20) NOT NULL AUTO_INCREMENT,
`session_id` bigint(20) NOT NULL,
`student_id` bigint(20) NOT NULL,
`title` varchar(200) DEFAULT NULL,
`summary` text DEFAULT NULL,
`strengths` text DEFAULT NULL,
`weaknesses` text DEFAULT NULL,
`suggestions` text DEFAULT NULL,
`overall_score` decimal(5,2) DEFAULT NULL,
`created_at` bigint(20) NOT NULL,
`updated_at` bigint(20) NOT NULL,
PRIMARY KEY(`id`),
KEY `idx_session_id`(`session_id`),
KEY `idx_student_id`(`student_id`),
CONSTRAINT `fk_interview_report_session` FOREIGN KEY(`session_id`) REFERENCES `interview_sessions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
DROP TABLE IF EXISTS `interview_sessions`;
CREATE TABLE `interview_sessions`(
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
PRIMARY KEY(`id`),
KEY `idx_user`(`user_id`),
KEY `idx_student`(`student_id`),
KEY `idx_status`(`status`),
KEY `idx_created`(`created_at`),
KEY `idx_user_status`(`user_id`,`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `interview_sessions` VALUES
(1,1,NULL,'practice','cancelled',0,1,0.00,0.00,0.00,15,1775804321,1775804336,1775804336);
DROP TABLE IF EXISTS `job_promotion_paths`;
CREATE TABLE `job_promotion_paths`(
`id` bigint(20) NOT NULL AUTO_INCREMENT,
`from_job_id` bigint(20) NOT NULL,
`to_job_id` bigint(20) NOT NULL,
`path_description` text DEFAULT NULL,
`required_skills` text DEFAULT NULL,
`estimated_years` int(11) DEFAULT NULL,
`created_at` bigint(20) NOT NULL,
`updated_at` bigint(20) NOT NULL,
PRIMARY KEY(`id`),
KEY `idx_from_job`(`from_job_id`),
KEY `idx_to_job`(`to_job_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
DROP TABLE IF EXISTS `jobs`;
CREATE TABLE `jobs`(
`id` bigint(20) NOT NULL AUTO_INCREMENT,
`title` varchar(200) NOT NULL,
`category` varchar(100) DEFAULT NULL,
`description` text DEFAULT NULL,
`requirements` text DEFAULT NULL,
`salary_range` varchar(100) DEFAULT NULL,
`company` varchar(100) DEFAULT NULL,
`location` varchar(100) DEFAULT NULL,
`education_requirement` varchar(50) DEFAULT NULL,
`experience_requirement` varchar(50) DEFAULT NULL,
`holland_code` varchar(10) DEFAULT NULL,
`created_at` bigint(20) NOT NULL,
`updated_at` bigint(20) NOT NULL,
PRIMARY KEY(`id`),
KEY `idx_category`(`category`),
KEY `idx_holland_code`(`holland_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `jobs` VALUES
(1,'Golang后端开发工程师','技术','负责公司后端服务开发，参与微服务架构设计与实现','熟练掌握Golang编程语言，熟悉MySQL/Redis，了解微服务架构','15000-30000','字节跳动','北京','本科','1-3年','IRC',1775804311,1775804311),
(2,'Java开发工程师','技术','负责企业级应用后端开发，参与系统架构设计','熟练掌握Java，熟悉Spring框架，了解分布式系统','12000-25000','阿里巴巴','杭州','本科','1-3年','IRC',1775804311,1775804311),
(3,'前端开发工程师','技术','负责Web前端开发，与后端工程师协作完成产品功能','熟练掌握Vue/React，熟悉HTML/CSS/JavaScript','12000-22000','腾讯','深圳','本科','1-3年','AIR',1775804311,1775804311),
(4,'Python数据分析师','数据','负责数据分析和可视化，为业务决策提供支持','熟练掌握Python，熟悉Pandas/NumPy，了解数据可视化','15000-28000','美团','北京','本科','1-3年','IEC',1775804311,1775804311),
(5,'产品经理','产品','负责产品规划与设计，协调研发团队推动产品迭代','良好的沟通能力，了解互联网产品，有项目管理经验','18000-35000','字节跳动','北京','本科','1-3年','ESA',1775804311,1775804311),
(6,'UI设计师','设计','负责产品界面设计，提升用户体验','熟练掌握Figma/Sketch，了解用户体验设计原则','15000-28000','网易','杭州','本科','1-3年','AIR',1775804311,1775804311),
(7,'测试工程师','技术','负责产品测试工作，保障软件质量','熟悉测试流程，了解自动化测试框架','10000-20000','华为','深圳','本科','1-3年','RIC',1775804311,1775804311),
(8,'运维工程师','技术','负责服务器运维，保障系统稳定运行','熟悉Linux，了解Docker/K8s，有运维经验','15000-25000','阿里巴巴','杭州','本科','1-3年','RIC',1775804311,1775804311),
(9,'新媒体运营','运营','负责新媒体平台运营，策划优质内容','熟悉各平台运营规则，有内容策划能力','8000-15000','小红书','上海','本科','1-3年','SEA',1775804311,1775804311),
(10,'内容编辑','内容','负责内容策划与编辑，产出优质文章','良好的文字功底，了解内容运营','7000-14000','今日头条','北京','本科','1-3年','AES',1775804311,1775804311);
DROP TABLE IF EXISTS `match_records`;
CREATE TABLE `match_records`(
`id` bigint(20) NOT NULL AUTO_INCREMENT,
`student_id` bigint(20) NOT NULL,
`job_id` bigint(20) NOT NULL,
`match_score` decimal(5,2) NOT NULL,
`match_details` json DEFAULT NULL,
`created_at` bigint(20) NOT NULL,
PRIMARY KEY(`id`),
KEY `idx_student_id`(`student_id`),
KEY `idx_job_id`(`job_id`),
KEY `idx_match_score`(`match_score`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
DROP TABLE IF EXISTS `resume_parse_history`;
CREATE TABLE `resume_parse_history`(
`id` bigint(20) NOT NULL AUTO_INCREMENT,
`user_id` bigint(20) NOT NULL,
`student_id` bigint(20) DEFAULT NULL,
`resume_file_name` varchar(255) DEFAULT NULL,
`resume_content` text DEFAULT NULL,
`parsed_profile` text DEFAULT NULL,
`suggestions` text DEFAULT NULL,
`completeness_score` double NOT NULL DEFAULT 0,
`competitiveness_score` double NOT NULL DEFAULT 0,
`created_at` bigint(20) NOT NULL,
PRIMARY KEY(`id`),
KEY `idx_user_id`(`user_id`),
KEY `idx_student_id`(`student_id`),
KEY `idx_created`(`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
DROP TABLE IF EXISTS `students`;
CREATE TABLE `students`(
`id` bigint(20) NOT NULL AUTO_INCREMENT,
`user_id` bigint(20) NOT NULL,
`name` varchar(50) NOT NULL,
`education` varchar(50) DEFAULT NULL,
`major` varchar(100) DEFAULT NULL,
`graduation_year` bigint(20) DEFAULT NULL,
`skills` text DEFAULT NULL,
`certificates` text DEFAULT NULL,
`soft_skills` text DEFAULT NULL,
`internship` text DEFAULT NULL,
`projects` text DEFAULT NULL,
`completeness_score` double NOT NULL DEFAULT 0,
`competitiveness_score` double NOT NULL DEFAULT 0,
`resume_url` varchar(255) DEFAULT NULL,
`suggestions` text DEFAULT NULL,
`resume_content` text DEFAULT NULL,
`created_at` bigint(20) NOT NULL,
`updated_at` bigint(20) NOT NULL,
PRIMARY KEY(`id`),
KEY `idx_user_id`(`user_id`),
KEY `idx_name`(`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`(
`id` bigint(20) NOT NULL AUTO_INCREMENT,
`username` varchar(50) NOT NULL,
`password` varchar(255) NOT NULL,
`email` varchar(100) DEFAULT NULL,
`phone` varchar(20) DEFAULT NULL,
`role` varchar(20) NOT NULL DEFAULT 'student',
`created_at` bigint(20) NOT NULL,
`updated_at` bigint(20) NOT NULL,
PRIMARY KEY(`id`),
UNIQUE KEY `username`(`username`),
KEY `idx_username`(`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `users` VALUES
(1,'testuser','$2a$10$/EYmGLg.rW8S9wGeHYxB2uBpc88RKhnDskBn7i5N/4UHiK4YMd2k2','test@example.com',NULL,'user',1775804311,1775804311);
SET FOREIGN_KEY_CHECKS=1;
