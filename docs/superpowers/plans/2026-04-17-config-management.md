# 配置文件在线管理功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现配置文件在线读取、编辑、备份和回滚功能，支持 YAML 语法验证

**Architecture:** 后端在 ops handler 中添加 4 个新接口，前端在系统监控页面（system-content）新增配置文件管理模块。使用 serde_yaml 进行 YAML 验证。

**Tech Stack:** Rust (Actix-web), serde_yaml, 前端 vanilla JS/HTML

---

## 预设快捷路径

```javascript
const QUICK_ACCESS_CONFIGS = [
    { name: "career-api.yaml", path: "/home/swordreforge/projects/high-school-worker-design/etc/career-api.yaml" },
    { name: "career-api.yaml.docker", path: "/home/swordreforge/projects/high-school-worker-design/etc/career-api.yaml.docker" }
];
```

---

## Task 1: 后端 - 添加配置管理 API 处理器

**Files:**
- Modify: `src/handlers/ops.rs` - 添加新 handler 函数
- Modify: `src/routes.rs` - 添加新路由

- [ ] **Step 1: 添加请求/响应结构体到 ops.rs**

在 `ops.rs` 顶部（imports 之后）添加：

```rust
/// 读取配置请求参数
#[derive(serde::Deserialize)]
pub struct ReadConfigQuery {
    pub path: String,
}

/// 写入配置请求体
#[derive(serde::Deserialize)]
pub struct WriteConfigRequest {
    pub path: String,
    pub content: String,
}

/// 回滚请求体
#[derive(serde::Deserialize)]
pub struct RollbackRequest {
    pub path: String,
    pub backup_filename: String,
}

/// 备份文件信息
#[derive(serde::Serialize)]
pub struct BackupInfo {
    pub filename: String,
    pub created_at: i64,
    pub size: u64,
}

/// 读取配置响应数据
#[derive(serde::Serialize)]
pub struct ReadConfigData {
    pub content: String,
    pub path: String,
    pub valid: bool,
    pub error: Option<String>,
}

/// 写入配置响应数据
#[derive(serde::Serialize)]
pub struct WriteConfigData {
    pub backup_file: String,
    pub saved_at: i64,
}

/// 回滚响应数据
#[derive(serde::Serialize)]
pub struct RollbackData {
    pub restored_from: String,
    pub restored_at: i64,
}
```

- [ ] **Step 2: 添加辅助函数 - 创建备份**

在 `ops.rs` 文件末尾添加：

```rust
/// 为配置文件创建备份
fn backup_config_file(path: &str) -> Result<String, String> {
    let file_path = std::path::Path::new(path);
    
    if !file_path.exists() {
        return Err(format!("File not found: {}", path));
    }
    
    let parent = file_path.parent().unwrap_or(std::path::Path::new("."));
    let filename = file_path.file_name()
        .and_then(|s| s.to_str())
        .unwrap_or("config.yaml");
    
    let timestamp = chrono::Local::now().format("%Y%m%d_%H%M%S");
    let backup_filename = format!("{}.backup_{}", filename, timestamp);
    let backup_path = parent.join(&backup_filename);
    
    std::fs::copy(path, &backup_path)
        .map_err(|e| format!("Failed to create backup: {}", e))?;
    
    Ok(backup_path.to_string_lossy().to_string())
}

/// 清理旧备份，保留最多 N 个版本
fn cleanup_old_backups(original_path: &str, max_versions: usize) -> Result<(), String> {
    let file_path = std::path::Path::new(original_path);
    let parent = file_path.parent().unwrap_or(std::path::Path::new("."));
    let filename = file_path.file_name()
        .and_then(|s| s.to_str())
        .unwrap_or("config.yaml");
    
    let pattern = format!("{}.backup_", filename);
    
    let mut backups: Vec<_> = std::fs::read_dir(parent)
        .map_err(|e| format!("Failed to read directory: {}", e))?
        .filter_map(|entry| entry.ok())
        .filter(|entry| {
            entry.file_name().to_string_lossy()
                .starts_with(&pattern)
        })
        .collect();
    
    if backups.len() >= max_versions {
        backups.sort_by_key(|a| std::cmp::Reverse(
            a.metadata().and_then(|m| m.modified()).ok()
        ));
        
        for backup in backups.into_iter().skip(max_versions - 1) {
            let _ = std::fs::remove_file(backup.path());
        }
    }
    
    Ok(())
}

/// 列出配置文件的备份
fn list_config_backups(path: &str) -> Result<Vec<BackupInfo>, String> {
    let file_path = std::path::Path::new(path);
    let parent = file_path.parent().unwrap_or(std::path::Path::new("."));
    let filename = file_path.file_name()
        .and_then(|s| s.to_str())
        .unwrap_or("config.yaml");
    
    let pattern = format!("{}.backup_", filename);
    
    let mut backups: Vec<_> = std::fs::read_dir(parent)
        .map_err(|e| format!("Failed to read directory: {}", e))?
        .filter_map(|entry| entry.ok())
        .filter(|entry| {
            entry.file_name().to_string_lossy()
                .starts_with(&pattern)
        })
        .collect();
    
    backups.sort_by_key(|a| std::cmp::Reverse(
        a.metadata().and_then(|m| m.modified()).ok()
    ));
    
    let result: Vec<BackupInfo> = backups
        .into_iter()
        .filter_map(|entry| {
            let metadata = entry.metadata().ok()?;
            let created_at = metadata.modified().ok()
                .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                .map(|d| d.as_secs() as i64)?;
            
            Some(BackupInfo {
                filename: entry.file_name().to_string_lossy().to_string(),
                created_at,
                size: metadata.len(),
            })
        })
        .collect();
    
    Ok(result)
}
```

- [ ] **Step 3: 添加读取配置处理器**

在 `ops.rs` 中添加：

```rust
/// 读取配置文件
pub async fn read_config(
    query: web::Query<ReadConfigQuery>,
) -> impl Responder {
    let path = &query.path;
    
    if !std::path::Path::new(path).exists() {
        return HttpResponse::NotFound().json(serde_json::json!({
            "code": 404,
            "message": "File not found",
            "data": null
        }));
    }
    
    match std::fs::read_to_string(path) {
        Ok(content) => {
            let yaml_result: Result<serde_yaml::Value, _> = serde_yaml::from_str(&content);
            let (valid, error) = match yaml_result {
                Ok(_) => (true, None),
                Err(e) => (false, Some(e.to_string())),
            };
            
            HttpResponse::Ok().json(serde_json::json!({
                "code": 200,
                "message": "success",
                "data": {
                    "content": content,
                    "path": path,
                    "valid": valid,
                    "error": error
                }
            }))
        }
        Err(e) => {
            HttpResponse::Forbidden().json(serde_json::json!({
                "code": 403,
                "message": format!("Permission denied: {}", e),
                "data": null
            }))
        }
    }
}
```

- [ ] **Step 4: 添加写入配置处理器**

在 `ops.rs` 中添加：

```rust
/// 写入配置文件
pub async fn write_config(
    req: web::Json<WriteConfigRequest>,
) -> impl Responder {
    let path = &req.path;
    
    // 验证 YAML 语法
    match serde_yaml::from_str::<serde_yaml::Value>(&req.content) {
        Ok(_) => {}
        Err(e) => {
            return HttpResponse::BadRequest().json(serde_json::json!({
                "code": 400,
                "message": format!("YAML syntax error: {}", e),
                "data": null
            }));
        }
    }
    
    // 创建备份
    let backup_path = match backup_config_file(path) {
        Ok(p) => p,
        Err(e) => {
            return HttpResponse::InternalServerError().json(serde_json::json!({
                "code": 500,
                "message": format!("Backup failed: {}", e),
                "data": null
            }));
        }
    };
    
    // 清理旧备份
    if let Err(e) = cleanup_old_backups(path, 5) {
        log::warn!("Failed to cleanup old backups: {}", e);
    }
    
    // 写入文件
    match std::fs::write(path, &req.content) {
        Ok(_) => {
            let backup_filename = std::path::Path::new(&backup_path)
                .file_name()
                .and_then(|s| s.to_str())
                .unwrap_or("backup")
                .to_string();
            
            HttpResponse::Ok().json(serde_json::json!({
                "code": 200,
                "message": "Config saved successfully",
                "data": {
                    "backup_file": backup_filename,
                    "saved_at": chrono::Utc::now().timestamp()
                }
            }))
        }
        Err(e) => {
            HttpResponse::InternalServerError().json(serde_json::json!({
                "code": 500,
                "message": format!("Write failed: {}", e),
                "data": null
            }))
        }
    }
}
```

- [ ] **Step 5: 添加列出备份处理器**

在 `ops.rs` 中添加：

```rust
/// 列出配置文件备份
pub async fn list_config_backups_handler(
    query: web::Query<ReadConfigQuery>,
) -> impl Responder {
    let path = &query.path;
    
    if !std::path::Path::new(path).exists() {
        return HttpResponse::NotFound().json(serde_json::json!({
            "code": 404,
            "message": "File not found",
            "data": null
        }));
    }
    
    match list_config_backups(path) {
        Ok(backups) => {
            HttpResponse::Ok().json(serde_json::json!({
                "code": 200,
                "message": "success",
                "data": {
                    "items": backups,
                    "total": backups.len()
                }
            }))
        }
        Err(e) => {
            HttpResponse::InternalServerError().json(serde_json::json!({
                "code": 500,
                "message": e,
                "data": null
            }))
        }
    }
}
```

- [ ] **Step 6: 添加回滚处理器**

在 `ops.rs` 中添加：

```rust
/// 回滚配置文件
pub async fn rollback_config(
    req: web::Json<RollbackRequest>,
) -> impl Responder {
    let path = &req.path;
    let backup_filename = &req.backup_filename;
    
    let file_path = std::path::Path::new(path);
    let parent = file_path.parent().unwrap_or(std::path::Path::new("."));
    let backup_path = parent.join(backup_filename);
    
    if !backup_path.exists() {
        return HttpResponse::NotFound().json(serde_json::json!({
            "code": 404,
            "message": "Backup file not found",
            "data": null
        }));
    }
    
    // 备份当前版本
    if std::path::Path::new(path).exists() {
        if let Err(e) = backup_config_file(path) {
            return HttpResponse::InternalServerError().json(serde_json::json!({
                "code": 500,
                "message": format!("Failed to backup current version: {}", e),
                "data": null
            }));
        }
        let _ = cleanup_old_backups(path, 5);
    }
    
    // 恢复备份
    match std::fs::copy(&backup_path, path) {
        Ok(_) => {
            HttpResponse::Ok().json(serde_json::json!({
                "code": 200,
                "message": "Config restored successfully",
                "data": {
                    "restored_from": backup_filename,
                    "restored_at": chrono::Utc::now().timestamp()
                }
            }))
        }
        Err(e) => {
            HttpResponse::InternalServerError().json(serde_json::json!({
                "code": 500,
                "message": format!("Restore failed: {}", e),
                "data": null
            }))
        }
    }
}
```

- [ ] **Step 7: 添加路由**

在 `src/routes.rs` 的 ops scope 中添加：

```rust
// 配置文件管理
.route("/config", web::get().to(crate::handlers::ops::read_config))
.route("/config", web::put().to(crate::handlers::ops::write_config))
.route("/config/backups", web::get().to(crate::handlers::ops::list_config_backups_handler))
.route("/config/rollback", web::post().to(crate::handlers::ops::rollback_config)),
```

- [ ] **Step 8: 确认 serde_yaml 依赖**

在 `Cargo.toml` 中确认 serde_yaml 存在。如果没有，添加后运行 `cargo fetch`

- [ ] **Step 9: 验证编译**

Run: `cargo check`
Expected: 无错误

- [ ] **Step 10: 提交**

```bash
git add src/handlers/ops.rs src/routes.rs Cargo.toml
git commit -m "feat: add config file management API handlers"
```

---

## Task 2: 前端 - 配置文件管理界面

**Files:**
- Modify: `template/index.html` - 添加配置文件管理 HTML 模板
- Modify: `template/app.js` - 添加配置文件管理 JS 逻辑
- Modify: `template/styles.css` - 添加配置文件管理样式（如需要）

- [ ] **Step 1: 在 index.html 中添加配置文件管理模块**

在 `system-content` 末尾（account-section 之后）添加：

```html
                <div class="config-section">
                    <h3>配置文件管理</h3>
                    <div class="config-quick-access">
                        <h4>快捷入口</h4>
                        <div class="config-cards">
                            <div class="config-card" onclick="openConfigEditor('/home/swordreforge/projects/high-school-worker-design/etc/career-api.yaml', 'career-api.yaml')">
                                <div class="config-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                        <polyline points="14 2 14 8 20 8"></polyline>
                                        <line x1="16" y1="13" x2="8" y2="13"></line>
                                        <line x1="16" y1="17" x2="8" y2="17"></line>
                                        <polyline points="10 9 9 9 8 9"></polyline>
                                    </svg>
                                </div>
                                <div class="config-info">
                                    <span class="config-name">career-api.yaml</span>
                                    <span class="config-path">/etc/career-api.yaml</span>
                                </div>
                            </div>
                            <div class="config-card" onclick="openConfigEditor('/home/swordreforge/projects/high-school-worker-design/etc/career-api.yaml.docker', 'career-api.yaml.docker')">
                                <div class="config-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                        <polyline points="14 2 14 8 20 8"></polyline>
                                        <line x1="16" y1="13" x2="8" y2="13"></line>
                                        <line x1="16" y1="17" x2="8" y2="17"></line>
                                        <polyline points="10 9 9 9 8 9"></polyline>
                                    </svg>
                                </div>
                                <div class="config-info">
                                    <span class="config-name">career-api.yaml.docker</span>
                                    <span class="config-path">/etc/career-api.yaml.docker</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="config-editor-section">
                        <h4>自定义路径</h4>
                        <div class="config-custom-path">
                            <input type="text" id="config-custom-path" placeholder="输入配置文件路径...">
                            <button class="btn btn-secondary" onclick="loadCustomConfig()">加载</button>
                        </div>
                    </div>
                    
                    <div id="config-editor-container" class="config-editor-container" style="display: none;">
                        <div class="config-editor-header">
                            <h4 id="config-editor-title">编辑配置文件</h4>
                            <span id="config-status" class="config-status"></span>
                        </div>
                        <div class="config-editor-wrapper">
                            <textarea id="config-editor" class="config-editor" spellcheck="false"></textarea>
                        </div>
                        <div class="config-editor-actions">
                            <div class="config-backup-selector">
                                <select id="config-backup-select">
                                    <option value="">选择备份版本...</option>
                                </select>
                                <button class="btn btn-secondary" id="rollback-config-btn" onclick="rollbackConfig()">回滚</button>
                            </div>
                            <button class="btn btn-primary" id="save-config-btn" onclick="saveConfig()" disabled>保存</button>
                        </div>
                        <div id="config-error" class="config-error"></div>
                    </div>
                </div>
```

- [ ] **Step 2: 添加配置文件管理 JS 函数**

在 `app.js` 文件末尾（`init()` 函数之前或适当位置）添加：

```javascript
// 配置文件管理状态
let configState = {
    currentPath: null,
    currentContent: null,
    hasChanges: false,
    backups: []
};

// 预设快捷配置文件
const QUICK_ACCESS_CONFIGS = [
    { name: "career-api.yaml", path: "/home/swordreforge/projects/high-school-worker-design/etc/career-api.yaml" },
    { name: "career-api.yaml.docker", path: "/home/swordreforge/projects/high-school-worker-design/etc/career-api.yaml.docker" }
];

// 打开配置文件编辑器
async function openConfigEditor(path, name) {
    configState.currentPath = path;
    configState.hasChanges = false;
    
    // 显示编辑器容器
    document.getElementById('config-editor-container').style.display = 'block';
    document.getElementById('config-editor-title').textContent = `编辑: ${name}`;
    document.getElementById('config-status').textContent = '加载中...';
    document.getElementById('config-status').className = 'config-status';
    document.getElementById('config-error').textContent = '';
    
    try {
        const response = await apiRequest(`/ops/config?path=${encodeURIComponent(path)}`);
        
        if (response.code === 200) {
            const data = response.data;
            configState.currentContent = data.content;
            
            const editor = document.getElementById('config-editor');
            editor.value = data.content;
            
            // 更新状态显示
            const statusEl = document.getElementById('config-status');
            if (data.valid) {
                statusEl.textContent = '✓ YAML 格式有效';
                statusEl.className = 'config-status valid';
            } else {
                statusEl.textContent = '✗ YAML 格式无效';
                statusEl.className = 'config-status invalid';
                document.getElementById('config-error').textContent = data.error || '未知错误';
            }
            
            // 加载备份列表
            await loadConfigBackups();
        } else {
            showToast(response.message || '加载配置文件失败', 'error');
        }
    } catch (error) {
        console.error('加载配置文件失败:', error);
        showToast('加载配置文件失败: ' + error.message, 'error');
    }
}

// 加载自定义路径配置
async function loadCustomConfig() {
    const path = document.getElementById('config-custom-path').value.trim();
    if (!path) {
        showToast('请输入配置文件路径', 'error');
        return;
    }
    
    const name = path.split('/').pop() || path;
    await openConfigEditor(path, name);
}

// 加载配置文件备份列表
async function loadConfigBackups() {
    if (!configState.currentPath) return;
    
    try {
        const response = await apiRequest(`/ops/config/backups?path=${encodeURIComponent(configState.currentPath)}`);
        
        if (response.code === 200) {
            configState.backups = response.data.items || [];
            
            const select = document.getElementById('config-backup-select');
            select.innerHTML = '<option value="">选择备份版本...</option>';
            
            configState.backups.forEach(backup => {
                const date = new Date(backup.created_at * 1000).toLocaleString('zh-CN');
                const option = document.createElement('option');
                option.value = backup.filename;
                option.textContent = `${backup.filename} (${date})`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('加载备份列表失败:', error);
    }
}

// 保存配置文件
async function saveConfig() {
    if (!configState.currentPath) return;
    
    const editor = document.getElementById('config-editor');
    const content = editor.value;
    
    if (content === configState.currentContent) {
        showToast('没有修改，无需保存', 'warning');
        return;
    }
    
    try {
        const response = await apiRequest('/ops/config', {
            method: 'PUT',
            body: JSON.stringify({
                path: configState.currentPath,
                content: content
            })
        });
        
        if (response.code === 200) {
            showToast('配置文件保存成功');
            configState.currentContent = content;
            configState.hasChanges = false;
            document.getElementById('save-config-btn').disabled = true;
            
            // 刷新备份列表
            await loadConfigBackups();
            
            // 重新验证 YAML
            await openConfigEditor(configState.currentPath, configState.currentPath.split('/').pop());
        } else {
            throw new Error(response.message || '保存失败');
        }
    } catch (error) {
        console.error('保存配置文件失败:', error);
        showToast('保存失败: ' + error.message, 'error');
    }
}

// 回滚配置文件
async function rollbackConfig() {
    if (!configState.currentPath) return;
    
    const select = document.getElementById('config-backup-select');
    const backupFilename = select.value;
    
    if (!backupFilename) {
        showToast('请选择要回滚的备份版本', 'error');
        return;
    }
    
    if (!confirm(`确定要回滚到备份版本吗？\n\n当前配置将自动备份。\n\n备份文件: ${backupFilename}`)) {
        return;
    }
    
    try {
        const response = await apiRequest('/ops/config/rollback', {
            method: 'POST',
            body: JSON.stringify({
                path: configState.currentPath,
                backup_filename: backupFilename
            })
        });
        
        if (response.code === 200) {
            showToast('回滚成功');
            
            // 重新加载
            await openConfigEditor(configState.currentPath, configState.currentPath.split('/').pop());
        } else {
            throw new Error(response.message || '回滚失败');
        }
    } catch (error) {
        console.error('回滚配置文件失败:', error);
        showToast('回滚失败: ' + error.message, 'error');
    }
}

// 监听编辑器变化
function initConfigEditorListener() {
    const editor = document.getElementById('config-editor');
    if (editor && !editor.dataset.initialized) {
        editor.addEventListener('input', () => {
            const hasChanges = editor.value !== configState.currentContent;
            configState.hasChanges = hasChanges;
            document.getElementById('save-config-btn').disabled = !hasChanges;
        });
        editor.dataset.initialized = 'true';
    }
}
```

- [ ] **Step 3: 在 init() 函数中添加编辑器监听器初始化**

在 `init()` 函数中添加：

```javascript
// 初始化配置文件编辑器
initConfigEditorListener();
```

- [ ] **Step 4: 添加样式**

在 `styles.css` 中添加配置文件管理相关样式：

```css
/* 配置文件管理样式 */
.config-section {
    margin-top: 2rem;
    padding: 1.5rem;
    background: var(--card-bg);
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.config-section h3 {
    margin: 0 0 1.5rem;
    color: var(--text-primary);
}

.config-quick-access h4,
.config-editor-section h4 {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin-bottom: 0.75rem;
}

.config-cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
}

.config-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.config-card:hover {
    border-color: var(--primary-color);
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.15);
}

.config-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--primary-color);
    color: white;
    border-radius: 8px;
}

.config-icon svg {
    width: 20px;
    height: 20px;
}

.config-info {
    display: flex;
    flex-direction: column;
}

.config-name {
    font-weight: 600;
    color: var(--text-primary);
}

.config-path {
    font-size: 0.75rem;
    color: var(--text-secondary);
}

.config-custom-path {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
}

.config-custom-path input {
    flex: 1;
    padding: 0.625rem 1rem;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background: var(--bg-primary);
    color: var(--text-primary);
    font-family: monospace;
    font-size: 0.875rem;
}

.config-editor-container {
    border: 1px solid var(--border-color);
    border-radius: 8px;
    overflow: hidden;
}

.config-editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border-color);
}

.config-editor-header h4 {
    margin: 0;
    font-size: 0.875rem;
}

.config-status {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
}

.config-status.valid {
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
}

.config-status.invalid {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
}

.config-editor-wrapper {
    background: #1e1e1e;
}

.config-editor {
    width: 100%;
    min-height: 400px;
    padding: 1rem;
    background: #1e1e1e;
    color: #d4d4d4;
    border: none;
    resize: vertical;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 0.875rem;
    line-height: 1.5;
}

.config-editor:focus {
    outline: none;
}

.config-editor-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background: var(--bg-secondary);
    border-top: 1px solid var(--border-color);
}

.config-backup-selector {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}

.config-backup-selector select {
    padding: 0.5rem;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background: var(--bg-primary);
    color: var(--text-primary);
    font-size: 0.875rem;
    min-width: 200px;
}

.config-error {
    padding: 0.75rem 1rem;
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    font-size: 0.75rem;
    font-family: monospace;
    white-space: pre-wrap;
    word-break: break-all;
}
```

- [ ] **Step 5: 验证前端**

检查 HTML/JS 语法

- [ ] **Step 6: 提交**

```bash
git add template/index.html template/app.js template/styles.css
git commit -m "feat: add config file management UI"
```

---

## Task 3: 验证与测试

- [ ] **Step 1: 启动后端服务**

```bash
cargo run
```

- [ ] **Step 2: 测试 API**

```bash
# 测试读取配置
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8088/api/v1/ops/config?path=/home/swordreforge/projects/high-school-worker-design/etc/career-api.yaml"

# 测试写入配置（需要 YAML 格式正确）
curl -X PUT -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"path": "/tmp/test.yaml", "content": "test: value"}' \
  "http://localhost:8088/api/v1/ops/config"
```

- [ ] **Step 3: 测试前端**

登录后台 → 进入系统监控 → 测试配置文件管理模块

- [ ] **Step 4: 提交最终代码**

```bash
git add -A
git commit -m "feat: complete config file online management feature"
```
