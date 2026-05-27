# 任务队列监控

任务队列页面展示系统中所有异步 AI 任务的执行状态，帮助管理员了解系统运行情况。

## 任务类型

| 类型                         | 说明         | 优先级 |
| ---------------------------- | ------------ | ------ |
| `DATA_CLEAN`                 | 岗位数据清洗 | 普通   |
| `PROFILE_GENERATE`           | 岗位画像生成 | 普通   |
| `GRAPH_BUILD`                | 岗位图谱构建 | 普通   |
| `RESUME_PARSE`               | 简历解析     | 高     |
| `STUDENT_PROFILE_FROM_INPUT` | 手动画像生成 | 高     |
| `MATCH_ANALYZE`              | 人岗匹配分析 | 高     |
| `REPORT_GENERATE`            | 报告生成     | 普通   |
| `REPORT_POLISH`              | 报告润色     | 普通   |

## 任务状态

- ⏳ **PENDING** — 已入队等待执行
- ▶️ **RUNNING** — 正在执行中
- ✅ **COMPLETED** — 执行成功
- ❌ **FAILED** — 执行失败

## 数据管道

岗位数据上传后会触发三阶段级联任务：

```
DATA_CLEAN → PROFILE_GENERATE → GRAPH_BUILD
```

每个阶段完成后自动触发下一阶段，无需手动干预。

## 注意事项

- 高优先级任务（用户操作触发）会优先于普通任务执行
- AI Worker 池有并发上限，高负载时任务可能排队等待
- 失败的任务可以查看错误详情以便排查问题
