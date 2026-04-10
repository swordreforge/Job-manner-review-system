/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19-12.2.2-MariaDB, for Linux (x86_64)
--
-- Host: localhost    Database: career_db
-- ------------------------------------------------------
-- Server version	12.2.2-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;

--
-- Table structure for table `career_reports`
--

DROP TABLE IF EXISTS `career_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `career_reports` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `student_id` bigint(20) NOT NULL,
  `target_job_id` bigint(20) DEFAULT NULL,
  `title` varchar(200) DEFAULT NULL,
  `content` text DEFAULT NULL,
  `overview` longtext DEFAULT NULL CHECK (json_valid(`overview`)),
  `match_analysis` longtext DEFAULT NULL CHECK (json_valid(`match_analysis`)),
  `career_path` longtext DEFAULT NULL CHECK (json_valid(`career_path`)),
  `action_plan` longtext DEFAULT NULL CHECK (json_valid(`action_plan`)),
  `status` varchar(20) DEFAULT 'draft',
  `created_at` bigint(20) NOT NULL,
  `updated_at` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_student` (`student_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `career_reports`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `career_reports` WRITE;
/*!40000 ALTER TABLE `career_reports` DISABLE KEYS */;
INSERT INTO `career_reports` VALUES
(1,1,NULL,'职业规划报告 - full','{\"skills\":[{\"name\":\"Golang后端开发\",\"level\":85,\"status\":\"已掌握\"},{\"name\":\"微服务架构设计\",\"level\":75,\"status\":\"已掌握\"},{\"name\":\"云原生技术栈\",\"level\":70,\"status\":\"学习中\"},{\"name\":\"分布式系统\",\"level\":65,\"status\":\"学习中\"},{\"name\":\"容器化与编排\",\"level\":75,\"status\":\"已掌握\"},{\"name\":\"系统监控与运维\",\"level\":65,\"status\":\"学习中\"},{\"name\":\"数据库优化\",\"level\":70,\"status\":\"已掌握\"},{\"name\":\"消息队列\",\"level\":70,\"status\":\"已掌握\"}],\"timeline\":[{\"date\":\"2024年9月-2025年6月\",\"title\":\"技术深化与项目实践\",\"desc\":\"深入学习云原生技术栈，完善微服务项目，参与开源项目贡献，准备暑期实习\"},{\"date\":\"2025年7月-2025年8月\",\"title\":\"暑期实习\",\"desc\":\"争取进入互联网大厂或知名科技公司实习，积累实际工程经验\"},{\"date\":\"2025年9月-2026年6月\",\"title\":\"专业能力提升\",\"desc\":\"系统学习分布式系统原理，掌握Kubernetes等编排工具，参与复杂项目开发\"},{\"date\":\"2026年7月-2027年6月\",\"title\":\"毕业设计与职业准备\",\"desc\":\"完成高质量毕业设计，准备秋招，完善简历和面试技巧\"},{\"date\":\"2027年7月-2028年6月\",\"title\":\"正式工作适应期\",\"desc\":\"入职目标企业，快速适应工作环境，建立专业网络\"},{\"date\":\"2028年7月-2029年6月\",\"title\":\"职业发展初期\",\"desc\":\"在岗位上承担更多责任，开始技术专精或管理方向探索\"}],\"completeness\":65,\"competitiveness\":75}',NULL,NULL,NULL,NULL,'completed',1775802662,1775802662);
/*!40000 ALTER TABLE `career_reports` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `holland_test_results`
--

DROP TABLE IF EXISTS `holland_test_results`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `holland_test_results` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `student_id` bigint(20) NOT NULL,
  `career_code` varchar(10) NOT NULL COMMENT '职业代码，如RIA、SEC',
  `scores` longtext NOT NULL COMMENT '各类型得分，如{"R":4,"I":3,"A":2,"S":1,"E":1,"C":0}' CHECK (json_valid(`scores`)),
  `suitable_jobs` longtext NOT NULL COMMENT '推荐职业列表' CHECK (json_valid(`suitable_jobs`)),
  `description` text DEFAULT NULL COMMENT '测试结果描述',
  `created_at` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_career_code` (`career_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `holland_test_results`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `holland_test_results` WRITE;
/*!40000 ALTER TABLE `holland_test_results` DISABLE KEYS */;
/*!40000 ALTER TABLE `holland_test_results` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `interview_messages`
--

DROP TABLE IF EXISTS `interview_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='面试对话记录表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `interview_messages`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `interview_messages` WRITE;
/*!40000 ALTER TABLE `interview_messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `interview_messages` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `interview_reports`
--

DROP TABLE IF EXISTS `interview_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `interview_reports` (
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
  PRIMARY KEY (`id`),
  KEY `idx_session_id` (`session_id`),
  KEY `idx_student_id` (`student_id`),
  CONSTRAINT `fk_interview_report_session` FOREIGN KEY (`session_id`) REFERENCES `interview_sessions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `interview_reports`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `interview_reports` WRITE;
/*!40000 ALTER TABLE `interview_reports` DISABLE KEYS */;
/*!40000 ALTER TABLE `interview_reports` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `interview_sessions`
--

DROP TABLE IF EXISTS `interview_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
  KEY `idx_created` (`created_at`),
  KEY `idx_user_status` (`user_id`,`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `interview_sessions`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `interview_sessions` WRITE;
/*!40000 ALTER TABLE `interview_sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `interview_sessions` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `job_promotion_paths`
--

DROP TABLE IF EXISTS `job_promotion_paths`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_promotion_paths` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `from_job_id` bigint(20) NOT NULL,
  `to_job_id` bigint(20) NOT NULL,
  `path_description` text DEFAULT NULL,
  `required_skills` text DEFAULT NULL,
  `estimated_years` int(11) DEFAULT NULL,
  `created_at` bigint(20) NOT NULL,
  `updated_at` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_from_job` (`from_job_id`),
  KEY `idx_to_job` (`to_job_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_promotion_paths`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `job_promotion_paths` WRITE;
/*!40000 ALTER TABLE `job_promotion_paths` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_promotion_paths` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `jobs`
--

DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `jobs` (
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
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category`),
  KEY `idx_holland_code` (`holland_code`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jobs`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `jobs` WRITE;
/*!40000 ALTER TABLE `jobs` DISABLE KEYS */;
INSERT INTO `jobs` VALUES
(1,'Golang后端开发工程师','技术','负责公司后端服务开发，参与微服务架构设计与实现','熟练掌握Golang编程语言，熟悉MySQL/Redis，了解微服务架构','15000-30000','字节跳动','北京','本科','1-3年','IRC',1775802566,1775802566),
(2,'Java开发工程师','技术','负责企业级应用后端开发，参与系统架构设计','熟练掌握Java，熟悉Spring框架，了解分布式系统','12000-25000','阿里巴巴','杭州','本科','1-3年','IRC',1775802566,1775802566),
(3,'前端开发工程师','技术','负责Web前端开发，与后端工程师协作完成产品功能','熟练掌握Vue/React，熟悉HTML/CSS/JavaScript','12000-22000','腾讯','深圳','本科','1-3年','AIR',1775802566,1775802566),
(4,'Python数据分析师','数据','负责数据分析和可视化，为业务决策提供支持','熟练掌握Python，熟悉Pandas/NumPy，了解数据可视化','15000-28000','美团','北京','本科','1-3年','IEC',1775802566,1775802566),
(5,'产品经理','产品','负责产品规划与设计，协调研发团队推动产品迭代','良好的沟通能力，了解互联网产品，有项目管理经验','18000-35000','字节跳动','北京','本科','1-3年','ESA',1775802566,1775802566),
(6,'UI设计师','设计','负责产品界面设计，提升用户体验','熟练掌握Figma/Sketch，了解用户体验设计原则','15000-28000','网易','杭州','本科','1-3年','AIR',1775802566,1775802566),
(7,'测试工程师','技术','负责产品测试工作，保障软件质量','熟悉测试流程，了解自动化测试框架','10000-20000','华为','深圳','本科','1-3年','RIC',1775802566,1775802566),
(8,'运维工程师','技术','负责服务器运维，保障系统稳定运行','熟悉Linux，了解Docker/K8s，有运维经验','15000-25000','阿里巴巴','杭州','本科','1-3年','RIC',1775802566,1775802566),
(9,'新媒体运营','运营','负责新媒体平台运营，策划优质内容','熟悉各平台运营规则，有内容策划能力','8000-15000','小红书','上海','本科','1-3年','SEA',1775802566,1775802566),
(10,'内容编辑','内容','负责内容策划与编辑，产出优质文章','良好的文字功底，了解内容运营','7000-14000','今日头条','北京','本科','1-3年','AES',1775802566,1775802566);
/*!40000 ALTER TABLE `jobs` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `match_records`
--

DROP TABLE IF EXISTS `match_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `match_records` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `student_id` bigint(20) NOT NULL,
  `job_id` bigint(20) NOT NULL,
  `match_score` decimal(5,2) NOT NULL,
  `match_details` longtext DEFAULT NULL CHECK (json_valid(`match_details`)),
  `created_at` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_job_id` (`job_id`),
  KEY `idx_match_score` (`match_score`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `match_records`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `match_records` WRITE;
/*!40000 ALTER TABLE `match_records` DISABLE KEYS */;
/*!40000 ALTER TABLE `match_records` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `resume_parse_history`
--

DROP TABLE IF EXISTS `resume_parse_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `resume_parse_history` (
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
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `resume_parse_history`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `resume_parse_history` WRITE;
/*!40000 ALTER TABLE `resume_parse_history` DISABLE KEYS */;
INSERT INTO `resume_parse_history` VALUES
(1,1,NULL,'黑白设计通用国际贸易财务会计专业简历.docx','简小历 简小历 出生年月：20 06 . 8 手机：180 0000 1108 工作年限：应届毕业生（0年） 邮箱： jianlixiazai.cn 求职意向： Golang 软件开发岗 地址：广东省珠海市区 教育背景 教育背景 20 24 .XX – 20 28 .XX 浙江师范 大学 软件工程 专业 / 本科 主修课程 Golang 程序设计，rust 程序设计 , 现代web开发，云原生开发，操作系统 实习经历 实习经历 20 24 .XX – 20 25 .XX 分布式博客系统 工作描述 基于 Golang + Gin 框架开发后端服务，设计并实现用户认证、文章发布、评论管理等核心模块，结合 JWT 完成身份鉴权； 使用 GORM 实现 MySQL 数据库交互，优化慢查询，提升接口响应效率； 基于 Redis 实现缓存层，降低数据库访问压力，并利用 RabbitMQ 处理异步任务，提升系统吞吐能力。 20 25 .XX – 20 26 .XX 云原生微服务 Demo 工作描述 基于 Go Kit 构建微服务架构，实现服务注册与发现（Consul）、负载均衡及熔断机制； 使用 Docker 容器化部署服务，编写 docker-compose 编排多服务环境； 引入 Prometheus + Grafana 进行服务监控，搭建基础可观测性体系 个人技能 个人技能 语言能力：英语通过 4 ,6 级考试，口语流利、普通话：流利 计算机能力：熟悉 Golang 编程、Git 协作流程，熟练使用 Linux 常用命令及 Docker 容器化工具 荣誉证书：校奖学金、软件工程专业课程优秀项目奖 个人评价 个人评价 积极主动，热爱技术，对 Golang 及云原生生态有浓厚兴趣。在校期间系统学习 Golang 程序设计、云原生开发等课程，并独立完成多个 Go 项目，具备良好的编码习惯与问题排查能力。乐于钻研源码与新技术，适应团队协作，善于沟通，致力于在 Golang 后端开发方向持续深耕','{\"id\":1775802603490580983,\"userId\":1,\"name\":\"简小历\",\"education\":\"bachelor\",\"major\":\"软件工程\",\"graduationYear\":2028,\"skills\":[{\"name\":\"Golang\",\"level\":85,\"years\":2},{\"name\":\"Gin\",\"level\":80,\"years\":2},{\"name\":\"MySQL\",\"level\":75,\"years\":2},{\"name\":\"GORM\",\"level\":75,\"years\":2},{\"name\":\"Redis\",\"level\":70,\"years\":1},{\"name\":\"RabbitMQ\",\"level\":70,\"years\":1},{\"name\":\"Docker\",\"level\":75,\"years\":1},{\"name\":\"Linux\",\"level\":70,\"years\":2},{\"name\":\"Git\",\"level\":80,\"years\":2},{\"name\":\"Go Kit\",\"level\":70,\"years\":1},{\"name\":\"Consul\",\"level\":65,\"years\":1},{\"name\":\"Prometheus\",\"level\":65,\"years\":1},{\"name\":\"Grafana\",\"level\":65,\"years\":1},{\"name\":\"Rust\",\"level\":60,\"years\":1},{\"name\":\"Web开发\",\"level\":70,\"years\":1}],\"certificates\":[{\"name\":\"大学英语四级\",\"level\":\"CET-4\",\"year\":0},{\"name\":\"大学英语六级\",\"level\":\"CET-6\",\"year\":0},{\"name\":\"校奖学金\",\"level\":\"校级\",\"year\":0},{\"name\":\"软件工程专业课程优秀项目奖\",\"level\":\"校级\",\"year\":0}],\"softSkills\":{\"innovation\":75,\"learning\":85,\"pressure\":80,\"communication\":80,\"teamwork\":85},\"internship\":[],\"projects\":[{\"name\":\"分布式博客系统\",\"role\":\"开发者\",\"description\":\"基于Golang + Gin框架开发后端服务，设计并实现用户认证、文章发布、评论管理等核心模块，结合JWT完成身份鉴权；使用GORM实现MySQL数据库交互，优化慢查询；基于Redis实现缓存层，并利用RabbitMQ处理异步任务。\",\"technologies\":[\"Golang\",\"Gin\",\"JWT\",\"GORM\",\"MySQL\",\"Redis\",\"RabbitMQ\"]},{\"name\":\"云原生微服务Demo\",\"role\":\"开发者\",\"description\":\"基于Go Kit构建微服务架构，实现服务注册与发现（Consul）、负载均衡及熔断机制；使用Docker容器化部署服务，编写docker-compose编排；引入Prometheus + Grafana进行服务监控。\",\"technologies\":[\"Golang\",\"Go Kit\",\"Consul\",\"Docker\",\"Prometheus\",\"Grafana\"]}],\"completeness\":70,\"competitiveness\":75,\"suggestions\":[\"内容方面：简历中提及的‘实习经历’部分实际为项目经历，建议明确区分。应补充真实的公司实习经历，包括公司名称、职位、具体工作内容和成果，以增强简历的说服力。\",\"格式方面：优化简历结构，将‘教育背景’、‘项目经历’、‘技能’、‘证书’等模块清晰分隔。‘个人评价’部分可精简，将关键软技能融入具体经历描述中，使内容更客观。\",\"技能方面：建议在技能列表中量化掌握程度和年限，并补充对云原生相关技术（如Kubernetes）的学习或实践经验，以更贴合求职意向（Golang及云原生生态）。\",\"表达方面：项目描述应使用更专业的动词和量化结果，例如将‘优化慢查询’具体化为‘将关键API响应时间从Xms降低至Yms’，以突出技术能力和项目 impact。\",\"信息完整性：补充证书（如CET-4/6）的具体获得年份，并确保联系方式（如邮箱地址 jianlixiazai.cn）格式正确无误。\"],\"createdAt\":1775802603,\"updatedAt\":1775802603}','[\"内容方面：简历中提及的‘实习经历’部分实际为项目经历，建议明确区分。应补充真实的公司实习经历，包括公司名称、职位、具体工作内容和成果，以增强简历的说服力。\",\"格式方面：优化简历结构，将‘教育背景’、‘项目经历’、‘技能’、‘证书’等模块清晰分隔。‘个人评价’部分可精简，将关键软技能融入具体经历描述中，使内容更客观。\",\"技能方面：建议在技能列表中量化掌握程度和年限，并补充对云原生相关技术（如Kubernetes）的学习或实践经验，以更贴合求职意向（Golang及云原生生态）。\",\"表达方面：项目描述应使用更专业的动词和量化结果，例如将‘优化慢查询’具体化为‘将关键API响应时间从Xms降低至Yms’，以突出技术能力和项目 impact。\",\"信息完整性：补充证书（如CET-4/6）的具体获得年份，并确保联系方式（如邮箱地址 jianlixiazai.cn）格式正确无误。\"]',70,75,1775802603);
/*!40000 ALTER TABLE `resume_parse_history` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `students`
--

DROP TABLE IF EXISTS `students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `students` (
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
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `students`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `students` WRITE;
/*!40000 ALTER TABLE `students` DISABLE KEYS */;
INSERT INTO `students` VALUES
(1,1,'简小历','bachelor','软件工程',2028,'[{\"name\":\"Golang\",\"level\":85,\"years\":2},{\"name\":\"Gin\",\"level\":80,\"years\":2},{\"name\":\"MySQL\",\"level\":75,\"years\":2},{\"name\":\"GORM\",\"level\":75,\"years\":2},{\"name\":\"Redis\",\"level\":70,\"years\":1},{\"name\":\"RabbitMQ\",\"level\":70,\"years\":1},{\"name\":\"Docker\",\"level\":75,\"years\":1},{\"name\":\"Linux\",\"level\":70,\"years\":2},{\"name\":\"Git\",\"level\":80,\"years\":2},{\"name\":\"Go Kit\",\"level\":70,\"years\":1},{\"name\":\"Consul\",\"level\":65,\"years\":1},{\"name\":\"Prometheus\",\"level\":65,\"years\":1},{\"name\":\"Grafana\",\"level\":65,\"years\":1},{\"name\":\"Rust\",\"level\":60,\"years\":1},{\"name\":\"Web开发\",\"level\":70,\"years\":1}]','[{\"name\":\"大学英语四级\",\"level\":\"CET-4\",\"year\":0},{\"name\":\"大学英语六级\",\"level\":\"CET-6\",\"year\":0},{\"name\":\"校奖学金\",\"level\":\"校级\",\"year\":0},{\"name\":\"软件工程专业课程优秀项目奖\",\"level\":\"校级\",\"year\":0}]','{\"innovation\":75,\"learning\":85,\"pressure\":80,\"communication\":80,\"teamwork\":85}','[]','[{\"name\":\"分布式博客系统\",\"role\":\"开发者\",\"description\":\"基于Golang + Gin框架开发后端服务，设计并实现用户认证、文章发布、评论管理等核心模块，结合JWT完成身份鉴权；使用GORM实现MySQL数据库交互，优化慢查询；基于Redis实现缓存层，并利用RabbitMQ处理异步任务。\",\"technologies\":[\"Golang\",\"Gin\",\"JWT\",\"GORM\",\"MySQL\",\"Redis\",\"RabbitMQ\"]},{\"name\":\"云原生微服务Demo\",\"role\":\"开发者\",\"description\":\"基于Go Kit构建微服务架构，实现服务注册与发现（Consul）、负载均衡及熔断机制；使用Docker容器化部署服务，编写docker-compose编排；引入Prometheus + Grafana进行服务监控。\",\"technologies\":[\"Golang\",\"Go Kit\",\"Consul\",\"Docker\",\"Prometheus\",\"Grafana\"]}]',70,75,NULL,'[\"内容方面：简历中提及的‘实习经历’部分实际为项目经历，建议明确区分。应补充真实的公司实习经历，包括公司名称、职位、具体工作内容和成果，以增强简历的说服力。\",\"格式方面：优化简历结构，将‘教育背景’、‘项目经历’、‘技能’、‘证书’等模块清晰分隔。‘个人评价’部分可精简，将关键软技能融入具体经历描述中，使内容更客观。\",\"技能方面：建议在技能列表中量化掌握程度和年限，并补充对云原生相关技术（如Kubernetes）的学习或实践经验，以更贴合求职意向（Golang及云原生生态）。\",\"表达方面：项目描述应使用更专业的动词和量化结果，例如将‘优化慢查询’具体化为‘将关键API响应时间从Xms降低至Yms’，以突出技术能力和项目 impact。\",\"信息完整性：补充证书（如CET-4/6）的具体获得年份，并确保联系方式（如邮箱地址 jianlixiazai.cn）格式正确无误。\"]','简小历 简小历 出生年月：20 06 . 8 手机：180 0000 1108 工作年限：应届毕业生（0年） 邮箱： jianlixiazai.cn 求职意向： Golang 软件开发岗 地址：广东省珠海市区 教育背景 教育背景 20 24 .XX – 20 28 .XX 浙江师范 大学 软件工程 专业 / 本科 主修课程 Golang 程序设计，rust 程序设计 , 现代web开发，云原生开发，操作系统 实习经历 实习经历 20 24 .XX – 20 25 .XX 分布式博客系统 工作描述 基于 Golang + Gin 框架开发后端服务，设计并实现用户认证、文章发布、评论管理等核心模块，结合 JWT 完成身份鉴权； 使用 GORM 实现 MySQL 数据库交互，优化慢查询，提升接口响应效率； 基于 Redis 实现缓存层，降低数据库访问压力，并利用 RabbitMQ 处理异步任务，提升系统吞吐能力。 20 25 .XX – 20 26 .XX 云原生微服务 Demo 工作描述 基于 Go Kit 构建微服务架构，实现服务注册与发现（Consul）、负载均衡及熔断机制； 使用 Docker 容器化部署服务，编写 docker-compose 编排多服务环境； 引入 Prometheus + Grafana 进行服务监控，搭建基础可观测性体系 个人技能 个人技能 语言能力：英语通过 4 ,6 级考试，口语流利、普通话：流利 计算机能力：熟悉 Golang 编程、Git 协作流程，熟练使用 Linux 常用命令及 Docker 容器化工具 荣誉证书：校奖学金、软件工程专业课程优秀项目奖 个人评价 个人评价 积极主动，热爱技术，对 Golang 及云原生生态有浓厚兴趣。在校期间系统学习 Golang 程序设计、云原生开发等课程，并独立完成多个 Go 项目，具备良好的编码习惯与问题排查能力。乐于钻研源码与新技术，适应团队协作，善于沟通，致力于在 Golang 后端开发方向持续深耕',1775802603,1775802603);
/*!40000 ALTER TABLE `students` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `role` varchar(20) NOT NULL DEFAULT 'student',
  `created_at` bigint(20) NOT NULL,
  `updated_at` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  KEY `idx_username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES
(1,'testuser','$2a$10$Dnz/.trbawlCaFpORYvDWOV6qbA/1mmDLH0OJbGK82k5jrO4tjw8a','test@example.com',NULL,'user',1775802566,1775802566);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2026-04-10 14:36:41
