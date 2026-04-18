# Jobs表字段重新设计方案

> 基于Excel数据(20260226105856_457.xls)分析  
> 生成日期: 2026-04-18

## 一、数据源分析

### 1.1 Excel数据概况
- **文件名**: 20260226105856_457.xls
- **记录数**: 9,958条岗位数据
- **来源**: 招聘平台

### 1.2 Excel字段列表

| 字段名 | 示例值 | 说明 |
|--------|--------|------|
| 岗位名称 | 前端开发 | 职位名称 |
| 地址 | 东莞-虎门镇 | 工作地点 |
| 薪资范围 | 3000-4000元 | 薪酬区间 |
| 公司名称 | 东莞市恒亚罗斯计算机科技有限公司 | 企业名称 |
| 所属行业 | 计算机软件,互联网,IT服务 | 行业分类(多值逗号分隔) |
| 公司规模 | 20-99人 | 员工数量 |
| 公司类型 | 天使轮 | 融资阶段 |
| 岗位编码 | CC668565120J40736166805 | 外部系统ID |
| 岗位详情 | 1.负责...<br>2.参与... | HTML格式岗位职责 |
| 更新日期 | 5月19日 | 数据更新日期 |
| 公司详情 | 南极芯科技是一家... | HTML格式公司简介 |
| 岗位来源地址 | https://www.zhaopin.com/... | 原始招聘链接 |

---

## 二、当前jobs表结构

```sql
CREATE TABLE jobs (
    id BIGINT(20) NOT NULL AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,           -- 岗位名称
    description TEXT DEFAULT NULL,        -- 描述
    company VARCHAR(100) DEFAULT NULL,    -- 公司名称
    industry VARCHAR(100) DEFAULT NULL,   -- 所属行业
    category VARCHAR(100) DEFAULT NULL,   -- 岗位分类
    location VARCHAR(100) DEFAULT NULL,   -- 工作地点
    salary_range VARCHAR(100) DEFAULT NULL, -- 薪资范围
    skills TEXT DEFAULT NULL,             -- 技能要求
    certificates TEXT DEFAULT NULL,       -- 证书要求
    soft_skills TEXT DEFAULT NULL,        -- 软技能
    requirements TEXT DEFAULT NULL,       -- 任职要求
    growth_potential TEXT DEFAULT NULL,   -- 成长潜力
    created_at BIGINT(20) NOT NULL,
    updated_at BIGINT(20) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_industry (industry),
    KEY idx_category (category),
    KEY idx_location (location)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 三、字段对比分析

### 3.1 已匹配字段

| Excel字段 | jobs表字段 | 状态 |
|-----------|------------|------|
| 岗位名称 | name | ✅ 一致 |
| 地址 | location | ✅ 一致 |
| 薪资范围 | salary_range | ✅ 一致 |
| 公司名称 | company | ✅ 一致 |
| 所属行业 | industry | ✅ 一致 |

### 3.2 需拆分字段

| 字段 | 问题 |
|------|------|
| 描述/岗位详情 | 当前description字段存储简短描述，但Excel中"岗位详情"为HTML长文本，需拆分为两个字段 |

### 3.3 缺失字段(需要新增)

| 字段 | 重要性 | 说明 |
|------|--------|------|
| company_scale | 高 | 公司规模(20人以下/20-99人/100-299人/500-999人/1000-9999人/10000人以上) |
| company_funding_status | 高 | 融资状态(未融资/不需要融资/天使轮/A轮/B轮/C轮/D轮/已上市) |
| job_code | 高 | 外部岗位编码，用于去重和溯源 |
| source_url | 中 | 岗位来源URL |
| update_date | 中 | 更新日期 |
| company_description | 中 | 公司详情(HTML) |

---

## 四、重新设计方案

### 4.1 数据库变更

```sql
-- 新增字段
ALTER TABLE jobs ADD COLUMN job_code VARCHAR(50) DEFAULT NULL COMMENT '外部岗位编码';
ALTER TABLE jobs ADD COLUMN company_scale VARCHAR(50) DEFAULT NULL COMMENT '公司规模';
ALTER TABLE jobs ADD COLUMN company_funding_status VARCHAR(50) DEFAULT NULL COMMENT '融资状态: 未融资/天使轮/A轮/已上市等';
ALTER TABLE jobs ADD COLUMN company_description TEXT DEFAULT NULL COMMENT '公司详情(HTML)';
ALTER TABLE jobs ADD COLUMN source_url VARCHAR(500) DEFAULT NULL COMMENT '岗位来源URL';
ALTER TABLE jobs ADD COLUMN update_date DATE DEFAULT NULL COMMENT '更新日期';
ALTER TABLE jobs ADD COLUMN job_detail TEXT DEFAULT NULL COMMENT '详细岗位职责(HTML)';

-- 添加索引
ALTER TABLE jobs ADD KEY idx_job_code (job_code);
ALTER TABLE jobs ADD KEY idx_company_scale (company_scale);
ALTER TABLE jobs ADD KEY idx_company_funding (company_funding_status);
```

### 4.2 字段语义调整

| 原字段 | 调整后语义 |
|--------|-----------|
| description | 简短描述(纯文本，不超过500字) |
| job_detail | 详细岗位职责(可包含HTML) |
| requirements | 任职要求(保留) |

### 4.3 建议的完整表结构

```sql
CREATE TABLE jobs (
    id BIGINT(20) NOT NULL AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL COMMENT '岗位名称',
    description TEXT DEFAULT NULL COMMENT '简短描述(纯文本)',
    company VARCHAR(200) DEFAULT NULL COMMENT '公司名称',
    industry VARCHAR(100) DEFAULT NULL COMMENT '所属行业',
    category VARCHAR(100) DEFAULT NULL COMMENT '岗位分类',
    location VARCHAR(100) DEFAULT NULL COMMENT '工作地点',
    salary_range VARCHAR(100) DEFAULT NULL COMMENT '薪资范围',
    
    -- 新增字段
    job_code VARCHAR(50) DEFAULT NULL COMMENT '外部岗位编码',
    company_scale VARCHAR(50) DEFAULT NULL COMMENT '公司规模',
    company_funding_status VARCHAR(50) DEFAULT NULL COMMENT '融资状态',
    company_description TEXT DEFAULT NULL COMMENT '公司详情',
    source_url VARCHAR(500) DEFAULT NULL COMMENT '来源URL',
    update_date DATE DEFAULT NULL COMMENT '更新日期',
    job_detail TEXT DEFAULT NULL COMMENT '详细岗位职责',
    
    -- 保留字段
    skills TEXT DEFAULT NULL,
    certificates TEXT DEFAULT NULL,
    soft_skills TEXT DEFAULT NULL,
    requirements TEXT DEFAULT NULL,
    growth_potential TEXT DEFAULT NULL,
    
    created_at BIGINT(20) NOT NULL,
    updated_at BIGINT(20) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_industry (industry),
    KEY idx_category (category),
    KEY idx_location (location),
    KEY idx_job_code (job_code),
    KEY idx_company_scale (company_scale)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 五、影响评估

### 5.1 影响范围矩阵

| 模块 | 影响程度 | 工作内容 |
|------|----------|----------|
| 数据库 | 低 | 执行ALTER TABLE添加新列(非破坏性) |
| 数据导入 | 高 | 重写Excel解析逻辑，映射新字段 |
| 后端API | 中 | Jobs相关接口返回新字段，可能需要版本升级 |
| 前端展示 | 中 | 岗位详情页增加公司规模、融资状态等字段 |
| 匹配算法 | 低 | company_scale可作为新的匹配因子 |

### 5.2 风险评估

| 风险点 | 级别 | 应对措施 |
|--------|------|----------|
| 历史数据无新字段 | 低 | 新字段允许NULL，不影响历史 |
| description与job_detail混淆 | 中 | 明确字段语义，导入时正确拆分 |
| 索引膨胀 | 低 | 仅对常用查询字段建索引 |

### 5.3 兼容性考虑

- 新增字段均允许NULL，对历史数据兼容
- 原有字段名称和类型保持不变
- API层面可采用渐进式返回(检查字段是否存在)

---

## 六、实施建议

### 6.1 分阶段实施

1. **第一阶段**: 数据库迁移，添加新字段
2. **第二阶段**: 更新数据导入脚本，处理Excel解析
3. **第三阶段**: 后端API适配，返回新字段
4. **第四阶段**: 前端页面展示优化

### 6.2 数据清洗规则

| Excel字段 | 转换逻辑 |
|-----------|----------|
| 公司规模 | 标准化为: 20人以下, 20-99人, 100-299人, 300-499人, 500-999人, 1000-9999人, 10000人以上 |
| 公司类型 | 映射为: 未融资, 不需要融资, 天使轮, A轮, B轮, C轮, D轮, 已上市 |
| 更新日期 | 解析"5月19日"格式，转换为标准日期 |
| 岗位详情 | 提取纯文本作为description，保留HTML作为job_detail |

---

## 七、附录

### 7.1 Excel数据样本

```json
{
  "岗位名称": "前端开发",
  "地址": "东莞-虎门镇",
  "薪资范围": "3000-4000元",
  "公司名称": "东莞市恒亚罗斯计算机科技有限公司",
  "所属行业": "计算机软件,互联网,IT服务",
  "公司规模": "20-99人",
  "公司类型": "天使轮",
  "岗位编码": "CC668565120J40736166805",
  "岗位详情": "1.负责公司项目web前端页面的设计和开发...",
  "更新日期": "5月19日",
  "公司详情": "东莞市恒亚罗斯计算机科技有限：南极芯科技是一家...",
  "岗位来源地址": "https://www.zhaopin.com/jobdetail/..."
}
```

### 7.2 相关文件

- 数据源: `20260226105856_457.xls`
- 当前表定义: `career.go` (autoMigrate函数)
- 相关SQL: `docs/add_job_category.sql`

---

## 八、实施记录

### 8.1 已完成的代码修改

#### 1. career.go - 表结构定义
- 新增字段: job_code, company_scale, company_funding_status, company_description, source_url, update_date, job_detail, category
- company字段长度从100扩展到200
- 新增索引: idx_job_code, idx_company_scale

#### 2. career.go - 列迁移
- 为jobs表添加7个新字段的迁移SQL

#### 3. jobs_model_gen.go - 模型定义
- Jobs结构体新增8个字段
- Insert/Update方法更新字段数量

#### 4. jobs_model.go - 自定义方法
- Insert方法更新SQL

#### 5. types.go - API类型定义
- CreateJobReq: 新增9个字段
- UpdateJobReq: 新增9个字段
- JobProfile: 新增8个字段

#### 6. getjoblogic.go - 获取岗位详情
- 响应映射新增所有新字段

#### 7. createjoblogic.go - 创建岗位
- 实现完整的创建岗位逻辑

#### 8. updatejoblogic.go - 更新岗位
- 实现完整的更新岗位逻辑

#### 9. listjobslogic.go - 岗位列表
- 响应映射新增所有新字段

#### 10. 导入工具
- cmd/import-jobs/main.go - CSV导入工具
- 成功导入9954条岗位数据

#### 11. 前端 Jobs 页面增强
- types/index.ts - Job类型新增所有新字段
- pages/Jobs/index.tsx - 添加高级筛选功能:
  - 关键词搜索 (岗位名/公司/行业)
  - 行业筛选 (下拉选择)
  - 工作地点筛选 (城市)
  - 公司规模筛选
  - 薪资范围筛选 (滑块)
  - 岗位详情页展示新字段 (公司规模、融资状态、岗位职责等)