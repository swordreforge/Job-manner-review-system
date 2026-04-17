# 配置文件在线管理功能规格

## 概述

允许用户通过后台管理界面在线读取、编辑、备份和回滚任意路径的 YAML 配置文件。

## 目标配置文件

预设快捷入口指向：
- `/home/swordreforge/projects/high-school-worker-design/etc/career-api.yaml`
- `/home/swordreforge/projects/high-school-worker-design/etc/career-api.yaml.docker`

## 功能需求

### 1. 文件读取
- 支持任意路径的文件读取
- 读取前校验文件存在性和可读权限
- 返回文件内容供前端展示

### 2. YAML 语法验证
- 读取时验证 YAML 语法有效性
- 编辑保存前验证 YAML 语法有效性
- 无效时返回具体语法错误信息

### 3. 文件写入
- 支持任意路径的文件写入
- 写入前自动创建备份
- 写入后返回成功/失败状态

### 4. 自动备份机制
- 备份文件名格式：`原文件名.backup_YYYYMMDD_HHMMSS`
- 同一文件最多保留 5 个备份版本
- 超出时自动删除最早的备份

### 5. 回滚功能
- 列出指定文件的所有备份版本
- 支持恢复到任意历史版本
- 恢复前自动备份当前版本

## API 接口

### 读取配置文件
```
GET /api/v1/ops/config?path=xxx
Response: { code, message, data: { content, path, valid } }
```

### 更新配置文件
```
PUT /api/v1/ops/config
Body: { path, content }
Response: { code, message, data: { backup_file, saved_at } }
```

### 列出备份
```
GET /api/v1/ops/config/backups?path=xxx
Response: { code, message, data: { items: [{ filename, created_at, size }] } }
```

### 回滚
```
POST /api/v1/ops/config/rollback
Body: { path, backup_filename }
Response: { code, message, data: { restored_from, restored_at } }
```

## 前端界面

### 运维面板布局
- 新增"配置文件管理"标签页/路由
- 快捷入口区：两个配置文件的快捷卡片
- 编辑区：路径输入框 + 内容编辑器 + 操作按钮

### 快捷卡片
- 显示配置文件名和路径
- 点击打开编辑器加载对应文件

### 编辑器
- 文本域（monospace 字体）
- YAML 语法验证状态提示
- 保存按钮（disabled 直到有修改）
- 备份历史下拉列表 + 回滚按钮

### 状态提示
- 保存成功/失败提示
- YAML 语法错误高亮/提示
- 备份/回滚成功提示

## 错误处理

| 场景 | 返回码 | 消息 |
|------|--------|------|
| 文件不存在 | 404 | File not found |
| 无权限读取 | 403 | Permission denied |
| 无权限写入 | 403 | Permission denied |
| YAML 语法错误 | 400 | YAML syntax error: xxx |
| 备份失败 | 500 | Backup failed: xxx |
| 写入失败 | 500 | Write failed: xxx |

## 安全考虑

- 仅允许已认证用户访问（已有 AuthMiddleware）
- 限制可访问的目录范围（可选：限制在项目目录下）
- 记录操作日志

## 依赖

- serde_yaml: YAML 解析和序列化
- 现有 backup_database 逻辑可复用
