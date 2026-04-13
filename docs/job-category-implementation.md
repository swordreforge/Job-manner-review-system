# 岗位分类功能实现方案

## 背景

当前 `/jobs` 页面有技术研发、产品设计、运营、销售四个分类标签，但这些标签对下拉菜单展示的结果没有影响。本文档说明如何实现分类过滤功能。

## 问题分析

### 当前状态
- 前端有四个分类标签：技术研发、产品设计、运营、销售
- `activeCategory` 状态会随点击更新，但没有被使用
- 下拉菜单显示所有岗位，没有根据分类过滤
- API 调用只传递分页参数，没有传递分类参数

### 根本原因
1. 数据库 `jobs` 表缺少 `category` 字段
2. API 定义缺少 `category` 参数
3. Model 层查询逻辑不支持分类过滤
4. 前端调用 API 时没有传递 `category` 参数

## 实现方案

### 1. 数据库层面

#### 添加 category 字段
```sql
ALTER TABLE `jobs`
ADD COLUMN `category` VARCHAR(20) DEFAULT NULL
COMMENT '岗位分类：tech-技术研发, design-产品设计, ops-运营, sales-销售'
AFTER `industry`;
```

#### 添加索引
```sql
CREATE INDEX `idx_category` ON `jobs` (`category`);
```

#### 分类取值定义
- `tech` - 技术研发
- `design` - 产品设计
- `ops` - 运营
- `sales` - 销售

### 2. API 定义层面

**文件**: `api/job.api`

在 `JobListReq` 中添加 `category` 参数：

```go
type JobListReq {
	Page     int    `form:"page" default:"1" validate:"omitempty,min=1"`
	PageSize int    `form:"pageSize" default:"10" validate:"omitempty,min=1,max=100"`
	Industry string `form:"industry,optional"`
	Name     string `form:"name,optional"`
	Category string `form:"category,optional"`  // 新增
}
```

### 3. Model 层面

**文件**: `internal/model/jobs_model.go`

修改 `FindAll` 方法签名和实现：

```go
// FindAll 分页查询职位列表，支持按 industry 和 category 过滤
func (m *customJobsModel) FindAll(ctx context.Context, page, pageSize int, industry, category string) ([]*Jobs, int64, error) {
	// 构建查询条件
	conditions := []string{}
	args := []interface{}{}

	if industry != "" {
		conditions = append(conditions, "`industry` = ?")
		args = append(args, industry)
	}

	if category != "" {
		conditions = append(conditions, "`category` = ?")
		args = append(args, category)
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = "where " + strings.Join(conditions, " and ")
	}

	// 查询总数
	countQuery := fmt.Sprintf("select count(*) from %s %s", m.table, whereClause)
	var total int64
	err := m.conn.QueryRowCtx(ctx, &total, countQuery, args...)
	if err != nil {
		return nil, 0, err
	}

	// 查询数据
	offset := (page - 1) * pageSize
	query := fmt.Sprintf("select %s from %s %s order by `created_at` desc limit ? offset ?", jobsRows, m.table, whereClause)
	args = append(args, pageSize, offset)

	var resp []*Jobs
	err = m.conn.QueryRowsCtx(ctx, &resp, query, args...)
	if err != nil {
		return nil, 0, err
	}

	return resp, total, nil
}
```

### 4. Logic/Handler 层面

**文件**: `internal/logic/jobs_logic.go`

修改查询逻辑，传递 `category` 参数：

```go
func (l *JobsLogic) ListJobs(req *types.JobListReq) (resp *types.JobListResultResp, err error) {
	// 调用 Model 层，传递 category 参数
	jobs, total, err := l.svcCtx.JobsModel.FindAll(l.ctx, req.Page, req.PageSize, req.Industry, req.Category)
	if err != nil {
		return nil, err
	}

	return &types.JobListResultResp{
		Code: 0,
		Msg:  "success",
		Data: &types.JobListResp{
			Total: total,
			List:  convertJobsToProfiles(jobs),
		},
	}, nil
}
```

### 5. 前端层面

**文件**: `high-school-worker-design-forend/src/pages/Jobs/index.tsx`

修改 API 调用，传递 `category` 参数：

```typescript
const loadJobs = async () => {
  try {
    setLoading(true);
    const response = await jobApi.list({
      page: 1,
      pageSize: 100,
      category: activeCategory,  // 传递当前选中的分类
    });
    if (response.data?.list) {
      setJobs(response.data.list);
    }
  } catch (error) {
    console.error('获取岗位列表失败:', error);
    message.error('获取岗位列表失败');
  } finally {
    setLoading(false);
  }
};

// 当 activeCategory 变化时重新加载岗位列表
useEffect(() => {
  void loadJobs();
}, [activeCategory]);
```

## 数据迁移

为现有岗位数据设置分类：

```sql
-- 技术研发类岗位
UPDATE `jobs` SET `category` = 'tech'
WHERE `name` LIKE '%开发%' OR `name` LIKE '%工程师%' OR `name` LIKE '%程序员%'
   OR `name` LIKE '%架构%' OR `name` LIKE '%测试%' OR `name` LIKE '%运维%'
   OR `name` LIKE '%前端%' OR `name` LIKE '%后端%' OR `name` LIKE '%算法%'
   OR `name` LIKE '%数据%';

-- 产品设计类岗位
UPDATE `jobs` SET `category` = 'design'
WHERE `name` LIKE '%产品%' OR `name` LIKE '%设计%' OR `name` LIKE '%UI%'
   OR `name` LIKE '%UX%' OR `name` LIKE '%交互%';

-- 运营类岗位
UPDATE `jobs` SET `category` = 'ops'
WHERE `name` LIKE '%运营%' OR `name` LIKE '%市场%' OR `name` LIKE '%推广%'
   OR `name` LIKE '%品牌%' OR `name` LIKE '%活动%';

-- 销售类岗位
UPDATE `jobs` SET `category` = 'sales'
WHERE `name` LIKE '%销售%' OR `name` LIKE '%商务%' OR `name` LIKE '%客户%'
   OR `name` LIKE '%渠道%' OR `name` LIKE '%大客户%';
```

## 实施步骤

1. **数据库修改**
   - 执行 ALTER TABLE 添加 `category` 字段
   - 执行 CREATE INDEX 添加索引
   - 执行 UPDATE 更新现有数据

2. **后端代码修改**
   - 修改 `api/job.api` 添加参数定义
   - 重新生成代码（如使用 goctl）
   - 修改 `internal/model/jobs_model.go` 修改查询逻辑
   - 修改 Logic/Handler 层传递参数
   - 编译并部署后端服务

3. **前端代码修改**
   - 修改 `loadJobs` 函数传递 `category` 参数
   - 添加 `useEffect` 监听 `activeCategory` 变化
   - 测试验证

4. **测试验证**
   - 点击不同分类标签，确认下拉菜单只显示对应分类的岗位
   - 测试分页功能是否正常
   - 测试岗位详情查看功能是否正常

## 注意事项

1. **兼容性**：`category` 字段设置为可空，不影响现有功能
2. **性能**：添加索引后查询性能不受影响
3. **数据完整性**：建议后续创建或导入岗位时必填 `category` 字段
4. **前端体验**：切换分类时需要清空当前选中的岗位