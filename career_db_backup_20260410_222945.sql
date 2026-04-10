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
(1,2,NULL,'职业规划报告 - gap','{\"skills\":[{\"name\":\"Golang\",\"level\":80,\"status\":\"已掌握\"},{\"name\":\"云原生架构\",\"level\":65,\"status\":\"学习中\"},{\"name\":\"分布式系统设计\",\"level\":70,\"status\":\"已掌握\"},{\"name\":\"容器化与编排\",\"level\":70,\"status\":\"已掌握\"},{\"name\":\"数据库优化\",\"level\":70,\"status\":\"已掌握\"},{\"name\":\"消息队列\",\"level\":60,\"status\":\"学习中\"},{\"name\":\"系统监控\",\"level\":60,\"status\":\"学习中\"},{\"name\":\"Rust\",\"level\":50,\"status\":\"学习中\"}],\"timeline\":[{\"date\":\"2024-2025学年\",\"title\":\"技术深度拓展\",\"desc\":\"深入学习云原生技术栈，完成Kubernetes认证；参与开源项目贡献；完善分布式系统项目经验\"},{\"date\":\"2025年暑期\",\"title\":\"第一份实习\",\"desc\":\"争取进入互联网大厂或知名科技公司实习，担任后端开发或云原生相关岗位\"},{\"date\":\"2025-2026学年\",\"title\":\"项目实战提升\",\"desc\":\"主导或参与大型分布式系统项目；学习系统架构设计；准备研究生考试或就业\"},{\"date\":\"2026年暑期\",\"title\":\"第二份实习\",\"desc\":\"争取更高级别的技术实习，如架构师助理或SRE岗位；积累生产环境经验\"},{\"date\":\"2026-2027学年\",\"title\":\"就业准备与冲刺\",\"desc\":\"完善技术博客和GitHub项目；参加技术竞赛；准备校招面试\"},{\"date\":\"2027年\",\"title\":\"毕业设计\",\"desc\":\"完成高质量的毕业设计项目，展示完整的云原生或分布式系统解决方案\"},{\"date\":\"2028年毕业季\",\"title\":\"职业起点\",\"desc\":\"目标进入一线互联网公司，担任后端开发工程师、云原生工程师或SRE工程师\"}],\"completeness\":65,\"competitiveness\":75}',NULL,NULL,NULL,NULL,'completed',1775828811,1775828811);
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
INSERT INTO `interview_sessions` VALUES
(1,1,NULL,'practice','cancelled',0,0,0.00,0.00,0.00,4,1775823927,1775823931,1775823931);
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
(2,1,11,NULL,NULL,'在当前岗位基础上深化技术深度，承担更复杂的系统设计与核心模块开发，为团队提供技术指导，是技术路径上的自然晋升。',NULL,NULL,NULL,1775825549,1775825549),
(3,1,12,NULL,NULL,'基于现有微服务架构设计与实现经验，可进一步负责整体系统架构规划、技术选型与团队技术方向把控，提升技术决策与跨团队协调能力。',NULL,NULL,NULL,1775825549,1775825549),
(4,1,13,NULL,NULL,'在字节跳动这类技术驱动型公司，具备扎实后端开发与架构经验后，可转向技术管理岗位，负责团队建设、项目交付与人才培养，实现从技术到管理的转型。',NULL,NULL,NULL,1775825549,1775825549),
(5,11,23,75.00,'[\"大规模系统架构设计\",\"技术战略规划\",\"跨团队协作与沟通\",\"多技术栈整合能力\",\"业务建模与架构映射\"]','1. 深入学习系统架构设计（如DDD、事件驱动架构、云原生架构）；2. 拓展技术广度，了解前端框架、大数据平台、DevOps工具链；3. 参与或主导跨团队技术项目，积累架构决策经验；4. 学习技术领导力课程，提升团队技术指导与规划能力；5. 研究行业技术趋势（如AI工程化、边缘计算）。',NULL,NULL,NULL,1775825888,1775825888),
(6,11,24,75.00,'[\"团队管理与领导力\",\"系统架构规划与决策能力\",\"业务分析与产品思维\",\"项目全生命周期管理\"]','1. 短期（1-3个月）：参与团队内部分享或技术评审，提升技术影响力；学习项目管理基础（如敏捷开发、Scrum）。2. 中期（3-6个月）：主动承担小型项目主导角色，练习任务分解与进度跟踪；补充业务知识，深入理解产品逻辑。3. 长期（6-12个月）：争取带团队机会（如实习生或初级工程师指导）；系统学习领导力课程（如沟通、决策、冲突解决）；参与跨部门协作项目，积累协调经验。',NULL,NULL,NULL,1775825888,1775825888),
(7,11,25,85.00,'[\"跨业务线协作经验\",\"多语言后端开发能力（如Java/Python）\",\"业务领域知识\",\"系统集成与架构设计\"]','1. 学习其他后端技术栈（如Java或Python），通过在线课程或项目实践掌握基础；2. 参与跨业务线项目，主动承担集成或协作任务，积累经验；3. 加强业务知识学习，了解公司不同业务线的核心逻辑；4. 提升系统设计能力，关注高并发、分布式系统最佳实践。',NULL,NULL,NULL,1775825888,1775825888),
(8,11,26,65.00,'[\"Kubernetes集群管理与运维\",\"云平台服务（如AWS EKS/ECS）\",\"基础设施即代码（Terraform/Ansible）\",\"可观测性工具链（Prometheus, Jaeger, Loki）\"]','1. 基础阶段（1-3个月）：系统学习Docker容器化、Kubernetes编排原理，通过官方文档和实验项目（如部署微服务到Minikube）巩固；2. 进阶阶段（3-6个月）：深入云原生生态工具，包括Service Mesh（如Istio）、CI/CD工具（如ArgoCD）、监控栈（Prometheus+Alertmanager），参与公司内部基础设施项目或开源贡献；3. 实践阶段（6-12个月）：主导或参与云原生迁移、自动化运维项目，积累跨团队协作和故障排查经验。',NULL,NULL,NULL,1775825888,1775825888),
(9,13,18,NULL,NULL,'基于当前负责项目规划、资源分配和人才培养的经验，可进一步扩大管理范围，领导多个技术团队或产品线，提升战略决策能力，为公司技术方向提供更深入的贡献。',NULL,NULL,NULL,1775826633,1775826633),
(10,13,27,NULL,NULL,'结合技术管理技能与业务理解，可向产品与技术融合的角色发展，负责产品从规划到落地的全流程，增强产品驱动和技术落地的协同价值。',NULL,NULL,NULL,1775826633,1775826633),
(11,13,28,NULL,NULL,'在字节跳动快速发展的环境中，可晋升至部门级管理岗位，统筹更大规模的研发资源，优化组织效率，推动技术创新和人才培养体系化。',NULL,NULL,NULL,1775826633,1775826633),
(12,12,13,NULL,NULL,'作为后端技术负责人，已具备技术方案设计和团队指导经验，晋升后可扩大管理范围，负责跨团队技术战略制定和资源协调，提升业务影响力和组织决策能力。',NULL,NULL,NULL,1775826857,1775826857),
(13,12,29,NULL,NULL,'基于现有技术选型和方案设计专长，可进一步专注于系统架构优化、技术标准化和创新，推动公司级技术演进，提升技术深度和行业影响力。',NULL,NULL,NULL,1775826857,1775826857),
(14,12,27,NULL,NULL,'在字节跳动等高速发展环境中，结合技术管理与业务理解，可向产品技术融合方向晋升，主导产品技术路线规划，实现技术驱动业务增长，提升综合领导力。',NULL,NULL,NULL,1775826857,1775826857),
(15,4,30,NULL,NULL,'基于当前数据分析经验，深化业务理解和数据建模能力，可独立负责复杂分析项目，为战略决策提供更深入的洞察，提升在团队中的技术领导力。',NULL,NULL,NULL,1775828244,1775828244),
(16,4,21,NULL,NULL,'在Python和数据分析基础上，增强机器学习、统计建模等技能，处理更复杂的预测性和规范性分析问题，直接驱动业务增长和创新，提升技术价值和职业竞争力。',NULL,NULL,NULL,1775828244,1775828244),
(17,4,31,NULL,NULL,'积累业务经验和项目管理能力后，可转向管理岗位，负责团队建设、项目规划和跨部门协作，从执行者转变为领导者，实现职业路径的横向拓展。',NULL,NULL,NULL,1775828244,1775828244),
(18,4,32,NULL,NULL,'利用数据分析技能深入特定业务领域（如美团的外卖、到店等），专注于业务策略优化和绩效评估，成为业务与数据之间的桥梁，增强对业务决策的直接影响力。',NULL,NULL,NULL,1775828244,1775828244),
(19,4,5,NULL,NULL,'结合数据分析经验和业务理解，参与或主导数据产品的设计和迭代，推动数据工具和平台的发展，实现从分析支持到产品驱动的角色转变，创造更大业务价值。',NULL,NULL,NULL,1775828244,1775828244),
(20,31,33,85.00,'[\"团队管理\",\"数据分析方法论\",\"业务需求沟通\",\"项目管理\",\"数据可视化\"]','1. 学习高级数据科学算法和机器学习模型 2. 参与公司战略规划相关培训 3. 提升跨部门协作和资源调配能力 4. 学习数据治理和合规知识',NULL,NULL,NULL,1775828589,1775828589),
(21,31,34,80.00,'[\"数据分析\",\"业务理解\",\"团队领导\",\"数据报告\",\"需求分析\"]','1. 学习商业智能工具和平台（如Tableau、Power BI高级功能）2. 掌握数据仓库和ETL流程 3. 了解行业最佳实践和案例 4. 提升商业敏感度和财务知识',NULL,NULL,NULL,1775828589,1775828589),
(22,31,35,75.00,'[\"用户需求分析\",\"数据驱动决策\",\"团队协作\",\"项目管理\",\"结果评估\"]','1. 学习产品管理方法论 2. 了解数据产品设计和开发流程 3. 学习用户体验设计基础 4. 掌握产品市场分析和竞品研究',NULL,NULL,NULL,1775828589,1775828589),
(23,31,36,70.00,'[\"数据战略规划\",\"团队管理\",\"业务沟通\",\"项目管理\",\"数据分析思维\"]','1. 学习数据治理和数据安全法规 2. 提升企业级数据架构设计能力 3. 加强高管层沟通和影响力 4. 学习数字化转型战略',NULL,NULL,NULL,1775828589,1775828589),
(24,31,37,65.00,'[\"数据驱动决策\",\"流程优化\",\"团队管理\",\"绩效评估\",\"问题解决\"]','1. 学习运营管理全流程 2. 掌握供应链和物流基础知识 3. 提升财务和预算管理能力 4. 学习客户体验管理和服务设计',NULL,NULL,NULL,1775828589,1775828589);
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
(1,'Golang后端开发工程师','负责公司后端服务开发，参与微服务架构设计与实现','字节跳动','技术','北京','15000-30000',NULL,NULL,NULL,'熟练掌握Golang编程语言，熟悉MySQL/Redis，了解微服务架构',NULL,1775811809,1775811809),
(2,'Java开发工程师','负责企业级应用后端开发，参与系统架构设计','阿里巴巴','技术','杭州','12000-25000',NULL,NULL,NULL,'熟练掌握Java，熟悉Spring框架，了解分布式系统',NULL,1775811809,1775811809),
(3,'前端开发工程师','负责Web前端开发，与后端工程师协作完成产品功能','腾讯','技术','深圳','12000-22000',NULL,NULL,NULL,'熟练掌握Vue/React，熟悉HTML/CSS/JavaScript',NULL,1775811809,1775811809),
(4,'Python数据分析师','负责数据分析和可视化，为业务决策提供支持','美团','数据','北京','15000-28000',NULL,NULL,NULL,'熟练掌握Python，熟悉Pandas/NumPy，了解数据可视化',NULL,1775811809,1775811809),
(5,'产品经理','负责产品规划与设计，协调研发团队推动产品迭代','字节跳动','产品','北京','18000-35000',NULL,NULL,NULL,'良好的沟通能力，了解互联网产品，有项目管理经验',NULL,1775811809,1775811809),
(6,'UI设计师','负责产品界面设计，提升用户体验','网易','设计','杭州','15000-28000',NULL,NULL,NULL,'熟练掌握Figma/Sketch，了解用户体验设计原则',NULL,1775811809,1775811809),
(7,'测试工程师','负责产品测试工作，保障软件质量','华为','技术','深圳','10000-20000',NULL,NULL,NULL,'熟悉测试流程，了解自动化测试框架',NULL,1775811809,1775811809),
(8,'运维工程师','负责服务器运维，保障系统稳定运行','阿里巴巴','技术','杭州','15000-25000',NULL,NULL,NULL,'熟悉Linux，了解Docker/K8s，有运维经验',NULL,1775811809,1775811809),
(9,'新媒体运营','负责新媒体平台运营，策划优质内容','小红书','运营','上海','8000-15000',NULL,NULL,NULL,'熟悉各平台运营规则，有内容策划能力',NULL,1775811809,1775811809),
(10,'内容编辑','负责内容策划与编辑，产出优质文章','今日头条','内容','北京','7000-14000',NULL,NULL,NULL,'良好的文字功底，了解内容运营',NULL,1775811809,1775811809),
(11,'高级Golang后端开发工程师','负责复杂微服务架构设计与核心模块开发','字节跳动','互联网',NULL,NULL,'[\"Go\", \"微服务\", \"分布式系统\", \"Kubernetes\"]',NULL,NULL,NULL,NULL,1775825484,1775825484),
(12,'后端技术负责人','负责技术方案设计、技术选型和团队技术指导','字节跳动','互联网',NULL,NULL,'[\"Go\", \"微服务\", \"架构设计\", \"团队管理\"]',NULL,NULL,NULL,NULL,1775825484,1775825484),
(13,'技术经理','负责项目规划、资源分配和人才培养','字节跳动','互联网',NULL,NULL,'[\"Go\", \"项目管理\", \"团队管理\", \"业务分析\"]',NULL,NULL,NULL,NULL,1775825484,1775825484),
(14,'全栈开发工程师','负责端到端产品开发和完整业务链路','字节跳动','互联网',NULL,NULL,'[\"Go\", \"React\", \"数据库\", \"微服务\"]',NULL,NULL,NULL,NULL,1775825484,1775825484),
(15,'云原生工程师','负责容器化、服务网格和CI/CD基础设施建设','字节跳动','互联网',NULL,NULL,'[\"Kubernetes\", \"Docker\", \"Service Mesh\", \"CI/CD\"]',NULL,NULL,NULL,NULL,1775825484,1775825484),
(16,'高级Java开发工程师','负责复杂系统架构设计与核心模块开发','阿里巴巴','互联网',NULL,NULL,'[\"Java\", \"Spring Boot\", \"微服务\", \"分布式系统\"]',NULL,NULL,NULL,NULL,1775825484,1775825484),
(17,'技术架构师','负责整体系统架构设计和技术规划','阿里巴巴','互联网',NULL,NULL,'[\"架构设计\", \"微服务\", \"分布式系统\", \"云原生\"]',NULL,NULL,NULL,NULL,1775825484,1775825484),
(18,'技术总监','负责技术团队管理和技术战略规划','腾讯','互联网',NULL,NULL,'[\"技术管理\", \"架构设计\", \"团队建设\", \"战略规划\"]',NULL,NULL,NULL,NULL,1775825484,1775825484),
(19,'高级前端开发工程师','负责前端架构设计和复杂交互实现','腾讯','互联网',NULL,NULL,'[\"React\", \"TypeScript\", \"前端架构\", \"性能优化\"]',NULL,NULL,NULL,NULL,1775825484,1775825484),
(20,'高级Python数据分析师','负责高级统计建模和机器学习项目','美团','互联网',NULL,NULL,'[\"Python\", \"机器学习\", \"数据分析\", \"大数据\"]',NULL,NULL,NULL,NULL,1775825484,1775825484),
(21,'数据科学家','负责机器学习建模和数据驱动决策','美团','互联网',NULL,NULL,'[\"Python\", \"机器学习\", \"深度学习\", \"数据挖掘\"]',NULL,NULL,NULL,NULL,1775825484,1775825484),
(22,'高级产品经理','负责产品战略规划和跨部门协调','字节跳动','互联网',NULL,NULL,'[\"产品规划\", \"数据分析\", \"用户研究\", \"项目管理\"]',NULL,NULL,NULL,NULL,1775825484,1775825484),
(23,'技术专家/架构师',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1775825888,1775825888),
(24,'后端开发负责人/技术主管',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1775825888,1775825888),
(25,'高级/资深后端开发工程师（跨业务线）',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1775825888,1775825888),
(26,'云原生/基础设施工程师',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1775825888,1775825888),
(27,'产品技术负责人',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1775826633,1775826633),
(28,'研发部门负责人',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1775826633,1775826633),
(29,'架构师/首席架构师',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1775826857,1775826857),
(30,'高级数据分析师',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1775828244,1775828244),
(31,'数据分析团队负责人',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1775828244,1775828244),
(32,'商业分析师（业务方向）',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1775828244,1775828244),
(33,'数据科学部门总监',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1775828589,1775828589),
(34,'商业智能总监',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1775828589,1775828589),
(35,'数据产品总监',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1775828589,1775828589),
(36,'首席数据官（CDO）',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1775828589,1775828589),
(37,'运营副总裁',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1775828589,1775828589);
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
(1,1,NULL,'黑白设计通用国际贸易财务会计专业简历.docx','简小历 简小历 出生年月：20 06 . 8 手机：180 0000 1108 工作年限：应届毕业生（0年） 邮箱： jianlixiazai.cn 求职意向： Golang 软件开发岗 地址：广东省珠海市区 教育背景 教育背景 20 24 .XX – 20 28 .XX 浙江师范 大学 软件工程 专业 / 本科 主修课程 Golang 程序设计，rust 程序设计, 现代web开发，云原生开发，操作系统 实习经历 实习经历 20 24 .XX – 20 25 .XX 分布式博客系统 工作描述 基于 Golang + Gin 框架开发后端服务，设计并实现用户认证、文章发布、评论管理等核心模块，结合 JWT 完成身份鉴权； 使用 GORM 实现 MySQL 数据库交互，优化慢查询，提升接口响应效率； 基于 Redis 实现缓存层，降低数据库访问压力，并利用 RabbitMQ 处理异步任务，提升系统吞吐能力。 20 25 .XX – 20 26 .XX 云原生微服务 Demo 工作描述 基于 Go Kit 构建微服务架构，实现服务注册与发现（Consul）、负载均衡及熔断机制； 使用 Docker 容器化部署服务，编写 docker-compose 编排多服务环境； 引入 Prometheus + Grafana 进行服务监控，搭建基础可观测性体系 个人技能 个人技能 语言能力：英语通过 4,6 级考试，口语流利、普通话：流利 计算机能力：熟悉 Golang 编程、Git 协作流程，熟练使用 Linux 常用命令及 Docker 容器化工具 荣誉证书：校奖学金、软件工程专业课程优秀项目奖 个人评价 个人评价 积极主动，热爱技术，对 Golang 及云原生生态有浓厚兴趣。在校期间系统学习 Golang 程序设计、云原生开发等课程，并独立完成多个 Go 项目，具备良好的编码习惯与问题排查能力。乐于钻研源码与新技术，适应团队协作，善于沟通，致力于在 Golang 后端开发方向持续深耕','{\"id\":1775811858517030201,\"userId\":1,\"name\":\"简小历\",\"education\":\"bachelor\",\"major\":\"软件工程\",\"graduationYear\":2028,\"skills\":[{\"name\":\"Golang\",\"level\":80,\"years\":2},{\"name\":\"Gin\",\"level\":75,\"years\":1},{\"name\":\"GORM\",\"level\":75,\"years\":1},{\"name\":\"MySQL\",\"level\":70,\"years\":1},{\"name\":\"Redis\",\"level\":70,\"years\":1},{\"name\":\"RabbitMQ\",\"level\":65,\"years\":1},{\"name\":\"Go Kit\",\"level\":70,\"years\":1},{\"name\":\"Docker\",\"level\":75,\"years\":1},{\"name\":\"Consul\",\"level\":65,\"years\":1},{\"name\":\"Prometheus\",\"level\":65,\"years\":1},{\"name\":\"Grafana\",\"level\":65,\"years\":1},{\"name\":\"Linux\",\"level\":70,\"years\":2},{\"name\":\"Git\",\"level\":75,\"years\":2},{\"name\":\"Rust\",\"level\":60,\"years\":1}],\"certificates\":[{\"name\":\"大学英语四级\",\"level\":\"通过\",\"year\":0},{\"name\":\"大学英语六级\",\"level\":\"通过\",\"year\":0},{\"name\":\"校奖学金\",\"level\":\"校级\",\"year\":0},{\"name\":\"软件工程专业课程优秀项目奖\",\"level\":\"院级\",\"year\":0}],\"softSkills\":{\"innovation\":75,\"learning\":85,\"pressure\":70,\"communication\":75,\"teamwork\":80},\"internship\":[],\"projects\":[{\"name\":\"分布式博客系统\",\"role\":\"开发者\",\"description\":\"基于 Golang + Gin 框架开发后端服务，设计并实现用户认证、文章发布、评论管理等核心模块，结合 JWT 完成身份鉴权；使用 GORM 实现 MySQL 数据库交互，优化慢查询；基于 Redis 实现缓存层，并利用 RabbitMQ 处理异步任务。\",\"technologies\":[\"Golang\",\"Gin\",\"JWT\",\"GORM\",\"MySQL\",\"Redis\",\"RabbitMQ\"]},{\"name\":\"云原生微服务 Demo\",\"role\":\"开发者\",\"description\":\"基于 Go Kit 构建微服务架构，实现服务注册与发现（Consul）、负载均衡及熔断机制；使用 Docker 容器化部署服务，编写 docker-compose 编排多服务环境；引入 Prometheus + Grafana 进行服务监控。\",\"technologies\":[\"Go Kit\",\"Consul\",\"Docker\",\"docker-compose\",\"Prometheus\",\"Grafana\"]}],\"completeness\":70,\"competitiveness\":75,\"suggestions\":[\"内容方面：简历中‘实习经历’部分内容实际为项目经历，建议将‘分布式博客系统’和‘云原生微服务 Demo’移至‘项目经历’部分，并补充真实的公司实习经历，包括公司名称、职位、时长和具体工作内容，以增强简历的实践背景。\",\"格式方面：优化简历结构，明确区分‘实习经历’与‘项目经历’。‘个人技能’部分可进一步分类（如编程语言、框架、工具等），使技能展示更清晰、有条理。\",\"技能方面：建议在技能描述中补充对‘云原生开发’、‘操作系统’等主修课程相关知识的掌握程度，并考虑学习或展示与Golang后端开发紧密相关的技能，如Kubernetes、CI/CD、测试框架等，以提升技术栈的深度和广度。\",\"表达方面：优化‘工作描述’和‘项目描述’的表述，使用更具体、量化的成果来替代过程性描述（例如，将‘优化慢查询’改为‘通过索引优化将某接口响应时间从Xms降低至Yms’），以突出个人贡献和项目价值。\"],\"createdAt\":1775811858,\"updatedAt\":1775811858}','[\"内容方面：简历中‘实习经历’部分内容实际为项目经历，建议将‘分布式博客系统’和‘云原生微服务 Demo’移至‘项目经历’部分，并补充真实的公司实习经历，包括公司名称、职位、时长和具体工作内容，以增强简历的实践背景。\",\"格式方面：优化简历结构，明确区分‘实习经历’与‘项目经历’。‘个人技能’部分可进一步分类（如编程语言、框架、工具等），使技能展示更清晰、有条理。\",\"技能方面：建议在技能描述中补充对‘云原生开发’、‘操作系统’等主修课程相关知识的掌握程度，并考虑学习或展示与Golang后端开发紧密相关的技能，如Kubernetes、CI/CD、测试框架等，以提升技术栈的深度和广度。\",\"表达方面：优化‘工作描述’和‘项目描述’的表述，使用更具体、量化的成果来替代过程性描述（例如，将‘优化慢查询’改为‘通过索引优化将某接口响应时间从Xms降低至Yms’），以突出个人贡献和项目价值。\"]',70,75,1775811858),
(2,1,NULL,'黑白设计通用国际贸易财务会计专业简历.docx','简小历 简小历 出生年月：20 06 . 8 手机：180 0000 1108 工作年限：应届毕业生（0年） 邮箱： jianlixiazai.cn 求职意向： Golang 软件开发岗 地址：广东省珠海市区 教育背景 教育背景 20 24 .XX – 20 28 .XX 浙江师范 大学 软件工程 专业 / 本科 主修课程 Golang 程序设计，rust 程序设计, 现代web开发，云原生开发，操作系统 实习经历 实习经历 20 24 .XX – 20 25 .XX 分布式博客系统 工作描述 基于 Golang + Gin 框架开发后端服务，设计并实现用户认证、文章发布、评论管理等核心模块，结合 JWT 完成身份鉴权； 使用 GORM 实现 MySQL 数据库交互，优化慢查询，提升接口响应效率； 基于 Redis 实现缓存层，降低数据库访问压力，并利用 RabbitMQ 处理异步任务，提升系统吞吐能力。 20 25 .XX – 20 26 .XX 云原生微服务 Demo 工作描述 基于 Go Kit 构建微服务架构，实现服务注册与发现（Consul）、负载均衡及熔断机制； 使用 Docker 容器化部署服务，编写 docker-compose 编排多服务环境； 引入 Prometheus + Grafana 进行服务监控，搭建基础可观测性体系 个人技能 个人技能 语言能力：英语通过 4,6 级考试，口语流利、普通话：流利 计算机能力：熟悉 Golang 编程、Git 协作流程，熟练使用 Linux 常用命令及 Docker 容器化工具 荣誉证书：校奖学金、软件工程专业课程优秀项目奖 个人评价 个人评价 积极主动，热爱技术，对 Golang 及云原生生态有浓厚兴趣。在校期间系统学习 Golang 程序设计、云原生开发等课程，并独立完成多个 Go 项目，具备良好的编码习惯与问题排查能力。乐于钻研源码与新技术，适应团队协作，善于沟通，致力于在 Golang 后端开发方向持续深耕','{\"id\":1775811983660079082,\"userId\":1,\"name\":\"简小历\",\"education\":\"bachelor\",\"major\":\"软件工程\",\"graduationYear\":2028,\"skills\":[{\"name\":\"Golang\",\"level\":80,\"years\":2},{\"name\":\"Gin\",\"level\":75,\"years\":1},{\"name\":\"GORM\",\"level\":70,\"years\":1},{\"name\":\"MySQL\",\"level\":70,\"years\":1},{\"name\":\"Redis\",\"level\":65,\"years\":1},{\"name\":\"RabbitMQ\",\"level\":60,\"years\":1},{\"name\":\"Go Kit\",\"level\":65,\"years\":1},{\"name\":\"Docker\",\"level\":70,\"years\":1},{\"name\":\"Consul\",\"level\":60,\"years\":1},{\"name\":\"Prometheus\",\"level\":60,\"years\":1},{\"name\":\"Grafana\",\"level\":60,\"years\":1},{\"name\":\"Linux\",\"level\":70,\"years\":2},{\"name\":\"Git\",\"level\":75,\"years\":2},{\"name\":\"Rust\",\"level\":50,\"years\":1}],\"certificates\":[{\"name\":\"大学英语四级\",\"level\":\"通过\",\"year\":0},{\"name\":\"大学英语六级\",\"level\":\"通过\",\"year\":0},{\"name\":\"校奖学金\",\"level\":\"校级\",\"year\":0},{\"name\":\"软件工程专业课程优秀项目奖\",\"level\":\"校级\",\"year\":0}],\"softSkills\":{\"innovation\":75,\"learning\":85,\"pressure\":70,\"communication\":75,\"teamwork\":80},\"internship\":[],\"projects\":[{\"name\":\"分布式博客系统\",\"role\":\"开发者\",\"description\":\"基于 Golang + Gin 框架开发后端服务，设计并实现用户认证、文章发布、评论管理等核心模块，结合 JWT 完成身份鉴权；使用 GORM 实现 MySQL 数据库交互，优化慢查询，提升接口响应效率；基于 Redis 实现缓存层，降低数据库访问压力，并利用 RabbitMQ 处理异步任务，提升系统吞吐能力。\",\"technologies\":[\"Golang\",\"Gin\",\"JWT\",\"GORM\",\"MySQL\",\"Redis\",\"RabbitMQ\"]},{\"name\":\"云原生微服务 Demo\",\"role\":\"开发者\",\"description\":\"基于 Go Kit 构建微服务架构，实现服务注册与发现（Consul）、负载均衡及熔断机制；使用 Docker 容器化部署服务，编写 docker-compose 编排多服务环境；引入 Prometheus + Grafana 进行服务监控，搭建基础可观测性体系。\",\"technologies\":[\"Go Kit\",\"Consul\",\"Docker\",\"docker-compose\",\"Prometheus\",\"Grafana\"]}],\"completeness\":70,\"competitiveness\":75,\"suggestions\":[\"内容方面：简历中‘实习经历’部分标题下实际描述的是项目经历，建议将‘分布式博客系统’和‘云原生微服务 Demo’移至‘项目经历’部分，并补充真实的公司实习经历，以增强简历的实践背景。\",\"格式方面：优化简历结构，明确区分‘实习经历’与‘项目经历’，避免信息混淆。建议使用更清晰的时间格式（如2024.09-2025.06），并确保联系方式等个人信息准确无误（如邮箱域名可能不完整）。\",\"技能方面：建议在技能描述中量化掌握程度或具体应用场景，例如‘熟练使用Docker进行容器化部署’。同时，可以考虑补充对Kubernetes等云原生核心技术的了解或学习计划，以匹配求职意向中的‘云原生’方向。\",\"表达方面：优化‘工作描述’的表述，使其更具成果导向。例如，将‘优化慢查询，提升接口响应效率’具体化为‘通过索引优化将关键接口响应时间降低XX%’，使用量化指标来突出个人贡献。\",\"证书方面：建议补充英语四六级证书的具体获得年份，并考虑考取与Golang或云原生相关的专业认证（如CKA），以提升技能的可信度和竞争力。\"],\"createdAt\":1775811983,\"updatedAt\":1775811983}','[\"内容方面：简历中‘实习经历’部分标题下实际描述的是项目经历，建议将‘分布式博客系统’和‘云原生微服务 Demo’移至‘项目经历’部分，并补充真实的公司实习经历，以增强简历的实践背景。\",\"格式方面：优化简历结构，明确区分‘实习经历’与‘项目经历’，避免信息混淆。建议使用更清晰的时间格式（如2024.09-2025.06），并确保联系方式等个人信息准确无误（如邮箱域名可能不完整）。\",\"技能方面：建议在技能描述中量化掌握程度或具体应用场景，例如‘熟练使用Docker进行容器化部署’。同时，可以考虑补充对Kubernetes等云原生核心技术的了解或学习计划，以匹配求职意向中的‘云原生’方向。\",\"表达方面：优化‘工作描述’的表述，使其更具成果导向。例如，将‘优化慢查询，提升接口响应效率’具体化为‘通过索引优化将关键接口响应时间降低XX%’，使用量化指标来突出个人贡献。\",\"证书方面：建议补充英语四六级证书的具体获得年份，并考虑考取与Golang或云原生相关的专业认证（如CKA），以提升技能的可信度和竞争力。\"]',70,75,1775811983),
(3,2,NULL,'黑白设计通用国际贸易财务会计专业简历.docx','简小历 简小历 出生年月：20 06 . 8 手机：180 0000 1108 工作年限：应届毕业生（0年） 邮箱： jianlixiazai.cn 求职意向： Golang 软件开发岗 地址：广东省珠海市区 教育背景 教育背景 20 24 .XX – 20 28 .XX 浙江师范 大学 软件工程 专业 / 本科 主修课程 Golang 程序设计，rust 程序设计, 现代web开发，云原生开发，操作系统 实习经历 实习经历 20 24 .XX – 20 25 .XX 分布式博客系统 工作描述 基于 Golang + Gin 框架开发后端服务，设计并实现用户认证、文章发布、评论管理等核心模块，结合 JWT 完成身份鉴权； 使用 GORM 实现 MySQL 数据库交互，优化慢查询，提升接口响应效率； 基于 Redis 实现缓存层，降低数据库访问压力，并利用 RabbitMQ 处理异步任务，提升系统吞吐能力。 20 25 .XX – 20 26 .XX 云原生微服务 Demo 工作描述 基于 Go Kit 构建微服务架构，实现服务注册与发现（Consul）、负载均衡及熔断机制； 使用 Docker 容器化部署服务，编写 docker-compose 编排多服务环境； 引入 Prometheus + Grafana 进行服务监控，搭建基础可观测性体系 个人技能 个人技能 语言能力：英语通过 4,6 级考试，口语流利、普通话：流利 计算机能力：熟悉 Golang 编程、Git 协作流程，熟练使用 Linux 常用命令及 Docker 容器化工具 荣誉证书：校奖学金、软件工程专业课程优秀项目奖 个人评价 个人评价 积极主动，热爱技术，对 Golang 及云原生生态有浓厚兴趣。在校期间系统学习 Golang 程序设计、云原生开发等课程，并独立完成多个 Go 项目，具备良好的编码习惯与问题排查能力。乐于钻研源码与新技术，适应团队协作，善于沟通，致力于在 Golang 后端开发方向持续深耕','{\"id\":1775828731223459091,\"userId\":2,\"name\":\"简小历\",\"education\":\"bachelor\",\"major\":\"软件工程\",\"graduationYear\":2028,\"skills\":[{\"name\":\"Golang\",\"level\":80,\"years\":2},{\"name\":\"Gin\",\"level\":75,\"years\":1},{\"name\":\"GORM\",\"level\":70,\"years\":1},{\"name\":\"MySQL\",\"level\":70,\"years\":1},{\"name\":\"Redis\",\"level\":65,\"years\":1},{\"name\":\"RabbitMQ\",\"level\":60,\"years\":1},{\"name\":\"Go Kit\",\"level\":65,\"years\":1},{\"name\":\"Consul\",\"level\":60,\"years\":1},{\"name\":\"Docker\",\"level\":70,\"years\":1},{\"name\":\"Prometheus\",\"level\":60,\"years\":1},{\"name\":\"Grafana\",\"level\":60,\"years\":1},{\"name\":\"Linux\",\"level\":70,\"years\":2},{\"name\":\"Git\",\"level\":75,\"years\":2},{\"name\":\"Rust\",\"level\":50,\"years\":1}],\"certificates\":[{\"name\":\"大学英语四级\",\"level\":\"通过\",\"year\":0},{\"name\":\"大学英语六级\",\"level\":\"通过\",\"year\":0},{\"name\":\"校奖学金\",\"level\":\"校级\",\"year\":0},{\"name\":\"软件工程专业课程优秀项目奖\",\"level\":\"院级\",\"year\":0}],\"softSkills\":{\"innovation\":75,\"learning\":85,\"pressure\":70,\"communication\":75,\"teamwork\":80},\"internship\":[],\"projects\":[{\"name\":\"分布式博客系统\",\"role\":\"开发者\",\"description\":\"基于 Golang + Gin 框架开发后端服务，设计并实现用户认证、文章发布、评论管理等核心模块，结合 JWT 完成身份鉴权；使用 GORM 实现 MySQL 数据库交互，优化慢查询，提升接口响应效率；基于 Redis 实现缓存层，降低数据库访问压力，并利用 RabbitMQ 处理异步任务，提升系统吞吐能力。\",\"technologies\":[\"Golang\",\"Gin\",\"JWT\",\"GORM\",\"MySQL\",\"Redis\",\"RabbitMQ\"]},{\"name\":\"云原生微服务 Demo\",\"role\":\"开发者\",\"description\":\"基于 Go Kit 构建微服务架构，实现服务注册与发现（Consul）、负载均衡及熔断机制；使用 Docker 容器化部署服务，编写 docker-compose 编排多服务环境；引入 Prometheus + Grafana 进行服务监控，搭建基础可观测性体系。\",\"technologies\":[\"Go Kit\",\"Consul\",\"Docker\",\"docker-compose\",\"Prometheus\",\"Grafana\"]}],\"completeness\":70,\"competitiveness\":75,\"suggestions\":[\"内容方面：简历中‘实习经历’部分标题下实际为项目描述，建议将‘分布式博客系统’和‘云原生微服务 Demo’明确归类为‘项目经历’，并补充真实的公司实习经历，包括公司名称、职位、时长和具体工作内容，以增强简历的可信度和竞争力。\",\"格式方面：优化简历结构，将‘教育背景’、‘项目经历’、‘个人技能’、‘荣誉证书’、‘个人评价’等部分清晰分隔，避免信息混杂。例如，将当前‘实习经历’标题下的内容移至‘项目经历’部分，并确保每个项目的描述使用 STAR 法则（情境、任务、行动、结果）来突出成果。\",\"技能方面：建议在技能列表中量化掌握程度和年限，并补充更多与求职意向（Golang 软件开发岗）相关的技术栈，如 Kubernetes、微服务设计模式、CI/CD 工具等，以展示对云原生技术的深入理解。同时，将英语证书的获得年份补充完整。\"],\"createdAt\":1775828731,\"updatedAt\":1775828731}','[\"内容方面：简历中‘实习经历’部分标题下实际为项目描述，建议将‘分布式博客系统’和‘云原生微服务 Demo’明确归类为‘项目经历’，并补充真实的公司实习经历，包括公司名称、职位、时长和具体工作内容，以增强简历的可信度和竞争力。\",\"格式方面：优化简历结构，将‘教育背景’、‘项目经历’、‘个人技能’、‘荣誉证书’、‘个人评价’等部分清晰分隔，避免信息混杂。例如，将当前‘实习经历’标题下的内容移至‘项目经历’部分，并确保每个项目的描述使用 STAR 法则（情境、任务、行动、结果）来突出成果。\",\"技能方面：建议在技能列表中量化掌握程度和年限，并补充更多与求职意向（Golang 软件开发岗）相关的技术栈，如 Kubernetes、微服务设计模式、CI/CD 工具等，以展示对云原生技术的深入理解。同时，将英语证书的获得年份补充完整。\"]',70,75,1775828731),
(4,3,NULL,'黑白设计通用国际贸易财务会计专业简历.docx','简小历 简小历 出生年月：20 06 . 8 手机：180 0000 1108 工作年限：应届毕业生（0年） 邮箱： jianlixiazai.cn 求职意向： Golang 软件开发岗 地址：广东省珠海市区 教育背景 教育背景 20 24 .XX – 20 28 .XX 浙江师范 大学 软件工程 专业 / 本科 主修课程 Golang 程序设计，rust 程序设计, 现代web开发，云原生开发，操作系统 实习经历 实习经历 20 24 .XX – 20 25 .XX 分布式博客系统 工作描述 基于 Golang + Gin 框架开发后端服务，设计并实现用户认证、文章发布、评论管理等核心模块，结合 JWT 完成身份鉴权； 使用 GORM 实现 MySQL 数据库交互，优化慢查询，提升接口响应效率； 基于 Redis 实现缓存层，降低数据库访问压力，并利用 RabbitMQ 处理异步任务，提升系统吞吐能力。 20 25 .XX – 20 26 .XX 云原生微服务 Demo 工作描述 基于 Go Kit 构建微服务架构，实现服务注册与发现（Consul）、负载均衡及熔断机制； 使用 Docker 容器化部署服务，编写 docker-compose 编排多服务环境； 引入 Prometheus + Grafana 进行服务监控，搭建基础可观测性体系 个人技能 个人技能 语言能力：英语通过 4,6 级考试，口语流利、普通话：流利 计算机能力：熟悉 Golang 编程、Git 协作流程，熟练使用 Linux 常用命令及 Docker 容器化工具 荣誉证书：校奖学金、软件工程专业课程优秀项目奖 个人评价 个人评价 积极主动，热爱技术，对 Golang 及云原生生态有浓厚兴趣。在校期间系统学习 Golang 程序设计、云原生开发等课程，并独立完成多个 Go 项目，具备良好的编码习惯与问题排查能力。乐于钻研源码与新技术，适应团队协作，善于沟通，致力于在 Golang 后端开发方向持续深耕','{\"id\":1775829373786614619,\"userId\":3,\"name\":\"简小历\",\"education\":\"bachelor\",\"major\":\"软件工程\",\"graduationYear\":2028,\"skills\":[{\"name\":\"Golang\",\"level\":80,\"years\":2},{\"name\":\"Gin\",\"level\":75,\"years\":1},{\"name\":\"MySQL\",\"level\":70,\"years\":1},{\"name\":\"Redis\",\"level\":70,\"years\":1},{\"name\":\"Docker\",\"level\":70,\"years\":1},{\"name\":\"Linux\",\"level\":65,\"years\":1},{\"name\":\"Git\",\"level\":75,\"years\":1},{\"name\":\"RabbitMQ\",\"level\":65,\"years\":1},{\"name\":\"Go Kit\",\"level\":65,\"years\":1},{\"name\":\"Prometheus\",\"level\":60,\"years\":1},{\"name\":\"Grafana\",\"level\":60,\"years\":1},{\"name\":\"Rust\",\"level\":50,\"years\":1}],\"certificates\":[{\"name\":\"大学英语四级\",\"level\":\"通过\",\"year\":0},{\"name\":\"大学英语六级\",\"level\":\"通过\",\"year\":0},{\"name\":\"校奖学金\",\"level\":\"校级\",\"year\":0},{\"name\":\"软件工程专业课程优秀项目奖\",\"level\":\"校级\",\"year\":0}],\"softSkills\":{\"innovation\":75,\"learning\":85,\"pressure\":70,\"communication\":75,\"teamwork\":80},\"internship\":[],\"projects\":[{\"name\":\"分布式博客系统\",\"role\":\"开发者\",\"description\":\"基于 Golang + Gin 框架开发后端服务，设计并实现用户认证、文章发布、评论管理等核心模块，结合 JWT 完成身份鉴权；使用 GORM 实现 MySQL 数据库交互，优化慢查询，提升接口响应效率；基于 Redis 实现缓存层，降低数据库访问压力，并利用 RabbitMQ 处理异步任务，提升系统吞吐能力。\",\"technologies\":[\"Golang\",\"Gin\",\"JWT\",\"GORM\",\"MySQL\",\"Redis\",\"RabbitMQ\"]},{\"name\":\"云原生微服务 Demo\",\"role\":\"开发者\",\"description\":\"基于 Go Kit 构建微服务架构，实现服务注册与发现（Consul）、负载均衡及熔断机制；使用 Docker 容器化部署服务，编写 docker-compose 编排多服务环境；引入 Prometheus + Grafana 进行服务监控，搭建基础可观测性体系。\",\"technologies\":[\"Go Kit\",\"Consul\",\"Docker\",\"docker-compose\",\"Prometheus\",\"Grafana\"]}],\"completeness\":70,\"competitiveness\":75,\"suggestions\":[\"内容方面：简历中缺少明确的实习经历。‘实习经历’标题下的内容实际上是项目经历，建议将‘分布式博客系统’和‘云原生微服务 Demo’移至‘项目经历’部分，并补充真实的公司实习经历，包括公司名称、职位、时长和具体工作内容，以增强简历的实践背景。\",\"格式方面：简历结构存在混淆，将项目经历错误归类为实习经历。建议明确区分‘实习经历’和‘项目经历’两个部分，使结构更清晰、专业。同时，个人信息部分（如邮箱）应确保格式正确（jianlixiazai.cn 缺少‘@’符号）。\",\"技能方面：技能描述可以更量化。例如，在‘个人技能’部分，可以将‘熟悉’、‘熟练’等定性描述转化为具体的掌握程度（如百分比）或相关项目/经验佐证，使技能水平更具说服力。\",\"表达方面：项目描述可以进一步优化，突出个人贡献和成果。例如，在‘分布式博客系统’中，可以具体说明‘优化慢查询’后接口响应效率提升了多少百分比，或者系统吞吐能力的具体提升数据，以量化成果。\",\"信息完整性：证书部分缺少具体的获得年份，建议补充。教育背景中的主修课程可以精简，或选择与求职意向（Golang开发）最相关的几门课程列出，使信息更聚焦。\"],\"createdAt\":1775829373,\"updatedAt\":1775829373}','[\"内容方面：简历中缺少明确的实习经历。‘实习经历’标题下的内容实际上是项目经历，建议将‘分布式博客系统’和‘云原生微服务 Demo’移至‘项目经历’部分，并补充真实的公司实习经历，包括公司名称、职位、时长和具体工作内容，以增强简历的实践背景。\",\"格式方面：简历结构存在混淆，将项目经历错误归类为实习经历。建议明确区分‘实习经历’和‘项目经历’两个部分，使结构更清晰、专业。同时，个人信息部分（如邮箱）应确保格式正确（jianlixiazai.cn 缺少‘@’符号）。\",\"技能方面：技能描述可以更量化。例如，在‘个人技能’部分，可以将‘熟悉’、‘熟练’等定性描述转化为具体的掌握程度（如百分比）或相关项目/经验佐证，使技能水平更具说服力。\",\"表达方面：项目描述可以进一步优化，突出个人贡献和成果。例如，在‘分布式博客系统’中，可以具体说明‘优化慢查询’后接口响应效率提升了多少百分比，或者系统吞吐能力的具体提升数据，以量化成果。\",\"信息完整性：证书部分缺少具体的获得年份，建议补充。教育背景中的主修课程可以精简，或选择与求职意向（Golang开发）最相关的几门课程列出，使信息更聚焦。\"]',70,75,1775829373);
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
(1,1,'简小历','bachelor','软件工程',2028,'[{\"name\":\"Golang\",\"level\":80,\"years\":2},{\"name\":\"Gin\",\"level\":75,\"years\":1},{\"name\":\"GORM\",\"level\":70,\"years\":1},{\"name\":\"MySQL\",\"level\":70,\"years\":1},{\"name\":\"Redis\",\"level\":65,\"years\":1},{\"name\":\"RabbitMQ\",\"level\":60,\"years\":1},{\"name\":\"Go Kit\",\"level\":65,\"years\":1},{\"name\":\"Docker\",\"level\":70,\"years\":1},{\"name\":\"Consul\",\"level\":60,\"years\":1},{\"name\":\"Prometheus\",\"level\":60,\"years\":1},{\"name\":\"Grafana\",\"level\":60,\"years\":1},{\"name\":\"Linux\",\"level\":70,\"years\":2},{\"name\":\"Git\",\"level\":75,\"years\":2},{\"name\":\"Rust\",\"level\":50,\"years\":1}]','[{\"name\":\"大学英语四级\",\"level\":\"通过\",\"year\":0},{\"name\":\"大学英语六级\",\"level\":\"通过\",\"year\":0},{\"name\":\"校奖学金\",\"level\":\"校级\",\"year\":0},{\"name\":\"软件工程专业课程优秀项目奖\",\"level\":\"校级\",\"year\":0}]','{\"innovation\":75,\"learning\":85,\"pressure\":70,\"communication\":75,\"teamwork\":80}','[]','[{\"name\":\"分布式博客系统\",\"role\":\"开发者\",\"description\":\"基于 Golang + Gin 框架开发后端服务，设计并实现用户认证、文章发布、评论管理等核心模块，结合 JWT 完成身份鉴权；使用 GORM 实现 MySQL 数据库交互，优化慢查询，提升接口响应效率；基于 Redis 实现缓存层，降低数据库访问压力，并利用 RabbitMQ 处理异步任务，提升系统吞吐能力。\",\"technologies\":[\"Golang\",\"Gin\",\"JWT\",\"GORM\",\"MySQL\",\"Redis\",\"RabbitMQ\"]},{\"name\":\"云原生微服务 Demo\",\"role\":\"开发者\",\"description\":\"基于 Go Kit 构建微服务架构，实现服务注册与发现（Consul）、负载均衡及熔断机制；使用 Docker 容器化部署服务，编写 docker-compose 编排多服务环境；引入 Prometheus + Grafana 进行服务监控，搭建基础可观测性体系。\",\"technologies\":[\"Go Kit\",\"Consul\",\"Docker\",\"docker-compose\",\"Prometheus\",\"Grafana\"]}]',70,75,NULL,'[\"内容方面：简历中‘实习经历’部分标题下实际描述的是项目经历，建议将‘分布式博客系统’和‘云原生微服务 Demo’移至‘项目经历’部分，并补充真实的公司实习经历，以增强简历的实践背景。\",\"格式方面：优化简历结构，明确区分‘实习经历’与‘项目经历’，避免信息混淆。建议使用更清晰的时间格式（如2024.09-2025.06），并确保联系方式等个人信息准确无误（如邮箱域名可能不完整）。\",\"技能方面：建议在技能描述中量化掌握程度或具体应用场景，例如‘熟练使用Docker进行容器化部署’。同时，可以考虑补充对Kubernetes等云原生核心技术的了解或学习计划，以匹配求职意向中的‘云原生’方向。\",\"表达方面：优化‘工作描述’的表述，使其更具成果导向。例如，将‘优化慢查询，提升接口响应效率’具体化为‘通过索引优化将关键接口响应时间降低XX%’，使用量化指标来突出个人贡献。\",\"证书方面：建议补充英语四六级证书的具体获得年份，并考虑考取与Golang或云原生相关的专业认证（如CKA），以提升技能的可信度和竞争力。\"]','简小历 简小历 出生年月：20 06 . 8 手机：180 0000 1108 工作年限：应届毕业生（0年） 邮箱： jianlixiazai.cn 求职意向： Golang 软件开发岗 地址：广东省珠海市区 教育背景 教育背景 20 24 .XX – 20 28 .XX 浙江师范 大学 软件工程 专业 / 本科 主修课程 Golang 程序设计，rust 程序设计, 现代web开发，云原生开发，操作系统 实习经历 实习经历 20 24 .XX – 20 25 .XX 分布式博客系统 工作描述 基于 Golang + Gin 框架开发后端服务，设计并实现用户认证、文章发布、评论管理等核心模块，结合 JWT 完成身份鉴权； 使用 GORM 实现 MySQL 数据库交互，优化慢查询，提升接口响应效率； 基于 Redis 实现缓存层，降低数据库访问压力，并利用 RabbitMQ 处理异步任务，提升系统吞吐能力。 20 25 .XX – 20 26 .XX 云原生微服务 Demo 工作描述 基于 Go Kit 构建微服务架构，实现服务注册与发现（Consul）、负载均衡及熔断机制； 使用 Docker 容器化部署服务，编写 docker-compose 编排多服务环境； 引入 Prometheus + Grafana 进行服务监控，搭建基础可观测性体系 个人技能 个人技能 语言能力：英语通过 4,6 级考试，口语流利、普通话：流利 计算机能力：熟悉 Golang 编程、Git 协作流程，熟练使用 Linux 常用命令及 Docker 容器化工具 荣誉证书：校奖学金、软件工程专业课程优秀项目奖 个人评价 个人评价 积极主动，热爱技术，对 Golang 及云原生生态有浓厚兴趣。在校期间系统学习 Golang 程序设计、云原生开发等课程，并独立完成多个 Go 项目，具备良好的编码习惯与问题排查能力。乐于钻研源码与新技术，适应团队协作，善于沟通，致力于在 Golang 后端开发方向持续深耕',1775811858,1775811858),
(2,2,'简小历','bachelor','软件工程',2028,'[{\"name\":\"Golang\",\"level\":80,\"years\":2},{\"name\":\"Gin\",\"level\":75,\"years\":1},{\"name\":\"GORM\",\"level\":70,\"years\":1},{\"name\":\"MySQL\",\"level\":70,\"years\":1},{\"name\":\"Redis\",\"level\":65,\"years\":1},{\"name\":\"RabbitMQ\",\"level\":60,\"years\":1},{\"name\":\"Go Kit\",\"level\":65,\"years\":1},{\"name\":\"Consul\",\"level\":60,\"years\":1},{\"name\":\"Docker\",\"level\":70,\"years\":1},{\"name\":\"Prometheus\",\"level\":60,\"years\":1},{\"name\":\"Grafana\",\"level\":60,\"years\":1},{\"name\":\"Linux\",\"level\":70,\"years\":2},{\"name\":\"Git\",\"level\":75,\"years\":2},{\"name\":\"Rust\",\"level\":50,\"years\":1}]','[{\"name\":\"大学英语四级\",\"level\":\"通过\",\"year\":0},{\"name\":\"大学英语六级\",\"level\":\"通过\",\"year\":0},{\"name\":\"校奖学金\",\"level\":\"校级\",\"year\":0},{\"name\":\"软件工程专业课程优秀项目奖\",\"level\":\"院级\",\"year\":0}]','{\"innovation\":75,\"learning\":85,\"pressure\":70,\"communication\":75,\"teamwork\":80}','[]','[{\"name\":\"分布式博客系统\",\"role\":\"开发者\",\"description\":\"基于 Golang + Gin 框架开发后端服务，设计并实现用户认证、文章发布、评论管理等核心模块，结合 JWT 完成身份鉴权；使用 GORM 实现 MySQL 数据库交互，优化慢查询，提升接口响应效率；基于 Redis 实现缓存层，降低数据库访问压力，并利用 RabbitMQ 处理异步任务，提升系统吞吐能力。\",\"technologies\":[\"Golang\",\"Gin\",\"JWT\",\"GORM\",\"MySQL\",\"Redis\",\"RabbitMQ\"]},{\"name\":\"云原生微服务 Demo\",\"role\":\"开发者\",\"description\":\"基于 Go Kit 构建微服务架构，实现服务注册与发现（Consul）、负载均衡及熔断机制；使用 Docker 容器化部署服务，编写 docker-compose 编排多服务环境；引入 Prometheus + Grafana 进行服务监控，搭建基础可观测性体系。\",\"technologies\":[\"Go Kit\",\"Consul\",\"Docker\",\"docker-compose\",\"Prometheus\",\"Grafana\"]}]',70,75,NULL,'[\"内容方面：简历中‘实习经历’部分标题下实际为项目描述，建议将‘分布式博客系统’和‘云原生微服务 Demo’明确归类为‘项目经历’，并补充真实的公司实习经历，包括公司名称、职位、时长和具体工作内容，以增强简历的可信度和竞争力。\",\"格式方面：优化简历结构，将‘教育背景’、‘项目经历’、‘个人技能’、‘荣誉证书’、‘个人评价’等部分清晰分隔，避免信息混杂。例如，将当前‘实习经历’标题下的内容移至‘项目经历’部分，并确保每个项目的描述使用 STAR 法则（情境、任务、行动、结果）来突出成果。\",\"技能方面：建议在技能列表中量化掌握程度和年限，并补充更多与求职意向（Golang 软件开发岗）相关的技术栈，如 Kubernetes、微服务设计模式、CI/CD 工具等，以展示对云原生技术的深入理解。同时，将英语证书的获得年份补充完整。\"]','简小历 简小历 出生年月：20 06 . 8 手机：180 0000 1108 工作年限：应届毕业生（0年） 邮箱： jianlixiazai.cn 求职意向： Golang 软件开发岗 地址：广东省珠海市区 教育背景 教育背景 20 24 .XX – 20 28 .XX 浙江师范 大学 软件工程 专业 / 本科 主修课程 Golang 程序设计，rust 程序设计, 现代web开发，云原生开发，操作系统 实习经历 实习经历 20 24 .XX – 20 25 .XX 分布式博客系统 工作描述 基于 Golang + Gin 框架开发后端服务，设计并实现用户认证、文章发布、评论管理等核心模块，结合 JWT 完成身份鉴权； 使用 GORM 实现 MySQL 数据库交互，优化慢查询，提升接口响应效率； 基于 Redis 实现缓存层，降低数据库访问压力，并利用 RabbitMQ 处理异步任务，提升系统吞吐能力。 20 25 .XX – 20 26 .XX 云原生微服务 Demo 工作描述 基于 Go Kit 构建微服务架构，实现服务注册与发现（Consul）、负载均衡及熔断机制； 使用 Docker 容器化部署服务，编写 docker-compose 编排多服务环境； 引入 Prometheus + Grafana 进行服务监控，搭建基础可观测性体系 个人技能 个人技能 语言能力：英语通过 4,6 级考试，口语流利、普通话：流利 计算机能力：熟悉 Golang 编程、Git 协作流程，熟练使用 Linux 常用命令及 Docker 容器化工具 荣誉证书：校奖学金、软件工程专业课程优秀项目奖 个人评价 个人评价 积极主动，热爱技术，对 Golang 及云原生生态有浓厚兴趣。在校期间系统学习 Golang 程序设计、云原生开发等课程，并独立完成多个 Go 项目，具备良好的编码习惯与问题排查能力。乐于钻研源码与新技术，适应团队协作，善于沟通，致力于在 Golang 后端开发方向持续深耕',1775828731,1775828731),
(3,3,'简小历','bachelor','软件工程',2028,'[{\"name\":\"Golang\",\"level\":80,\"years\":2},{\"name\":\"Gin\",\"level\":75,\"years\":1},{\"name\":\"MySQL\",\"level\":70,\"years\":1},{\"name\":\"Redis\",\"level\":70,\"years\":1},{\"name\":\"Docker\",\"level\":70,\"years\":1},{\"name\":\"Linux\",\"level\":65,\"years\":1},{\"name\":\"Git\",\"level\":75,\"years\":1},{\"name\":\"RabbitMQ\",\"level\":65,\"years\":1},{\"name\":\"Go Kit\",\"level\":65,\"years\":1},{\"name\":\"Prometheus\",\"level\":60,\"years\":1},{\"name\":\"Grafana\",\"level\":60,\"years\":1},{\"name\":\"Rust\",\"level\":50,\"years\":1}]','[{\"name\":\"大学英语四级\",\"level\":\"通过\",\"year\":0},{\"name\":\"大学英语六级\",\"level\":\"通过\",\"year\":0},{\"name\":\"校奖学金\",\"level\":\"校级\",\"year\":0},{\"name\":\"软件工程专业课程优秀项目奖\",\"level\":\"校级\",\"year\":0}]','{\"innovation\":75,\"learning\":85,\"pressure\":70,\"communication\":75,\"teamwork\":80}','[]','[{\"name\":\"分布式博客系统\",\"role\":\"开发者\",\"description\":\"基于 Golang + Gin 框架开发后端服务，设计并实现用户认证、文章发布、评论管理等核心模块，结合 JWT 完成身份鉴权；使用 GORM 实现 MySQL 数据库交互，优化慢查询，提升接口响应效率；基于 Redis 实现缓存层，降低数据库访问压力，并利用 RabbitMQ 处理异步任务，提升系统吞吐能力。\",\"technologies\":[\"Golang\",\"Gin\",\"JWT\",\"GORM\",\"MySQL\",\"Redis\",\"RabbitMQ\"]},{\"name\":\"云原生微服务 Demo\",\"role\":\"开发者\",\"description\":\"基于 Go Kit 构建微服务架构，实现服务注册与发现（Consul）、负载均衡及熔断机制；使用 Docker 容器化部署服务，编写 docker-compose 编排多服务环境；引入 Prometheus + Grafana 进行服务监控，搭建基础可观测性体系。\",\"technologies\":[\"Go Kit\",\"Consul\",\"Docker\",\"docker-compose\",\"Prometheus\",\"Grafana\"]}]',70,75,NULL,'[\"内容方面：简历中缺少明确的实习经历。‘实习经历’标题下的内容实际上是项目经历，建议将‘分布式博客系统’和‘云原生微服务 Demo’移至‘项目经历’部分，并补充真实的公司实习经历，包括公司名称、职位、时长和具体工作内容，以增强简历的实践背景。\",\"格式方面：简历结构存在混淆，将项目经历错误归类为实习经历。建议明确区分‘实习经历’和‘项目经历’两个部分，使结构更清晰、专业。同时，个人信息部分（如邮箱）应确保格式正确（jianlixiazai.cn 缺少‘@’符号）。\",\"技能方面：技能描述可以更量化。例如，在‘个人技能’部分，可以将‘熟悉’、‘熟练’等定性描述转化为具体的掌握程度（如百分比）或相关项目/经验佐证，使技能水平更具说服力。\",\"表达方面：项目描述可以进一步优化，突出个人贡献和成果。例如，在‘分布式博客系统’中，可以具体说明‘优化慢查询’后接口响应效率提升了多少百分比，或者系统吞吐能力的具体提升数据，以量化成果。\",\"信息完整性：证书部分缺少具体的获得年份，建议补充。教育背景中的主修课程可以精简，或选择与求职意向（Golang开发）最相关的几门课程列出，使信息更聚焦。\"]','简小历 简小历 出生年月：20 06 . 8 手机：180 0000 1108 工作年限：应届毕业生（0年） 邮箱： jianlixiazai.cn 求职意向： Golang 软件开发岗 地址：广东省珠海市区 教育背景 教育背景 20 24 .XX – 20 28 .XX 浙江师范 大学 软件工程 专业 / 本科 主修课程 Golang 程序设计，rust 程序设计, 现代web开发，云原生开发，操作系统 实习经历 实习经历 20 24 .XX – 20 25 .XX 分布式博客系统 工作描述 基于 Golang + Gin 框架开发后端服务，设计并实现用户认证、文章发布、评论管理等核心模块，结合 JWT 完成身份鉴权； 使用 GORM 实现 MySQL 数据库交互，优化慢查询，提升接口响应效率； 基于 Redis 实现缓存层，降低数据库访问压力，并利用 RabbitMQ 处理异步任务，提升系统吞吐能力。 20 25 .XX – 20 26 .XX 云原生微服务 Demo 工作描述 基于 Go Kit 构建微服务架构，实现服务注册与发现（Consul）、负载均衡及熔断机制； 使用 Docker 容器化部署服务，编写 docker-compose 编排多服务环境； 引入 Prometheus + Grafana 进行服务监控，搭建基础可观测性体系 个人技能 个人技能 语言能力：英语通过 4,6 级考试，口语流利、普通话：流利 计算机能力：熟悉 Golang 编程、Git 协作流程，熟练使用 Linux 常用命令及 Docker 容器化工具 荣誉证书：校奖学金、软件工程专业课程优秀项目奖 个人评价 个人评价 积极主动，热爱技术，对 Golang 及云原生生态有浓厚兴趣。在校期间系统学习 Golang 程序设计、云原生开发等课程，并独立完成多个 Go 项目，具备良好的编码习惯与问题排查能力。乐于钻研源码与新技术，适应团队协作，善于沟通，致力于在 Golang 后端开发方向持续深耕',1775829373,1775829373);
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
(1,'testuser','$2a$10$vyVlizx3f0cAWo1UMUk6oOpOUZVzvx9rvm1knTG3Pavy4frJfl/RW','test@example.com',NULL,'user',1775811809,1775811809),
(2,'202432110230','$2a$10$B1.6boYl3riC8ABvVGfyIezGJIDmMjPUErFTkfwDdaLrBOa5J/QTS','zhujian_20060818@qq.com',NULL,'user',1775827278,1775827278),
(3,'202432110231','$2a$10$MfXkOSu.by0CgbW3fKjbyeFCSFkJ1WY/SkmFHQLS9fcMDINWGcUpG','zzz@zzz.com',NULL,'user',1775829213,1775829213),
(4,'202432110232','$2a$10$ONhP32AlBw7hLgEF5EIba.ggYhCCWN3VIFLeqorvveMiAOlAPGFUG','zhujian_20060818@qc.com',NULL,'user',1775829506,1775829506);
SET FOREIGN_KEY_CHECKS=1;
