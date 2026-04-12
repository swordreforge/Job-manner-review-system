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
INSERT INTO `career_reports` VALUES
(1,1,NULL,'职业规划报告 - full','{\"skills\":[{\"name\":\"Golang\",\"level\":85,\"status\":\"已掌握\"},{\"name\":\"微服务架构\",\"level\":75,\"status\":\"已掌握\"},{\"name\":\"云原生技术栈\",\"level\":70,\"status\":\"学习中\"},{\"name\":\"分布式系统设计\",\"level\":65,\"status\":\"学习中\"},{\"name\":\"系统可观测性\",\"level\":65,\"status\":\"学习中\"},{\"name\":\"容器化部署\",\"level\":75,\"status\":\"已掌握\"},{\"name\":\"消息队列\",\"level\":70,\"status\":\"已掌握\"},{\"name\":\"Rust\",\"level\":60,\"status\":\"学习中\"}],\"timeline\":[{\"date\":\"2024年9月-2025年1月\",\"title\":\"技术深度拓展\",\"desc\":\"深入学习云原生技术体系，完成Kubernetes认证，参与开源项目贡献，完善微服务架构实践经验\"},{\"date\":\"2025年3月-2025年6月\",\"title\":\"暑期实习准备\",\"desc\":\"准备技术面试，完善项目文档，参与技术社区，争取获得知名互联网公司后端开发实习机会\"},{\"date\":\"2025年7月-2025年9月\",\"title\":\"暑期实习\",\"desc\":\"在实习中接触企业级项目，学习团队协作流程，积累实际工程经验，建立行业人脉\"},{\"date\":\"2025年10月-2026年1月\",\"title\":\"秋招冲刺\",\"desc\":\"准备校招面试，优化简历，参与校园招聘，争取获得全职offer，确定职业发展方向\"},{\"date\":\"2026年3月-2026年6月\",\"title\":\"毕业设计\",\"desc\":\"完成高质量毕业设计项目，展示综合技术能力，为职场生涯奠定坚实基础\"},{\"date\":\"2026年7月\",\"title\":\"正式入职\",\"desc\":\"开启职业生涯，适应工作环境，快速成长为团队核心开发人员\"}],\"completeness\":65,\"competitiveness\":75}',NULL,NULL,NULL,NULL,'completed',1775838748,1775838748),
(2,1,NULL,'职业规划报告 - full','{\"skills\":[{\"name\":\"Golang\",\"level\":85,\"status\":\"已掌握\"},{\"name\":\"微服务架构\",\"level\":75,\"status\":\"已掌握\"},{\"name\":\"云原生技术栈\",\"level\":70,\"status\":\"学习中\"},{\"name\":\"系统设计\",\"level\":65,\"status\":\"学习中\"},{\"name\":\"分布式系统\",\"level\":70,\"status\":\"已掌握\"},{\"name\":\"DevOps工具链\",\"level\":70,\"status\":\"学习中\"},{\"name\":\"数据库优化\",\"level\":70,\"status\":\"已掌握\"},{\"name\":\"Rust\",\"level\":60,\"status\":\"学习中\"}],\"timeline\":[{\"date\":\"2024年9月-2025年6月\",\"title\":\"技术深度拓展\",\"desc\":\"深入学习云原生技术体系，掌握Kubernetes容器编排，完善微服务治理能力；参与开源项目贡献，积累实际工程经验\"},{\"date\":\"2025年7月-8月\",\"title\":\"暑期实习\",\"desc\":\"争取进入一线互联网公司后端开发岗位实习，接触大规模分布式系统，学习企业级开发流程和工程实践\"},{\"date\":\"2025年9月-2026年6月\",\"title\":\"系统能力提升\",\"desc\":\"深入研究系统设计原理，学习高并发、高可用架构设计；完成至少一个完整的云原生项目，掌握全链路开发部署流程\"},{\"date\":\"2026年7月-8月\",\"title\":\"技术实习进阶\",\"desc\":\"目标进入头部科技公司核心业务部门实习，参与实际产品开发，积累复杂系统设计和优化经验\"},{\"date\":\"2026年9月-2027年6月\",\"title\":\"求职准备与项目深化\",\"desc\":\"完善技术栈，准备校招面试；深化Rust语言学习，探索系统编程领域；优化个人项目，形成完整的技术作品集\"},{\"date\":\"2027年7月-9月\",\"title\":\"秋招冲刺\",\"desc\":\"参加互联网公司秋季招聘，目标后端开发、云原生工程师等岗位，重点投递一线互联网企业和有技术特色的创业公司\"},{\"date\":\"2028年6月\",\"title\":\"职业起点\",\"desc\":\"正式入职，开启软件工程师职业生涯，在实战中持续提升技术深度和工程能力\"}],\"completeness\":68,\"competitiveness\":72}',NULL,NULL,NULL,NULL,'completed',1775838760,1775838760),
(3,1,NULL,'职业规划报告 - gap','{\"skills\":[{\"name\":\"Golang\",\"level\":85,\"status\":\"已掌握\"},{\"name\":\"云原生技术栈\",\"level\":70,\"status\":\"已掌握\"},{\"name\":\"分布式系统设计\",\"level\":75,\"status\":\"已掌握\"},{\"name\":\"微服务架构\",\"level\":70,\"status\":\"已掌握\"},{\"name\":\"系统监控与可观测性\",\"level\":65,\"status\":\"学习中\"},{\"name\":\"Rust\",\"level\":60,\"status\":\"学习中\"},{\"name\":\"Kubernetes\",\"level\":0,\"status\":\"待学习\"},{\"name\":\"系统设计能力\",\"level\":65,\"status\":\"学习中\"}],\"timeline\":[{\"date\":\"2024年9月-2025年6月\",\"title\":\"技术深度拓展期\",\"desc\":\"深入学习云原生技术栈，掌握Kubernetes容器编排技术；完善分布式系统理论知识；参与开源项目贡献，提升工程实践能力；准备暑期实习申请\"},{\"date\":\"2025年7月-2025年9月\",\"title\":\"暑期实习实践\",\"desc\":\"争取进入一线互联网公司或科技企业实习，参与实际的后端开发或云原生项目，积累工业级项目经验，建立行业人脉\"},{\"date\":\"2025年10月-2026年6月\",\"title\":\"技术体系完善期\",\"desc\":\"基于实习经验完善技术栈，重点提升系统设计能力和架构思维；参与更复杂的项目开发；准备秋招技术面试，完善个人作品集\"},{\"date\":\"2026年7月-2026年9月\",\"title\":\"秋招冲刺与offer获取\",\"desc\":\"参加校园招聘，目标岗位：后端开发工程师、云原生开发工程师；争取获得2-3个优质offer，重点关注技术成长空间和团队氛围\"},{\"date\":\"2026年10月-2027年6月\",\"title\":\"毕业设计与职业准备\",\"desc\":\"完成高质量的毕业设计项目，深化某一技术领域的专精；提前学习入职后可能用到的技术；为职场转型做好心理和技能准备\"},{\"date\":\"2027年7月\",\"title\":\"正式入职\",\"desc\":\"开始第一份全职工作，快速适应工作环境，建立良好的工作习惯，争取在试用期内展现技术能力和学习潜力\"},{\"date\":\"2028年-2029年\",\"title\":\"职业成长期\",\"desc\":\"在工作中积累项目经验，争取参与核心系统开发；考取相关技术认证（如CKA、CKAD）；明确技术发展方向（架构师/技术专家/技术管理）\"}],\"completeness\":65,\"competitiveness\":72}',NULL,NULL,NULL,NULL,'completed',1775908288,1775908288);
DROP TABLE IF EXISTS `holland_test_results`;
CREATE TABLE `holland_test_results`(
`id` bigint(20) NOT NULL AUTO_INCREMENT,
`student_id` bigint(20) NOT NULL,
`career_code` varchar(10) NOT NULL,
`scores` json NOT NULL ,
`suitable_jobs` json NOT NULL ,
`description` text DEFAULT NULL,
`created_at` bigint(20) NOT NULL,
PRIMARY KEY(`id`),
KEY `idx_student_id`(`student_id`),
KEY `idx_career_code`(`career_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `holland_test_results` VALUES
(1,1,'RSA','{\"A\":4,\"R\":9,\"S\":5}','[\"音乐家\",\"程序员\",\"教师\",\"心理咨询师\",\"社工\",\"设计师\",\"工程师\",\"技术员\",\"建筑师\",\"作家\",\"艺术家\",\"编辑\",\"技工\",\"人力资源\",\"销售\"]','您的职业兴趣组合为RSA，主要特征包括实际型(Realistic)、社会型(Social)、艺术型(Artistic)。您适合从事艺术家、编辑、工程师、技术员、教师、心理咨询师、人力资源、销售、社工、作家、技工、建筑师、音乐家、设计师、程序员等职业方向。',1775925273);
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
(1,2,'user','你好',NULL,NULL,NULL,1775975114),
(2,2,'assistant','{\n \"question\": \"请简单介绍一下你自己，包括你的教育背景、工作经历和技术专长。\",\n \"score\": 0,\n \"feedback\": \"这是面试的开始，请清晰、有条理地介绍自己，突出与岗位相关的亮点。\",\n \"questionType\": \"self_intro\",\n \"sessionEnd\": false\n}','self_intro',0.00,'这是面试的开始，请清晰、有条理地介绍自己，突出与岗位相关的亮点。',1775975118),
(3,3,'user','你好我是某人对贵公司的岗位职位十分感兴趣',NULL,NULL,NULL,1775978041),
(4,3,'assistant','{\n \"question\": \"请简单介绍一下你自己，包括你的教育背景、工作经历以及为什么对这个岗位感兴趣。\",\n \"score\": 0,\n \"feedback\": \"这是面试的开始，请按照要求进行自我介绍。\",\n \"questionType\": \"self_intro\",\n \"sessionEnd\": false\n}','self_intro',0.00,'这是面试的开始，请按照要求进行自我介绍。',1775978044);
DROP TABLE IF EXISTS `interview_reports`;
CREATE TABLE `interview_reports`(
`id` bigint(20) NOT NULL AUTO_INCREMENT,
`session_id` bigint(20) NOT NULL,
`user_id` bigint(20) NOT NULL,
`overall_score` decimal(5,2) NOT NULL DEFAULT 0.00,
`skill_score` decimal(5,2) DEFAULT NULL,
`communication_score` decimal(5,2) DEFAULT NULL,
`logic_score` decimal(5,2) DEFAULT NULL,
`confidence_score` decimal(5,2) DEFAULT NULL,
`strengths` text DEFAULT NULL,
`weaknesses` text DEFAULT NULL,
`improvement_suggestions` text DEFAULT NULL,
`summary` text DEFAULT NULL,
`created_at` bigint(20) NOT NULL,
`updated_at` bigint(20) NOT NULL,
PRIMARY KEY(`id`),
KEY `idx_session_id`(`session_id`),
KEY `idx_user_id`(`user_id`)
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
(1,1,NULL,'practice','cancelled',0,0,0.00,0.00,0.00,527,1775973766,1775974293,1775974293),
(2,1,NULL,'practice','cancelled',0,1,0.00,0.00,0.00,442,1775974682,1775975124,1775975124),
(3,1,NULL,'practice','running',0,1,0.00,0.00,0.00,0,1775976196,1775978044,NULL);
DROP TABLE IF EXISTS `job_promotion_paths`;
CREATE TABLE `job_promotion_paths`(
`id` bigint(20) NOT NULL AUTO_INCREMENT,
`from_job_id` bigint(20) NOT NULL,
`to_job_id` bigint(20) NOT NULL,
`match_score` decimal(5,2) DEFAULT NULL,
`transfer_skills` text DEFAULT NULL,
`learning_path` text DEFAULT NULL,
`path_description` text DEFAULT NULL,
`required_skills` text DEFAULT NULL,
`estimated_years` int(11) DEFAULT NULL,
`created_at` bigint(20) NOT NULL,
`updated_at` bigint(20) NOT NULL,
PRIMARY KEY(`id`),
KEY `idx_from_job`(`from_job_id`),
KEY `idx_to_job`(`to_job_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `job_promotion_paths` VALUES
(1,1,11,90.00,'[\"Golang高级特性\",\"微服务架构设计\",\"性能优化\",\"系统稳定性保障\"]','深入学习Golang并发模型、内存管理、性能调优；研究大规模微服务治理、可观测性体系；参与高复杂度业务模块或基础组件开发',NULL,NULL,NULL,1775832888,1775832888),
(2,1,12,75.00,'[\"系统架构设计\",\"技术方案评审\",\"团队协作与指导\",\"技术规划能力\"]','学习分布式系统理论、架构设计模式；参与跨团队技术方案设计与评审；培养技术领导力和项目管理能力；关注行业技术趋势',NULL,NULL,NULL,1775832888,1775832888),
(3,1,13,65.00,'[\"前端开发基础\",\"前后端联调\",\"产品思维\",\"用户体验理解\"]','学习前端基础（HTML/CSS/JavaScript）、至少一个前端框架（React/Vue）；了解前后端协作流程；参与全栈项目实践',NULL,NULL,NULL,1775832888,1775832888),
(4,1,8,70.00,'[\"Linux系统管理\",\"容器化技术\",\"CI/CD流水线\",\"监控告警体系\"]','学习Docker/Kubernetes、云原生技术栈；掌握至少一种CI/CD工具；了解SRE理念和稳定性保障实践；参与运维自动化建设',NULL,NULL,NULL,1775832888,1775832888),
(5,1,14,60.00,'[\"项目管理\",\"需求分析\",\"跨部门沟通\",\"风险评估与应对\"]','学习项目管理方法论（如敏捷、Scrum）；参与项目规划与跟踪；提升沟通协调和团队管理能力；了解业务和产品知识',NULL,NULL,NULL,1775832888,1775832888),
(6,2,15,85.00,'[\"Java核心技术\",\"Spring/Spring Boot框架\",\"系统架构设计经验\",\"企业级应用开发\"]','[\"深入学习分布式系统设计、性能优化、高并发处理；参与或主导一个完整的中大型项目模块；考取阿里云相关认证。\"]',NULL,NULL,NULL,1775907627,1775907627),
(7,2,16,70.00,'[\"系统架构设计\",\"技术方案编写\",\"中间件使用经验\",\"问题分析与解决能力\"]','[\"系统学习微服务、云原生、领域驱动设计（DDD）；深入研究至少两种主流中间件（如消息队列、缓存）；参与公司级架构项目或开源项目贡献。\"]',NULL,NULL,NULL,1775907627,1775907627),
(8,2,17,65.00,'[\"项目管理能力\",\"团队协作经验\",\"技术沟通能力\",\"需求分析与拆解\"]','[\"学习敏捷开发、项目管理（如PMP或ACP认证基础）；尝试带领小型项目或任务小组；提升团队管理、沟通协调与决策能力。\"]',NULL,NULL,NULL,1775907627,1775907627),
(9,2,13,60.00,'[\"后端开发经验\",\"系统思维\",\"API设计能力\",\"数据库设计\"]','[\"学习前端技术栈（如Vue/React）、移动端开发基础；掌握DevOps工具链；实践一个完整的全栈项目。\"]',NULL,NULL,NULL,1775907627,1775907627);
DROP TABLE IF EXISTS `jobs`;
CREATE TABLE `jobs`(
`id` bigint(20) NOT NULL AUTO_INCREMENT,
`name` varchar(200) NOT NULL,
`description` text DEFAULT NULL,
`company` varchar(100) DEFAULT NULL,
`industry` varchar(100) DEFAULT NULL,
`location` varchar(100) DEFAULT NULL,
`salary_range` varchar(100) DEFAULT NULL,
`skills` text DEFAULT NULL,
`certificates` text DEFAULT NULL,
`soft_skills` text DEFAULT NULL,
`requirements` text DEFAULT NULL,
`growth_potential` text DEFAULT NULL,
`created_at` bigint(20) NOT NULL,
`updated_at` bigint(20) NOT NULL,
PRIMARY KEY(`id`),
KEY `idx_industry`(`industry`),
KEY `idx_location`(`location`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `jobs` VALUES
(1,'Golang后端开发工程师','负责公司后端服务开发，参与微服务架构设计与实现','字节跳动','技术','北京','15000-30000',NULL,NULL,NULL,'熟练掌握Golang编程语言，熟悉MySQL/Redis，了解微服务架构',NULL,1775831548,1775831548),
(2,'Java开发工程师','负责企业级应用后端开发，参与系统架构设计','阿里巴巴','技术','杭州','12000-25000',NULL,NULL,NULL,'熟练掌握Java，熟悉Spring框架，了解分布式系统',NULL,1775831548,1775831548),
(3,'前端开发工程师','负责Web前端开发，与后端工程师协作完成产品功能','腾讯','技术','深圳','12000-22000',NULL,NULL,NULL,'熟练掌握Vue/React，熟悉HTML/CSS/JavaScript',NULL,1775831548,1775831548),
(4,'Python数据分析师','负责数据分析和可视化，为业务决策提供支持','美团','数据','北京','15000-28000',NULL,NULL,NULL,'熟练掌握Python，熟悉Pandas/NumPy，了解数据可视化',NULL,1775831548,1775831548),
(5,'产品经理','负责产品规划与设计，协调研发团队推动产品迭代','字节跳动','产品','北京','18000-35000',NULL,NULL,NULL,'良好的沟通能力，了解互联网产品，有项目管理经验',NULL,1775831548,1775831548),
(6,'UI设计师','负责产品界面设计，提升用户体验','网易','设计','杭州','15000-28000',NULL,NULL,NULL,'熟练掌握Figma/Sketch，了解用户体验设计原则',NULL,1775831548,1775831548),
(7,'测试工程师','负责产品测试工作，保障软件质量','华为','技术','深圳','10000-20000',NULL,NULL,NULL,'熟悉测试流程，了解自动化测试框架',NULL,1775831548,1775831548),
(8,'运维工程师','负责服务器运维，保障系统稳定运行','阿里巴巴','技术','杭州','15000-25000',NULL,NULL,NULL,'熟悉Linux，了解Docker/K8s，有运维经验',NULL,1775831548,1775831548),
(9,'新媒体运营','负责新媒体平台运营，策划优质内容','小红书','运营','上海','8000-15000',NULL,NULL,NULL,'熟悉各平台运营规则，有内容策划能力',NULL,1775831548,1775831548),
(10,'内容编辑','负责内容策划与编辑，产出优质文章','今日头条','内容','北京','7000-14000',NULL,NULL,NULL,'良好的文字功底，了解内容运营',NULL,1775831548,1775831548),
(11,'高级Golang后端开发工程师',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1775832888,1775832888),
(12,'后端技术负责人/架构师',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1775832888,1775832888),
(13,'全栈开发工程师',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1775832888,1775832888),
(14,'技术项目经理',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1775832888,1775832888),
(15,'高级Java开发工程师',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1775907627,1775907627),
(16,'技术专家/架构师',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1775907627,1775907627),
(17,'技术经理/开发主管',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1775907627,1775907627);
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
INSERT INTO `resume_parse_history` VALUES
(1,1,NULL,'黑白设计通用国际贸易财务会计专业简历.docx','简小历 简小历 出生年月：20 06 . 8 手机：180 0000 1108 工作年限：应届毕业生（0年） 邮箱： jianlixiazai.cn 求职意向： Golang 软件开发岗 地址：广东省珠海市区 教育背景 教育背景 20 24 .XX – 20 28 .XX 浙江师范 大学 软件工程 专业 / 本科 主修课程 Golang 程序设计，rust 程序设计, 现代web开发，云原生开发，操作系统 实习经历 实习经历 20 24 .XX – 20 25 .XX 分布式博客系统 工作描述 基于 Golang + Gin 框架开发后端服务，设计并实现用户认证、文章发布、评论管理等核心模块，结合 JWT 完成身份鉴权； 使用 GORM 实现 MySQL 数据库交互，优化慢查询，提升接口响应效率； 基于 Redis 实现缓存层，降低数据库访问压力，并利用 RabbitMQ 处理异步任务，提升系统吞吐能力。 20 25 .XX – 20 26 .XX 云原生微服务 Demo 工作描述 基于 Go Kit 构建微服务架构，实现服务注册与发现（Consul）、负载均衡及熔断机制； 使用 Docker 容器化部署服务，编写 docker-compose 编排多服务环境； 引入 Prometheus + Grafana 进行服务监控，搭建基础可观测性体系 个人技能 个人技能 语言能力：英语通过 4,6 级考试，口语流利、普通话：流利 计算机能力：熟悉 Golang 编程、Git 协作流程，熟练使用 Linux 常用命令及 Docker 容器化工具 荣誉证书：校奖学金、软件工程专业课程优秀项目奖 个人评价 个人评价 积极主动，热爱技术，对 Golang 及云原生生态有浓厚兴趣。在校期间系统学习 Golang 程序设计、云原生开发等课程，并独立完成多个 Go 项目，具备良好的编码习惯与问题排查能力。乐于钻研源码与新技术，适应团队协作，善于沟通，致力于在 Golang 后端开发方向持续深耕','{\"id\":1775832400087521831,\"userId\":1,\"name\":\"简小历\",\"education\":\"bachelor\",\"major\":\"软件工程\",\"graduationYear\":2028,\"skills\":[{\"name\":\"Golang\",\"level\":85,\"years\":2},{\"name\":\"Gin\",\"level\":80,\"years\":1},{\"name\":\"MySQL\",\"level\":75,\"years\":1},{\"name\":\"Redis\",\"level\":75,\"years\":1},{\"name\":\"Docker\",\"level\":75,\"years\":1},{\"name\":\"Linux\",\"level\":70,\"years\":1},{\"name\":\"Git\",\"level\":80,\"years\":2},{\"name\":\"RabbitMQ\",\"level\":70,\"years\":1},{\"name\":\"Go Kit\",\"level\":70,\"years\":1},{\"name\":\"Consul\",\"level\":65,\"years\":1},{\"name\":\"Prometheus\",\"level\":65,\"years\":1},{\"name\":\"Grafana\",\"level\":65,\"years\":1},{\"name\":\"Rust\",\"level\":60,\"years\":1}],\"certificates\":[{\"name\":\"大学英语四级\",\"level\":\"通过\",\"year\":0},{\"name\":\"大学英语六级\",\"level\":\"通过\",\"year\":0},{\"name\":\"校奖学金\",\"level\":\"校级\",\"year\":0},{\"name\":\"软件工程专业课程优秀项目奖\",\"level\":\"校级\",\"year\":0}],\"softSkills\":{\"innovation\":75,\"learning\":85,\"pressure\":80,\"communication\":80,\"teamwork\":85},\"internship\":[],\"projects\":[{\"name\":\"分布式博客系统\",\"role\":\"开发者\",\"description\":\"基于 Golang + Gin 框架开发后端服务，设计并实现用户认证、文章发布、评论管理等核心模块，结合 JWT 完成身份鉴权；使用 GORM 实现 MySQL 数据库交互，优化慢查询，提升接口响应效率；基于 Redis 实现缓存层，降低数据库访问压力，并利用 RabbitMQ 处理异步任务，提升系统吞吐能力。\",\"technologies\":[\"Golang\",\"Gin\",\"JWT\",\"GORM\",\"MySQL\",\"Redis\",\"RabbitMQ\"]},{\"name\":\"云原生微服务 Demo\",\"role\":\"开发者\",\"description\":\"基于 Go Kit 构建微服务架构，实现服务注册与发现（Consul）、负载均衡及熔断机制；使用 Docker 容器化部署服务，编写 docker-compose 编排多服务环境；引入 Prometheus + Grafana 进行服务监控，搭建基础可观测性体系。\",\"technologies\":[\"Go Kit\",\"Consul\",\"Docker\",\"docker-compose\",\"Prometheus\",\"Grafana\"]}],\"completeness\":70,\"competitiveness\":75,\"suggestions\":[\"内容方面：简历中提及的‘实习经历’部分实际为项目经历，建议将标题‘实习经历’明确修改为‘项目经历’，以避免混淆。同时，建议补充真实的公司实习经历，这是应届生简历的关键部分。\",\"格式方面：简历中存在重复的标题（如‘简小历’、‘教育背景’、‘实习经历’、‘个人技能’），建议精简排版，确保每个部分标题唯一且清晰。日期格式建议统一为‘YYYY.MM’形式，并补充完整（如‘2024.XX’应尽可能具体）。\",\"技能方面：技能描述可以更结构化。建议将‘个人技能’部分拆分为‘技术技能’（如编程语言、框架、工具）和‘语言能力’等子类，并为关键技能（如Golang）补充更具体的掌握程度描述和项目佐证。\",\"表达方面：项目描述中已包含具体技术栈和成果，但可以进一步量化。例如，在‘优化慢查询，提升接口响应效率’后补充具体的性能提升百分比或响应时间数据，使成果更具说服力。\",\"个人信息方面：‘工作年限：应届毕业生（0年）’的表述略显冗余，可简化为‘应届毕业生’。邮箱地址‘jianlixiazai.cn’疑似有误（缺少‘@’符号），请务必核对并更正为有效的邮箱地址。\"],\"createdAt\":1775832400,\"updatedAt\":1775832400}','[\"内容方面：简历中提及的‘实习经历’部分实际为项目经历，建议将标题‘实习经历’明确修改为‘项目经历’，以避免混淆。同时，建议补充真实的公司实习经历，这是应届生简历的关键部分。\",\"格式方面：简历中存在重复的标题（如‘简小历’、‘教育背景’、‘实习经历’、‘个人技能’），建议精简排版，确保每个部分标题唯一且清晰。日期格式建议统一为‘YYYY.MM’形式，并补充完整（如‘2024.XX’应尽可能具体）。\",\"技能方面：技能描述可以更结构化。建议将‘个人技能’部分拆分为‘技术技能’（如编程语言、框架、工具）和‘语言能力’等子类，并为关键技能（如Golang）补充更具体的掌握程度描述和项目佐证。\",\"表达方面：项目描述中已包含具体技术栈和成果，但可以进一步量化。例如，在‘优化慢查询，提升接口响应效率’后补充具体的性能提升百分比或响应时间数据，使成果更具说服力。\",\"个人信息方面：‘工作年限：应届毕业生（0年）’的表述略显冗余，可简化为‘应届毕业生’。邮箱地址‘jianlixiazai.cn’疑似有误（缺少‘@’符号），请务必核对并更正为有效的邮箱地址。\"]',70,75,1775832400);
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
INSERT INTO `students` VALUES
(1,1,'简小历','bachelor','软件工程',2028,'[{\"name\":\"Golang\",\"level\":85,\"years\":2},{\"name\":\"Gin\",\"level\":80,\"years\":1},{\"name\":\"MySQL\",\"level\":75,\"years\":1},{\"name\":\"Redis\",\"level\":75,\"years\":1},{\"name\":\"Docker\",\"level\":75,\"years\":1},{\"name\":\"Linux\",\"level\":70,\"years\":1},{\"name\":\"Git\",\"level\":80,\"years\":2},{\"name\":\"RabbitMQ\",\"level\":70,\"years\":1},{\"name\":\"Go Kit\",\"level\":70,\"years\":1},{\"name\":\"Consul\",\"level\":65,\"years\":1},{\"name\":\"Prometheus\",\"level\":65,\"years\":1},{\"name\":\"Grafana\",\"level\":65,\"years\":1},{\"name\":\"Rust\",\"level\":60,\"years\":1}]','[{\"name\":\"大学英语四级\",\"level\":\"通过\",\"year\":2026},{\"name\":\"大学英语六级\",\"level\":\"通过\",\"year\":2026},{\"name\":\"校奖学金\",\"level\":\"校级\",\"year\":2026},{\"name\":\"软件工程专业课程优秀项目奖\",\"level\":\"中级\",\"year\":2026}]','{\"innovation\":75,\"learning\":85,\"pressure\":80,\"communication\":80,\"teamwork\":85}',NULL,'[{\"name\":\"分布式博客系统\",\"role\":\"开发者\",\"description\":\"基于 Golang + Gin 框架开发后端服务，设计并实现用户认证、文章发布、评论管理等核心模块，结合 JWT 完成身份鉴权；使用 GORM 实现 MySQL 数据库交互，优化慢查询，提升接口响应效率；基于 Redis 实现缓存层，降低数据库访问压力，并利用 RabbitMQ 处理异步任务，提升系统吞吐能力。\",\"technologies\":[\"Golang\",\"Gin\",\"JWT\",\"GORM\",\"MySQL\",\"Redis\",\"RabbitMQ\"]},{\"name\":\"云原生微服务 Demo\",\"role\":\"开发者\",\"description\":\"基于 Go Kit 构建微服务架构，实现服务注册与发现（Consul）、负载均衡及熔断机制；使用 Docker 容器化部署服务，编写 docker-compose 编排多服务环境；引入 Prometheus + Grafana 进行服务监控，搭建基础可观测性体系。\",\"technologies\":[\"Go Kit\",\"Consul\",\"Docker\",\"docker-compose\",\"Prometheus\",\"Grafana\"]}]',85.71428571428571,70,NULL,NULL,NULL,1775832400,1775832400);
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`(
`id` bigint(20) NOT NULL AUTO_INCREMENT,
`username` varchar(50) NOT NULL,
`password` varchar(255) NOT NULL,
`email` varchar(100) DEFAULT NULL,
`phone` varchar(20) DEFAULT NULL,
`avatar` varchar(255) DEFAULT NULL,
`role` varchar(20) NOT NULL DEFAULT 'student',
`created_at` bigint(20) NOT NULL,
`updated_at` bigint(20) NOT NULL,
PRIMARY KEY(`id`),
UNIQUE KEY `username`(`username`),
KEY `idx_username`(`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `users` VALUES
(1,'testuser','$2a$10$IQZQ1d0vKjJB0TM6roRdW.ZC14pqhQYh3ijbA.POxVHa1YN6bws.C','test@example.com','18974383500','avatar_1.png','user',1775831548,1775926230);
SET FOREIGN_KEY_CHECKS=1;
