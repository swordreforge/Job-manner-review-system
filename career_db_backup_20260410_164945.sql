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
`scores` json NOT NULL ,
`suitable_jobs` json NOT NULL ,
`description` text DEFAULT NULL,
`created_at` bigint(20) NOT NULL,
PRIMARY KEY(`id`),
KEY `idx_student_id`(`student_id`),
KEY `idx_career_code`(`career_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO `holland_test_results` VALUES
(1,1,'RSA','{\"A\":4,\"R\":9,\"S\":5}','[\"程序员\",\"教师\",\"艺术家\",\"建筑师\",\"心理咨询师\",\"销售\",\"社工\",\"设计师\",\"编辑\",\"工程师\",\"技工\",\"人力资源\",\"作家\",\"音乐家\",\"技术员\"]','您的职业兴趣组合为RSA，主要特征包括实际型(Realistic)、社会型(Social)、艺术型(Artistic)。您适合从事程序员、人力资源、销售、技术员、社工、设计师、艺术家、音乐家、工程师、建筑师、教师、心理咨询师、作家、技工、编辑等职业方向。',1775809087),
(2,1,'RSA','{\"A\":4,\"R\":9,\"S\":5}','[\"工程师\",\"音乐家\",\"技工\",\"教师\",\"人力资源\",\"社工\",\"技术员\",\"程序员\",\"建筑师\",\"销售\",\"艺术家\",\"心理咨询师\",\"设计师\",\"作家\",\"编辑\"]','您的职业兴趣组合为RSA，主要特征包括实际型(Realistic)、社会型(Social)、艺术型(Artistic)。您适合从事程序员、社工、作家、音乐家、艺术家、建筑师、教师、人力资源、销售、设计师、编辑、工程师、技术员、心理咨询师、技工等职业方向。',1775809116),
(3,1,'RSA','{\"A\":4,\"R\":9,\"S\":5}','[\"技术员\",\"艺术家\",\"编辑\",\"技工\",\"建筑师\",\"人力资源\",\"程序员\",\"社工\",\"设计师\",\"作家\",\"音乐家\",\"工程师\",\"教师\",\"心理咨询师\",\"销售\"]','您的职业兴趣组合为RSA，主要特征包括实际型(Realistic)、社会型(Social)、艺术型(Artistic)。您适合从事社工、设计师、技术员、技工、艺术家、编辑、建筑师、心理咨询师、销售、作家、音乐家、教师、人力资源、工程师、程序员等职业方向。',1775809842);
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
(1,'Golang后端开发工程师','负责公司后端服务开发，参与微服务架构设计与实现','字节跳动','技术','北京','15000-30000',NULL,NULL,NULL,'熟练掌握Golang编程语言，熟悉MySQL/Redis，了解微服务架构',NULL,1775806023,1775806023),
(2,'Java开发工程师','负责企业级应用后端开发，参与系统架构设计','阿里巴巴','技术','杭州','12000-25000',NULL,NULL,NULL,'熟练掌握Java，熟悉Spring框架，了解分布式系统',NULL,1775806023,1775806023),
(3,'前端开发工程师','负责Web前端开发，与后端工程师协作完成产品功能','腾讯','技术','深圳','12000-22000',NULL,NULL,NULL,'熟练掌握Vue/React，熟悉HTML/CSS/JavaScript',NULL,1775806023,1775806023),
(4,'Python数据分析师','负责数据分析和可视化，为业务决策提供支持','美团','数据','北京','15000-28000',NULL,NULL,NULL,'熟练掌握Python，熟悉Pandas/NumPy，了解数据可视化',NULL,1775806023,1775806023),
(5,'产品经理','负责产品规划与设计，协调研发团队推动产品迭代','字节跳动','产品','北京','18000-35000',NULL,NULL,NULL,'良好的沟通能力，了解互联网产品，有项目管理经验',NULL,1775806023,1775806023),
(6,'UI设计师','负责产品界面设计，提升用户体验','网易','设计','杭州','15000-28000',NULL,NULL,NULL,'熟练掌握Figma/Sketch，了解用户体验设计原则',NULL,1775806023,1775806023),
(7,'测试工程师','负责产品测试工作，保障软件质量','华为','技术','深圳','10000-20000',NULL,NULL,NULL,'熟悉测试流程，了解自动化测试框架',NULL,1775806023,1775806023),
(8,'运维工程师','负责服务器运维，保障系统稳定运行','阿里巴巴','技术','杭州','15000-25000',NULL,NULL,NULL,'熟悉Linux，了解Docker/K8s，有运维经验',NULL,1775806023,1775806023),
(9,'新媒体运营','负责新媒体平台运营，策划优质内容','小红书','运营','上海','8000-15000',NULL,NULL,NULL,'熟悉各平台运营规则，有内容策划能力',NULL,1775806023,1775806023),
(10,'内容编辑','负责内容策划与编辑，产出优质文章','今日头条','内容','北京','7000-14000',NULL,NULL,NULL,'良好的文字功底，了解内容运营',NULL,1775806023,1775806023);
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
(1,1,NULL,'黑白设计通用国际贸易财务会计专业简历.docx','简小历 简小历 出生年月：20 06 . 8 手机：180 0000 1108 工作年限：应届毕业生（0年） 邮箱： jianlixiazai.cn 求职意向： Golang 软件开发岗 地址：广东省珠海市区 教育背景 教育背景 20 24 .XX – 20 28 .XX 浙江师范 大学 软件工程 专业 / 本科 主修课程 Golang 程序设计，rust 程序设计, 现代web开发，云原生开发，操作系统 实习经历 实习经历 20 24 .XX – 20 25 .XX 分布式博客系统 工作描述 基于 Golang + Gin 框架开发后端服务，设计并实现用户认证、文章发布、评论管理等核心模块，结合 JWT 完成身份鉴权； 使用 GORM 实现 MySQL 数据库交互，优化慢查询，提升接口响应效率； 基于 Redis 实现缓存层，降低数据库访问压力，并利用 RabbitMQ 处理异步任务，提升系统吞吐能力。 20 25 .XX – 20 26 .XX 云原生微服务 Demo 工作描述 基于 Go Kit 构建微服务架构，实现服务注册与发现（Consul）、负载均衡及熔断机制； 使用 Docker 容器化部署服务，编写 docker-compose 编排多服务环境； 引入 Prometheus + Grafana 进行服务监控，搭建基础可观测性体系 个人技能 个人技能 语言能力：英语通过 4,6 级考试，口语流利、普通话：流利 计算机能力：熟悉 Golang 编程、Git 协作流程，熟练使用 Linux 常用命令及 Docker 容器化工具 荣誉证书：校奖学金、软件工程专业课程优秀项目奖 个人评价 个人评价 积极主动，热爱技术，对 Golang 及云原生生态有浓厚兴趣。在校期间系统学习 Golang 程序设计、云原生开发等课程，并独立完成多个 Go 项目，具备良好的编码习惯与问题排查能力。乐于钻研源码与新技术，适应团队协作，善于沟通，致力于在 Golang 后端开发方向持续深耕','{\"id\":1775807563320047933,\"userId\":1,\"name\":\"简小历\",\"education\":\"bachelor\",\"major\":\"软件工程\",\"graduationYear\":2028,\"skills\":[{\"name\":\"Golang\",\"level\":80,\"years\":2},{\"name\":\"Gin\",\"level\":75,\"years\":1},{\"name\":\"GORM\",\"level\":75,\"years\":1},{\"name\":\"MySQL\",\"level\":70,\"years\":1},{\"name\":\"Redis\",\"level\":70,\"years\":1},{\"name\":\"RabbitMQ\",\"level\":65,\"years\":1},{\"name\":\"Go Kit\",\"level\":70,\"years\":1},{\"name\":\"Consul\",\"level\":65,\"years\":1},{\"name\":\"Docker\",\"level\":75,\"years\":1},{\"name\":\"Prometheus\",\"level\":65,\"years\":1},{\"name\":\"Grafana\",\"level\":65,\"years\":1},{\"name\":\"Linux\",\"level\":70,\"years\":2},{\"name\":\"Git\",\"level\":75,\"years\":2},{\"name\":\"Rust\",\"level\":60,\"years\":1}],\"certificates\":[{\"name\":\"大学英语四级\",\"level\":\"通过\",\"year\":0},{\"name\":\"大学英语六级\",\"level\":\"通过\",\"year\":0},{\"name\":\"校奖学金\",\"level\":\"校级\",\"year\":0},{\"name\":\"软件工程专业课程优秀项目奖\",\"level\":\"校级\",\"year\":0}],\"softSkills\":{\"innovation\":75,\"learning\":85,\"pressure\":75,\"communication\":80,\"teamwork\":80},\"internship\":[],\"projects\":[{\"name\":\"分布式博客系统\",\"role\":\"开发者\",\"description\":\"基于 Golang + Gin 框架开发后端服务，设计并实现用户认证、文章发布、评论管理等核心模块，结合 JWT 完成身份鉴权；使用 GORM 实现 MySQL 数据库交互，优化慢查询，提升接口响应效率；基于 Redis 实现缓存层，降低数据库访问压力，并利用 RabbitMQ 处理异步任务，提升系统吞吐能力。\",\"technologies\":[\"Golang\",\"Gin\",\"JWT\",\"GORM\",\"MySQL\",\"Redis\",\"RabbitMQ\"]},{\"name\":\"云原生微服务 Demo\",\"role\":\"开发者\",\"description\":\"基于 Go Kit 构建微服务架构，实现服务注册与发现（Consul）、负载均衡及熔断机制；使用 Docker 容器化部署服务，编写 docker-compose 编排多服务环境；引入 Prometheus + Grafana 进行服务监控，搭建基础可观测性体系。\",\"technologies\":[\"Go Kit\",\"Consul\",\"Docker\",\"Prometheus\",\"Grafana\"]}],\"completeness\":70,\"competitiveness\":75,\"suggestions\":[\"内容方面：简历中‘实习经历’部分标题下实际描述的是项目经历，建议将‘分布式博客系统’和‘云原生微服务 Demo’移至‘项目经历’部分，并补充真实的实习经历，包括公司名称、职位、时长和具体工作内容，这是求职Golang开发岗的重要竞争力。\",\"格式方面：优化简历结构，明确区分‘实习经历’与‘项目经历’。当前‘实习经历’标题下的内容应归类为‘项目经历’。建议使用更清晰的标题和排版，使招聘者能快速定位关键信息。\",\"技能方面：建议在技能列表中量化掌握程度和年限，并补充对Kubernetes、CI/CD等云原生相关技能的了解或学习计划，以增强在云原生方向的竞争力。\",\"表达方面：优化项目描述，使用STAR法则（情境、任务、行动、结果）来结构化描述，例如明确项目背景、个人职责、采取的技术行动以及达成的具体量化成果（如性能提升百分比）。\",\"个人信息方面：补充更具体的求职意向，例如‘Golang后端开发工程师’或‘云原生开发工程师’，并确保联系方式（如邮箱地址）格式正确无误。\"],\"createdAt\":1775807563,\"updatedAt\":1775807563}','[\"内容方面：简历中‘实习经历’部分标题下实际描述的是项目经历，建议将‘分布式博客系统’和‘云原生微服务 Demo’移至‘项目经历’部分，并补充真实的实习经历，包括公司名称、职位、时长和具体工作内容，这是求职Golang开发岗的重要竞争力。\",\"格式方面：优化简历结构，明确区分‘实习经历’与‘项目经历’。当前‘实习经历’标题下的内容应归类为‘项目经历’。建议使用更清晰的标题和排版，使招聘者能快速定位关键信息。\",\"技能方面：建议在技能列表中量化掌握程度和年限，并补充对Kubernetes、CI/CD等云原生相关技能的了解或学习计划，以增强在云原生方向的竞争力。\",\"表达方面：优化项目描述，使用STAR法则（情境、任务、行动、结果）来结构化描述，例如明确项目背景、个人职责、采取的技术行动以及达成的具体量化成果（如性能提升百分比）。\",\"个人信息方面：补充更具体的求职意向，例如‘Golang后端开发工程师’或‘云原生开发工程师’，并确保联系方式（如邮箱地址）格式正确无误。\"]',70,75,1775807563),
(2,1,NULL,'黑白设计通用国际贸易财务会计专业简历.docx','简小历 简小历 出生年月：20 06 . 8 手机：180 0000 1108 工作年限：应届毕业生（0年） 邮箱： jianlixiazai.cn 求职意向： Golang 软件开发岗 地址：广东省珠海市区 教育背景 教育背景 20 24 .XX – 20 28 .XX 浙江师范 大学 软件工程 专业 / 本科 主修课程 Golang 程序设计，rust 程序设计, 现代web开发，云原生开发，操作系统 实习经历 实习经历 20 24 .XX – 20 25 .XX 分布式博客系统 工作描述 基于 Golang + Gin 框架开发后端服务，设计并实现用户认证、文章发布、评论管理等核心模块，结合 JWT 完成身份鉴权； 使用 GORM 实现 MySQL 数据库交互，优化慢查询，提升接口响应效率； 基于 Redis 实现缓存层，降低数据库访问压力，并利用 RabbitMQ 处理异步任务，提升系统吞吐能力。 20 25 .XX – 20 26 .XX 云原生微服务 Demo 工作描述 基于 Go Kit 构建微服务架构，实现服务注册与发现（Consul）、负载均衡及熔断机制； 使用 Docker 容器化部署服务，编写 docker-compose 编排多服务环境； 引入 Prometheus + Grafana 进行服务监控，搭建基础可观测性体系 个人技能 个人技能 语言能力：英语通过 4,6 级考试，口语流利、普通话：流利 计算机能力：熟悉 Golang 编程、Git 协作流程，熟练使用 Linux 常用命令及 Docker 容器化工具 荣誉证书：校奖学金、软件工程专业课程优秀项目奖 个人评价 个人评价 积极主动，热爱技术，对 Golang 及云原生生态有浓厚兴趣。在校期间系统学习 Golang 程序设计、云原生开发等课程，并独立完成多个 Go 项目，具备良好的编码习惯与问题排查能力。乐于钻研源码与新技术，适应团队协作，善于沟通，致力于在 Golang 后端开发方向持续深耕','{\"id\":1775808152233030848,\"userId\":1,\"name\":\"简小历\",\"education\":\"bachelor\",\"major\":\"软件工程\",\"graduationYear\":2028,\"skills\":[{\"name\":\"Golang\",\"level\":85,\"years\":2},{\"name\":\"Gin\",\"level\":80,\"years\":1},{\"name\":\"GORM\",\"level\":75,\"years\":1},{\"name\":\"MySQL\",\"level\":75,\"years\":1},{\"name\":\"Redis\",\"level\":70,\"years\":1},{\"name\":\"RabbitMQ\",\"level\":70,\"years\":1},{\"name\":\"Go Kit\",\"level\":75,\"years\":1},{\"name\":\"Consul\",\"level\":70,\"years\":1},{\"name\":\"Docker\",\"level\":75,\"years\":1},{\"name\":\"Prometheus\",\"level\":65,\"years\":1},{\"name\":\"Grafana\",\"level\":65,\"years\":1},{\"name\":\"Linux\",\"level\":70,\"years\":2},{\"name\":\"Git\",\"level\":80,\"years\":2},{\"name\":\"Rust\",\"level\":60,\"years\":1}],\"certificates\":[{\"name\":\"大学英语四级\",\"level\":\"通过\",\"year\":0},{\"name\":\"大学英语六级\",\"level\":\"通过\",\"year\":0},{\"name\":\"校奖学金\",\"level\":\"校级\",\"year\":0},{\"name\":\"软件工程专业课程优秀项目奖\",\"level\":\"校级\",\"year\":0}],\"softSkills\":{\"innovation\":75,\"learning\":85,\"pressure\":80,\"communication\":80,\"teamwork\":80},\"internship\":[],\"projects\":[{\"name\":\"分布式博客系统\",\"role\":\"开发者\",\"description\":\"基于 Golang + Gin 框架开发后端服务，设计并实现用户认证、文章发布、评论管理等核心模块，结合 JWT 完成身份鉴权；使用 GORM 实现 MySQL 数据库交互，优化慢查询，提升接口响应效率；基于 Redis 实现缓存层，降低数据库访问压力，并利用 RabbitMQ 处理异步任务，提升系统吞吐能力。\",\"technologies\":[\"Golang\",\"Gin\",\"JWT\",\"GORM\",\"MySQL\",\"Redis\",\"RabbitMQ\"]},{\"name\":\"云原生微服务 Demo\",\"role\":\"开发者\",\"description\":\"基于 Go Kit 构建微服务架构，实现服务注册与发现（Consul）、负载均衡及熔断机制；使用 Docker 容器化部署服务，编写 docker-compose 编排多服务环境；引入 Prometheus + Grafana 进行服务监控，搭建基础可观测性体系。\",\"technologies\":[\"Go Kit\",\"Consul\",\"Docker\",\"Prometheus\",\"Grafana\"]}],\"completeness\":70,\"competitiveness\":75,\"suggestions\":[\"内容方面：简历中提及的‘实习经历’部分实际为项目经历描述，建议将‘分布式博客系统’和‘云原生微服务 Demo’移至‘项目经历’部分，并补充真实的公司实习经历，包括公司名称、职位、时长和具体工作内容，以增强简历的可信度和竞争力。\",\"格式方面：优化简历结构，明确区分‘实习经历’与‘项目经历’。当前‘实习经历’标题下的内容实为项目，这容易造成误解。建议调整标题和内容归属，使结构更清晰、专业。\",\"技能方面：建议在技能列表中补充对‘云原生开发’、‘现代web开发’、‘操作系统’等主修课程相关技能的掌握程度和年限，使技能描述更具体、量化，并与项目经验中的技术栈形成呼应。\",\"表达方面：优化‘个人评价’部分的描述，使其更具针对性。例如，可将‘热爱技术’、‘乐于钻研’等概括性表述，与具体的技术领域（如Golang、云原生）和已展示的项目成果结合，用更具体的事例来支撑个人能力。\",\"信息完整性：补充证书（如英语四六级）的具体获得年份，以及教育背景中主修课程的更多细节或相关成绩，使简历信息更完整、可信。\"],\"createdAt\":1775808152,\"updatedAt\":1775808152}','[\"内容方面：简历中提及的‘实习经历’部分实际为项目经历描述，建议将‘分布式博客系统’和‘云原生微服务 Demo’移至‘项目经历’部分，并补充真实的公司实习经历，包括公司名称、职位、时长和具体工作内容，以增强简历的可信度和竞争力。\",\"格式方面：优化简历结构，明确区分‘实习经历’与‘项目经历’。当前‘实习经历’标题下的内容实为项目，这容易造成误解。建议调整标题和内容归属，使结构更清晰、专业。\",\"技能方面：建议在技能列表中补充对‘云原生开发’、‘现代web开发’、‘操作系统’等主修课程相关技能的掌握程度和年限，使技能描述更具体、量化，并与项目经验中的技术栈形成呼应。\",\"表达方面：优化‘个人评价’部分的描述，使其更具针对性。例如，可将‘热爱技术’、‘乐于钻研’等概括性表述，与具体的技术领域（如Golang、云原生）和已展示的项目成果结合，用更具体的事例来支撑个人能力。\",\"信息完整性：补充证书（如英语四六级）的具体获得年份，以及教育背景中主修课程的更多细节或相关成绩，使简历信息更完整、可信。\"]',70,75,1775808152),
(3,1,NULL,'黑白设计通用国际贸易财务会计专业简历.docx','简小历 简小历 出生年月：20 06 . 8 手机：180 0000 1108 工作年限：应届毕业生（0年） 邮箱： jianlixiazai.cn 求职意向： Golang 软件开发岗 地址：广东省珠海市区 教育背景 教育背景 20 24 .XX – 20 28 .XX 浙江师范 大学 软件工程 专业 / 本科 主修课程 Golang 程序设计，rust 程序设计, 现代web开发，云原生开发，操作系统 实习经历 实习经历 20 24 .XX – 20 25 .XX 分布式博客系统 工作描述 基于 Golang + Gin 框架开发后端服务，设计并实现用户认证、文章发布、评论管理等核心模块，结合 JWT 完成身份鉴权； 使用 GORM 实现 MySQL 数据库交互，优化慢查询，提升接口响应效率； 基于 Redis 实现缓存层，降低数据库访问压力，并利用 RabbitMQ 处理异步任务，提升系统吞吐能力。 20 25 .XX – 20 26 .XX 云原生微服务 Demo 工作描述 基于 Go Kit 构建微服务架构，实现服务注册与发现（Consul）、负载均衡及熔断机制； 使用 Docker 容器化部署服务，编写 docker-compose 编排多服务环境； 引入 Prometheus + Grafana 进行服务监控，搭建基础可观测性体系 个人技能 个人技能 语言能力：英语通过 4,6 级考试，口语流利、普通话：流利 计算机能力：熟悉 Golang 编程、Git 协作流程，熟练使用 Linux 常用命令及 Docker 容器化工具 荣誉证书：校奖学金、软件工程专业课程优秀项目奖 个人评价 个人评价 积极主动，热爱技术，对 Golang 及云原生生态有浓厚兴趣。在校期间系统学习 Golang 程序设计、云原生开发等课程，并独立完成多个 Go 项目，具备良好的编码习惯与问题排查能力。乐于钻研源码与新技术，适应团队协作，善于沟通，致力于在 Golang 后端开发方向持续深耕','{\"id\":1775808677582605283,\"userId\":1,\"name\":\"简小历\",\"education\":\"bachelor\",\"major\":\"软件工程\",\"graduationYear\":2028,\"skills\":[{\"name\":\"Golang\",\"level\":80,\"years\":2},{\"name\":\"Gin\",\"level\":75,\"years\":1},{\"name\":\"MySQL\",\"level\":70,\"years\":1},{\"name\":\"Redis\",\"level\":70,\"years\":1},{\"name\":\"Docker\",\"level\":75,\"years\":1},{\"name\":\"Linux\",\"level\":70,\"years\":1},{\"name\":\"Git\",\"level\":75,\"years\":2},{\"name\":\"RabbitMQ\",\"level\":65,\"years\":1},{\"name\":\"Go Kit\",\"level\":70,\"years\":1},{\"name\":\"Consul\",\"level\":65,\"years\":1},{\"name\":\"Prometheus\",\"level\":65,\"years\":1},{\"name\":\"Grafana\",\"level\":65,\"years\":1},{\"name\":\"Rust\",\"level\":60,\"years\":1},{\"name\":\"现代Web开发\",\"level\":65,\"years\":1},{\"name\":\"云原生开发\",\"level\":70,\"years\":1}],\"certificates\":[{\"name\":\"大学英语四级\",\"level\":\"通过\",\"year\":0},{\"name\":\"大学英语六级\",\"level\":\"通过\",\"year\":0},{\"name\":\"校奖学金\",\"level\":\"校级\",\"year\":0},{\"name\":\"软件工程专业课程优秀项目奖\",\"level\":\"院级\",\"year\":0}],\"softSkills\":{\"innovation\":75,\"learning\":85,\"pressure\":80,\"communication\":80,\"teamwork\":80},\"internship\":[{\"company\":\"\",\"position\":\"\",\"duration\":12,\"description\":\"基于 Golang + Gin 框架开发后端服务，设计并实现用户认证、文章发布、评论管理等核心模块，结合 JWT 完成身份鉴权；使用 GORM 实现 MySQL 数据库交互，优化慢查询，提升接口响应效率；基于 Redis 实现缓存层，降低数据库访问压力，并利用 RabbitMQ 处理异步任务，提升系统吞吐能力。\"},{\"company\":\"\",\"position\":\"\",\"duration\":12,\"description\":\"基于 Go Kit 构建微服务架构，实现服务注册与发现（Consul）、负载均衡及熔断机制；使用 Docker 容器化部署服务，编写 docker-compose 编排多服务环境；引入 Prometheus + Grafana 进行服务监控，搭建基础可观测性体系。\"}],\"projects\":[{\"name\":\"分布式博客系统\",\"role\":\"开发者\",\"description\":\"基于 Golang + Gin 框架开发后端服务，设计并实现用户认证、文章发布、评论管理等核心模块，结合 JWT 完成身份鉴权；使用 GORM 实现 MySQL 数据库交互，优化慢查询，提升接口响应效率；基于 Redis 实现缓存层，降低数据库访问压力，并利用 RabbitMQ 处理异步任务，提升系统吞吐能力。\",\"technologies\":[\"Golang\",\"Gin\",\"JWT\",\"GORM\",\"MySQL\",\"Redis\",\"RabbitMQ\"]},{\"name\":\"云原生微服务 Demo\",\"role\":\"开发者\",\"description\":\"基于 Go Kit 构建微服务架构，实现服务注册与发现（Consul）、负载均衡及熔断机制；使用 Docker 容器化部署服务，编写 docker-compose 编排多服务环境；引入 Prometheus + Grafana 进行服务监控，搭建基础可观测性体系。\",\"technologies\":[\"Go Kit\",\"Consul\",\"Docker\",\"docker-compose\",\"Prometheus\",\"Grafana\"]}],\"completeness\":70,\"competitiveness\":75,\"suggestions\":[\"内容方面：实习经历部分缺少具体的公司名称和职位名称，建议补充以增强可信度和专业性。\",\"格式方面：简历中存在重复的标题（如‘简小历’、‘教育背景’、‘实习经历’），建议优化排版，确保信息结构清晰、无冗余。\",\"技能方面：建议将技能按类别（如编程语言、框架、工具等）分组列出，并量化掌握程度（如‘熟练’、‘掌握’），使技能展示更系统化。\",\"表达方面：项目描述中使用了技术术语，但可以进一步突出个人贡献和项目成果（如性能提升百分比、解决的问题等），使描述更具说服力。\",\"证书方面：荣誉证书（如校奖学金）建议补充获得年份，英语等级证书建议明确分数或等级（如CET-4: 550分），以提供更具体的信息。\"],\"createdAt\":1775808677,\"updatedAt\":1775808677}','[\"内容方面：实习经历部分缺少具体的公司名称和职位名称，建议补充以增强可信度和专业性。\",\"格式方面：简历中存在重复的标题（如‘简小历’、‘教育背景’、‘实习经历’），建议优化排版，确保信息结构清晰、无冗余。\",\"技能方面：建议将技能按类别（如编程语言、框架、工具等）分组列出，并量化掌握程度（如‘熟练’、‘掌握’），使技能展示更系统化。\",\"表达方面：项目描述中使用了技术术语，但可以进一步突出个人贡献和项目成果（如性能提升百分比、解决的问题等），使描述更具说服力。\",\"证书方面：荣誉证书（如校奖学金）建议补充获得年份，英语等级证书建议明确分数或等级（如CET-4: 550分），以提供更具体的信息。\"]',70,75,1775808677),
(4,1,NULL,'黑白设计通用国际贸易财务会计专业简历.docx','简小历 简小历 出生年月：20 06 . 8 手机：180 0000 1108 工作年限：应届毕业生（0年） 邮箱： jianlixiazai.cn 求职意向： Golang 软件开发岗 地址：广东省珠海市区 教育背景 教育背景 20 24 .XX – 20 28 .XX 浙江师范 大学 软件工程 专业 / 本科 主修课程 Golang 程序设计，rust 程序设计, 现代web开发，云原生开发，操作系统 实习经历 实习经历 20 24 .XX – 20 25 .XX 分布式博客系统 工作描述 基于 Golang + Gin 框架开发后端服务，设计并实现用户认证、文章发布、评论管理等核心模块，结合 JWT 完成身份鉴权； 使用 GORM 实现 MySQL 数据库交互，优化慢查询，提升接口响应效率； 基于 Redis 实现缓存层，降低数据库访问压力，并利用 RabbitMQ 处理异步任务，提升系统吞吐能力。 20 25 .XX – 20 26 .XX 云原生微服务 Demo 工作描述 基于 Go Kit 构建微服务架构，实现服务注册与发现（Consul）、负载均衡及熔断机制； 使用 Docker 容器化部署服务，编写 docker-compose 编排多服务环境； 引入 Prometheus + Grafana 进行服务监控，搭建基础可观测性体系 个人技能 个人技能 语言能力：英语通过 4,6 级考试，口语流利、普通话：流利 计算机能力：熟悉 Golang 编程、Git 协作流程，熟练使用 Linux 常用命令及 Docker 容器化工具 荣誉证书：校奖学金、软件工程专业课程优秀项目奖 个人评价 个人评价 积极主动，热爱技术，对 Golang 及云原生生态有浓厚兴趣。在校期间系统学习 Golang 程序设计、云原生开发等课程，并独立完成多个 Go 项目，具备良好的编码习惯与问题排查能力。乐于钻研源码与新技术，适应团队协作，善于沟通，致力于在 Golang 后端开发方向持续深耕','{\"id\":1775808937878639587,\"userId\":1,\"name\":\"简小历\",\"education\":\"bachelor\",\"major\":\"软件工程\",\"graduationYear\":2028,\"skills\":[{\"name\":\"Golang\",\"level\":80,\"years\":2},{\"name\":\"Gin\",\"level\":75,\"years\":1},{\"name\":\"GORM\",\"level\":70,\"years\":1},{\"name\":\"MySQL\",\"level\":70,\"years\":1},{\"name\":\"Redis\",\"level\":65,\"years\":1},{\"name\":\"RabbitMQ\",\"level\":60,\"years\":1},{\"name\":\"Go Kit\",\"level\":65,\"years\":1},{\"name\":\"Consul\",\"level\":60,\"years\":1},{\"name\":\"Docker\",\"level\":70,\"years\":1},{\"name\":\"Prometheus\",\"level\":60,\"years\":1},{\"name\":\"Grafana\",\"level\":60,\"years\":1},{\"name\":\"Linux\",\"level\":70,\"years\":2},{\"name\":\"Git\",\"level\":75,\"years\":2},{\"name\":\"Rust\",\"level\":50,\"years\":1}],\"certificates\":[{\"name\":\"大学英语四级\",\"level\":\"通过\",\"year\":0},{\"name\":\"大学英语六级\",\"level\":\"通过\",\"year\":0},{\"name\":\"校奖学金\",\"level\":\"校级\",\"year\":0},{\"name\":\"软件工程专业课程优秀项目奖\",\"level\":\"校级\",\"year\":0}],\"softSkills\":{\"innovation\":75,\"learning\":85,\"pressure\":70,\"communication\":75,\"teamwork\":80},\"internship\":[],\"projects\":[{\"name\":\"分布式博客系统\",\"role\":\"开发者\",\"description\":\"基于 Golang + Gin 框架开发后端服务，设计并实现用户认证、文章发布、评论管理等核心模块，结合 JWT 完成身份鉴权；使用 GORM 实现 MySQL 数据库交互，优化慢查询，提升接口响应效率；基于 Redis 实现缓存层，降低数据库访问压力，并利用 RabbitMQ 处理异步任务，提升系统吞吐能力。\",\"technologies\":[\"Golang\",\"Gin\",\"JWT\",\"GORM\",\"MySQL\",\"Redis\",\"RabbitMQ\"]},{\"name\":\"云原生微服务 Demo\",\"role\":\"开发者\",\"description\":\"基于 Go Kit 构建微服务架构，实现服务注册与发现（Consul）、负载均衡及熔断机制；使用 Docker 容器化部署服务，编写 docker-compose 编排多服务环境；引入 Prometheus + Grafana 进行服务监控，搭建基础可观测性体系。\",\"technologies\":[\"Go Kit\",\"Consul\",\"Docker\",\"docker-compose\",\"Prometheus\",\"Grafana\"]}],\"completeness\":70,\"competitiveness\":75,\"suggestions\":[\"内容方面：简历中缺少明确的实习经历。‘实习经历’标题下的内容实际为项目描述，建议将‘分布式博客系统’和‘云原生微服务 Demo’移至‘项目经历’部分，并补充真实的公司实习经历，包括公司名称、职位、时长和具体工作内容，以增强简历的实践背景。\",\"格式方面：优化简历结构，确保‘教育背景’、‘实习经历’、‘项目经历’、‘个人技能’等模块清晰分隔。当前‘实习经历’部分内容与标题不符，容易造成误解，需立即调整。\",\"技能方面：建议在技能描述中量化掌握程度或使用年限，例如‘熟悉Golang（2年项目经验）’。同时，可考虑补充学习Kubernetes等云原生核心技术，以匹配求职意向中的‘云原生开发’方向，提升技术栈深度。\",\"表达方面：优化项目描述，使用STAR法则（情境、任务、行动、结果）来结构化描述，突出个人贡献和项目成果。例如，在‘分布式博客系统’中，可以具体说明‘优化慢查询’后接口响应时间提升了多少百分比。\",\"个人信息方面：建议补充更具体的求职意向，例如‘Golang后端开发工程师’或‘云原生开发工程师’，并确保邮箱地址格式正确（当前为‘jianlixiazai.cn’，缺少‘@’符号，应为‘xxx@xxx.com’格式）。\"],\"createdAt\":1775808937,\"updatedAt\":1775808937}','[\"内容方面：简历中缺少明确的实习经历。‘实习经历’标题下的内容实际为项目描述，建议将‘分布式博客系统’和‘云原生微服务 Demo’移至‘项目经历’部分，并补充真实的公司实习经历，包括公司名称、职位、时长和具体工作内容，以增强简历的实践背景。\",\"格式方面：优化简历结构，确保‘教育背景’、‘实习经历’、‘项目经历’、‘个人技能’等模块清晰分隔。当前‘实习经历’部分内容与标题不符，容易造成误解，需立即调整。\",\"技能方面：建议在技能描述中量化掌握程度或使用年限，例如‘熟悉Golang（2年项目经验）’。同时，可考虑补充学习Kubernetes等云原生核心技术，以匹配求职意向中的‘云原生开发’方向，提升技术栈深度。\",\"表达方面：优化项目描述，使用STAR法则（情境、任务、行动、结果）来结构化描述，突出个人贡献和项目成果。例如，在‘分布式博客系统’中，可以具体说明‘优化慢查询’后接口响应时间提升了多少百分比。\",\"个人信息方面：建议补充更具体的求职意向，例如‘Golang后端开发工程师’或‘云原生开发工程师’，并确保邮箱地址格式正确（当前为‘jianlixiazai.cn’，缺少‘@’符号，应为‘xxx@xxx.com’格式）。\"]',70,75,1775808937),
(5,2,NULL,'黑白设计通用国际贸易财务会计专业简历.docx','简小历 简小历 出生年月：20 06 . 8 手机：180 0000 1108 工作年限：应届毕业生（0年） 邮箱： jianlixiazai.cn 求职意向： Golang 软件开发岗 地址：广东省珠海市区 教育背景 教育背景 20 24 .XX – 20 28 .XX 浙江师范 大学 软件工程 专业 / 本科 主修课程 Golang 程序设计，rust 程序设计, 现代web开发，云原生开发，操作系统 实习经历 实习经历 20 24 .XX – 20 25 .XX 分布式博客系统 工作描述 基于 Golang + Gin 框架开发后端服务，设计并实现用户认证、文章发布、评论管理等核心模块，结合 JWT 完成身份鉴权； 使用 GORM 实现 MySQL 数据库交互，优化慢查询，提升接口响应效率； 基于 Redis 实现缓存层，降低数据库访问压力，并利用 RabbitMQ 处理异步任务，提升系统吞吐能力。 20 25 .XX – 20 26 .XX 云原生微服务 Demo 工作描述 基于 Go Kit 构建微服务架构，实现服务注册与发现（Consul）、负载均衡及熔断机制； 使用 Docker 容器化部署服务，编写 docker-compose 编排多服务环境； 引入 Prometheus + Grafana 进行服务监控，搭建基础可观测性体系 个人技能 个人技能 语言能力：英语通过 4,6 级考试，口语流利、普通话：流利 计算机能力：熟悉 Golang 编程、Git 协作流程，熟练使用 Linux 常用命令及 Docker 容器化工具 荣誉证书：校奖学金、软件工程专业课程优秀项目奖 个人评价 个人评价 积极主动，热爱技术，对 Golang 及云原生生态有浓厚兴趣。在校期间系统学习 Golang 程序设计、云原生开发等课程，并独立完成多个 Go 项目，具备良好的编码习惯与问题排查能力。乐于钻研源码与新技术，适应团队协作，善于沟通，致力于在 Golang 后端开发方向持续深耕','{\"id\":1775810591431100290,\"userId\":2,\"name\":\"简小历\",\"education\":\"bachelor\",\"major\":\"软件工程\",\"graduationYear\":2028,\"skills\":[{\"name\":\"Golang\",\"level\":80,\"years\":2},{\"name\":\"Gin\",\"level\":75,\"years\":1},{\"name\":\"GORM\",\"level\":70,\"years\":1},{\"name\":\"MySQL\",\"level\":70,\"years\":1},{\"name\":\"Redis\",\"level\":65,\"years\":1},{\"name\":\"RabbitMQ\",\"level\":60,\"years\":1},{\"name\":\"Go Kit\",\"level\":65,\"years\":1},{\"name\":\"Consul\",\"level\":60,\"years\":1},{\"name\":\"Docker\",\"level\":70,\"years\":1},{\"name\":\"Prometheus\",\"level\":60,\"years\":1},{\"name\":\"Grafana\",\"level\":60,\"years\":1},{\"name\":\"Linux\",\"level\":70,\"years\":2},{\"name\":\"Git\",\"level\":75,\"years\":2},{\"name\":\"Rust\",\"level\":50,\"years\":1}],\"certificates\":[{\"name\":\"大学英语四级\",\"level\":\"通过\",\"year\":0},{\"name\":\"大学英语六级\",\"level\":\"通过\",\"year\":0},{\"name\":\"校奖学金\",\"level\":\"校级\",\"year\":0},{\"name\":\"软件工程专业课程优秀项目奖\",\"level\":\"校级\",\"year\":0}],\"softSkills\":{\"innovation\":75,\"learning\":85,\"pressure\":70,\"communication\":75,\"teamwork\":80},\"internship\":[],\"projects\":[{\"name\":\"分布式博客系统\",\"role\":\"开发者\",\"description\":\"基于 Golang + Gin 框架开发后端服务，设计并实现用户认证、文章发布、评论管理等核心模块，结合 JWT 完成身份鉴权；使用 GORM 实现 MySQL 数据库交互，优化慢查询，提升接口响应效率；基于 Redis 实现缓存层，降低数据库访问压力，并利用 RabbitMQ 处理异步任务，提升系统吞吐能力。\",\"technologies\":[\"Golang\",\"Gin\",\"JWT\",\"GORM\",\"MySQL\",\"Redis\",\"RabbitMQ\"]},{\"name\":\"云原生微服务 Demo\",\"role\":\"开发者\",\"description\":\"基于 Go Kit 构建微服务架构，实现服务注册与发现（Consul）、负载均衡及熔断机制；使用 Docker 容器化部署服务，编写 docker-compose 编排多服务环境；引入 Prometheus + Grafana 进行服务监控，搭建基础可观测性体系。\",\"technologies\":[\"Go Kit\",\"Consul\",\"Docker\",\"docker-compose\",\"Prometheus\",\"Grafana\"]}],\"completeness\":70,\"competitiveness\":75,\"suggestions\":[\"内容方面：简历中缺少明确的实习经历。应将‘实习经历’标题下的‘分布式博客系统’和‘云原生微服务 Demo’归类为项目经历，并补充真实的公司实习信息，包括公司名称、职位、具体时长和职责描述，以增强简历的可信度和竞争力。\",\"格式方面：优化简历结构，将‘教育背景’、‘项目经历’、‘实习经历’（待补充）、‘个人技能’、‘荣誉证书’、‘个人评价’等模块清晰分隔。当前‘实习经历’部分内容实为项目描述，需修正标题以避免混淆。\",\"技能方面：建议在技能列表中量化掌握程度和年限，并考虑补充对Kubernetes等云原生核心技术的了解或学习计划，以更贴合Golang云原生开发岗位的要求。\",\"表达方面：优化项目描述，使用STAR法则（情境、任务、行动、结果）来结构化描述，例如明确项目背景、个人承担的具体任务、采取的技术行动以及达成的可量化成果（如性能提升百分比）。\",\"信息完整性：补充证书（如英语四六级）的具体获得年份，并考虑将‘个人评价’中的主观描述转化为‘技能’或‘项目经历’中更客观、具体的成就展示。\"],\"createdAt\":1775810591,\"updatedAt\":1775810591}','[\"内容方面：简历中缺少明确的实习经历。应将‘实习经历’标题下的‘分布式博客系统’和‘云原生微服务 Demo’归类为项目经历，并补充真实的公司实习信息，包括公司名称、职位、具体时长和职责描述，以增强简历的可信度和竞争力。\",\"格式方面：优化简历结构，将‘教育背景’、‘项目经历’、‘实习经历’（待补充）、‘个人技能’、‘荣誉证书’、‘个人评价’等模块清晰分隔。当前‘实习经历’部分内容实为项目描述，需修正标题以避免混淆。\",\"技能方面：建议在技能列表中量化掌握程度和年限，并考虑补充对Kubernetes等云原生核心技术的了解或学习计划，以更贴合Golang云原生开发岗位的要求。\",\"表达方面：优化项目描述，使用STAR法则（情境、任务、行动、结果）来结构化描述，例如明确项目背景、个人承担的具体任务、采取的技术行动以及达成的可量化成果（如性能提升百分比）。\",\"信息完整性：补充证书（如英语四六级）的具体获得年份，并考虑将‘个人评价’中的主观描述转化为‘技能’或‘项目经历’中更客观、具体的成就展示。\"]',70,75,1775810591);
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
(1,1,'简小历','bachelor','软件工程',2028,'[{\"name\":\"Golang\",\"level\":80,\"years\":2},{\"name\":\"Gin\",\"level\":75,\"years\":1},{\"name\":\"GORM\",\"level\":70,\"years\":1},{\"name\":\"MySQL\",\"level\":70,\"years\":1},{\"name\":\"Redis\",\"level\":65,\"years\":1},{\"name\":\"RabbitMQ\",\"level\":60,\"years\":1},{\"name\":\"Go Kit\",\"level\":65,\"years\":1},{\"name\":\"Consul\",\"level\":60,\"years\":1},{\"name\":\"Docker\",\"level\":70,\"years\":1},{\"name\":\"Prometheus\",\"level\":60,\"years\":1},{\"name\":\"Grafana\",\"level\":60,\"years\":1},{\"name\":\"Linux\",\"level\":70,\"years\":2},{\"name\":\"Git\",\"level\":75,\"years\":2},{\"name\":\"Rust\",\"level\":50,\"years\":1}]','[{\"name\":\"大学英语四级\",\"level\":\"通过\",\"year\":0},{\"name\":\"大学英语六级\",\"level\":\"通过\",\"year\":0},{\"name\":\"校奖学金\",\"level\":\"校级\",\"year\":0},{\"name\":\"软件工程专业课程优秀项目奖\",\"level\":\"校级\",\"year\":0}]','{\"innovation\":75,\"learning\":85,\"pressure\":70,\"communication\":75,\"teamwork\":80}','[]','[{\"name\":\"分布式博客系统\",\"role\":\"开发者\",\"description\":\"基于 Golang + Gin 框架开发后端服务，设计并实现用户认证、文章发布、评论管理等核心模块，结合 JWT 完成身份鉴权；使用 GORM 实现 MySQL 数据库交互，优化慢查询，提升接口响应效率；基于 Redis 实现缓存层，降低数据库访问压力，并利用 RabbitMQ 处理异步任务，提升系统吞吐能力。\",\"technologies\":[\"Golang\",\"Gin\",\"JWT\",\"GORM\",\"MySQL\",\"Redis\",\"RabbitMQ\"]},{\"name\":\"云原生微服务 Demo\",\"role\":\"开发者\",\"description\":\"基于 Go Kit 构建微服务架构，实现服务注册与发现（Consul）、负载均衡及熔断机制；使用 Docker 容器化部署服务，编写 docker-compose 编排多服务环境；引入 Prometheus + Grafana 进行服务监控，搭建基础可观测性体系。\",\"technologies\":[\"Go Kit\",\"Consul\",\"Docker\",\"docker-compose\",\"Prometheus\",\"Grafana\"]}]',70,75,NULL,'[\"内容方面：简历中缺少明确的实习经历。‘实习经历’标题下的内容实际为项目描述，建议将‘分布式博客系统’和‘云原生微服务 Demo’移至‘项目经历’部分，并补充真实的公司实习经历，包括公司名称、职位、时长和具体工作内容，以增强简历的实践背景。\",\"格式方面：优化简历结构，确保‘教育背景’、‘实习经历’、‘项目经历’、‘个人技能’等模块清晰分隔。当前‘实习经历’部分内容与标题不符，容易造成误解，需立即调整。\",\"技能方面：建议在技能描述中量化掌握程度或使用年限，例如‘熟悉Golang（2年项目经验）’。同时，可考虑补充学习Kubernetes等云原生核心技术，以匹配求职意向中的‘云原生开发’方向，提升技术栈深度。\",\"表达方面：优化项目描述，使用STAR法则（情境、任务、行动、结果）来结构化描述，突出个人贡献和项目成果。例如，在‘分布式博客系统’中，可以具体说明‘优化慢查询’后接口响应时间提升了多少百分比。\",\"个人信息方面：建议补充更具体的求职意向，例如‘Golang后端开发工程师’或‘云原生开发工程师’，并确保邮箱地址格式正确（当前为‘jianlixiazai.cn’，缺少‘@’符号，应为‘xxx@xxx.com’格式）。\"]','简小历 简小历 出生年月：20 06 . 8 手机：180 0000 1108 工作年限：应届毕业生（0年） 邮箱： jianlixiazai.cn 求职意向： Golang 软件开发岗 地址：广东省珠海市区 教育背景 教育背景 20 24 .XX – 20 28 .XX 浙江师范 大学 软件工程 专业 / 本科 主修课程 Golang 程序设计，rust 程序设计, 现代web开发，云原生开发，操作系统 实习经历 实习经历 20 24 .XX – 20 25 .XX 分布式博客系统 工作描述 基于 Golang + Gin 框架开发后端服务，设计并实现用户认证、文章发布、评论管理等核心模块，结合 JWT 完成身份鉴权； 使用 GORM 实现 MySQL 数据库交互，优化慢查询，提升接口响应效率； 基于 Redis 实现缓存层，降低数据库访问压力，并利用 RabbitMQ 处理异步任务，提升系统吞吐能力。 20 25 .XX – 20 26 .XX 云原生微服务 Demo 工作描述 基于 Go Kit 构建微服务架构，实现服务注册与发现（Consul）、负载均衡及熔断机制； 使用 Docker 容器化部署服务，编写 docker-compose 编排多服务环境； 引入 Prometheus + Grafana 进行服务监控，搭建基础可观测性体系 个人技能 个人技能 语言能力：英语通过 4,6 级考试，口语流利、普通话：流利 计算机能力：熟悉 Golang 编程、Git 协作流程，熟练使用 Linux 常用命令及 Docker 容器化工具 荣誉证书：校奖学金、软件工程专业课程优秀项目奖 个人评价 个人评价 积极主动，热爱技术，对 Golang 及云原生生态有浓厚兴趣。在校期间系统学习 Golang 程序设计、云原生开发等课程，并独立完成多个 Go 项目，具备良好的编码习惯与问题排查能力。乐于钻研源码与新技术，适应团队协作，善于沟通，致力于在 Golang 后端开发方向持续深耕',1775807563,1775807563),
(2,2,'简小历','bachelor','软件工程',2028,'[{\"name\":\"Golang\",\"level\":80,\"years\":2},{\"name\":\"Gin\",\"level\":75,\"years\":1},{\"name\":\"GORM\",\"level\":70,\"years\":1},{\"name\":\"MySQL\",\"level\":70,\"years\":1},{\"name\":\"Redis\",\"level\":65,\"years\":1},{\"name\":\"RabbitMQ\",\"level\":60,\"years\":1},{\"name\":\"Go Kit\",\"level\":65,\"years\":1},{\"name\":\"Consul\",\"level\":60,\"years\":1},{\"name\":\"Docker\",\"level\":70,\"years\":1},{\"name\":\"Prometheus\",\"level\":60,\"years\":1},{\"name\":\"Grafana\",\"level\":60,\"years\":1},{\"name\":\"Linux\",\"level\":70,\"years\":2},{\"name\":\"Git\",\"level\":75,\"years\":2},{\"name\":\"Rust\",\"level\":50,\"years\":1}]','[{\"name\":\"大学英语四级\",\"level\":\"通过\",\"year\":0},{\"name\":\"大学英语六级\",\"level\":\"通过\",\"year\":0},{\"name\":\"校奖学金\",\"level\":\"校级\",\"year\":0},{\"name\":\"软件工程专业课程优秀项目奖\",\"level\":\"校级\",\"year\":0}]','{\"innovation\":75,\"learning\":85,\"pressure\":70,\"communication\":75,\"teamwork\":80}','[]','[{\"name\":\"分布式博客系统\",\"role\":\"开发者\",\"description\":\"基于 Golang + Gin 框架开发后端服务，设计并实现用户认证、文章发布、评论管理等核心模块，结合 JWT 完成身份鉴权；使用 GORM 实现 MySQL 数据库交互，优化慢查询，提升接口响应效率；基于 Redis 实现缓存层，降低数据库访问压力，并利用 RabbitMQ 处理异步任务，提升系统吞吐能力。\",\"technologies\":[\"Golang\",\"Gin\",\"JWT\",\"GORM\",\"MySQL\",\"Redis\",\"RabbitMQ\"]},{\"name\":\"云原生微服务 Demo\",\"role\":\"开发者\",\"description\":\"基于 Go Kit 构建微服务架构，实现服务注册与发现（Consul）、负载均衡及熔断机制；使用 Docker 容器化部署服务，编写 docker-compose 编排多服务环境；引入 Prometheus + Grafana 进行服务监控，搭建基础可观测性体系。\",\"technologies\":[\"Go Kit\",\"Consul\",\"Docker\",\"docker-compose\",\"Prometheus\",\"Grafana\"]}]',70,75,NULL,'[\"内容方面：简历中缺少明确的实习经历。应将‘实习经历’标题下的‘分布式博客系统’和‘云原生微服务 Demo’归类为项目经历，并补充真实的公司实习信息，包括公司名称、职位、具体时长和职责描述，以增强简历的可信度和竞争力。\",\"格式方面：优化简历结构，将‘教育背景’、‘项目经历’、‘实习经历’（待补充）、‘个人技能’、‘荣誉证书’、‘个人评价’等模块清晰分隔。当前‘实习经历’部分内容实为项目描述，需修正标题以避免混淆。\",\"技能方面：建议在技能列表中量化掌握程度和年限，并考虑补充对Kubernetes等云原生核心技术的了解或学习计划，以更贴合Golang云原生开发岗位的要求。\",\"表达方面：优化项目描述，使用STAR法则（情境、任务、行动、结果）来结构化描述，例如明确项目背景、个人承担的具体任务、采取的技术行动以及达成的可量化成果（如性能提升百分比）。\",\"信息完整性：补充证书（如英语四六级）的具体获得年份，并考虑将‘个人评价’中的主观描述转化为‘技能’或‘项目经历’中更客观、具体的成就展示。\"]','简小历 简小历 出生年月：20 06 . 8 手机：180 0000 1108 工作年限：应届毕业生（0年） 邮箱： jianlixiazai.cn 求职意向： Golang 软件开发岗 地址：广东省珠海市区 教育背景 教育背景 20 24 .XX – 20 28 .XX 浙江师范 大学 软件工程 专业 / 本科 主修课程 Golang 程序设计，rust 程序设计, 现代web开发，云原生开发，操作系统 实习经历 实习经历 20 24 .XX – 20 25 .XX 分布式博客系统 工作描述 基于 Golang + Gin 框架开发后端服务，设计并实现用户认证、文章发布、评论管理等核心模块，结合 JWT 完成身份鉴权； 使用 GORM 实现 MySQL 数据库交互，优化慢查询，提升接口响应效率； 基于 Redis 实现缓存层，降低数据库访问压力，并利用 RabbitMQ 处理异步任务，提升系统吞吐能力。 20 25 .XX – 20 26 .XX 云原生微服务 Demo 工作描述 基于 Go Kit 构建微服务架构，实现服务注册与发现（Consul）、负载均衡及熔断机制； 使用 Docker 容器化部署服务，编写 docker-compose 编排多服务环境； 引入 Prometheus + Grafana 进行服务监控，搭建基础可观测性体系 个人技能 个人技能 语言能力：英语通过 4,6 级考试，口语流利、普通话：流利 计算机能力：熟悉 Golang 编程、Git 协作流程，熟练使用 Linux 常用命令及 Docker 容器化工具 荣誉证书：校奖学金、软件工程专业课程优秀项目奖 个人评价 个人评价 积极主动，热爱技术，对 Golang 及云原生生态有浓厚兴趣。在校期间系统学习 Golang 程序设计、云原生开发等课程，并独立完成多个 Go 项目，具备良好的编码习惯与问题排查能力。乐于钻研源码与新技术，适应团队协作，善于沟通，致力于在 Golang 后端开发方向持续深耕',1775810591,1775810591);
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
(1,'testuser','$2a$10$AIRAxdY/Y/4kDfN8BAV9wOZCHmm4aLpyTuDKzQ4q2vKb98NIS1CkG','test@example.com',NULL,'user',1775806023,1775806023),
(2,'114514','$2a$10$pmNAw/OwjSHmTWeMaRmRs.vT8hhiIob2TDneTO6atGtGFsNDPmI82','114514@114514.com',NULL,'user',1775810548,1775810548);
SET FOREIGN_KEY_CHECKS=1;
