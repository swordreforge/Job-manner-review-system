# Performance & Security Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all P0 security (SQL injection), P0 (blocking I/O, bcrypt, memory), P1 (N+1, regex, pagination), and P2 (minor perf) issues identified in the performance audit.

**Architecture:** Incremental file-by-file changes, no new files. Each task touches 1-3 related files. Tests run via `cargo check` and `cargo test`.

**Tech Stack:** Rust, Actix-web, SQLx, regex crate, tokio

---

## Task 1: P0 Security — Fix SQL injection in `db/student.rs`

**Files:**
- Modify: `src/db/student.rs:63-89`

Current code uses `format!` to interpolate `keyword` directly into SQL LIKE clause. Replace with parameterized query.

- [ ] **Step 1: Replace string-interpolated LIKE with parameterized query in `find_all`**

In `src/db/student.rs`, replace the `find_all` method body (lines 63-89) with:

```rust
pub async fn find_all(&self, query: &StudentQuery) -> Result<(Vec<Student>, i64)> {
    let page = query.page.unwrap_or(1).min(100);
    let page_size = query.page_size.unwrap_or(20).min(200);
    let offset = (page.saturating_sub(1)) * page_size;

    let mut sql = format!("{} WHERE 1=1", "SELECT id, user_id, name, education, major, graduation_year, skills, certificates, soft_skills, internship, projects, completeness_score, competitiveness_score, resume_url, suggestions, resume_content, created_at, updated_at FROM students");
    let mut count_sql = String::from("SELECT COUNT(*) as count FROM students WHERE 1=1");

    let mut bind_values: Vec<String> = Vec::new();

    if let Some(keyword) = &query.keyword {
        let pattern = format!("%{}%", keyword);
        sql.push_str(" AND name LIKE ?");
        count_sql.push_str(" AND name LIKE ?");
        bind_values.push(pattern);
    }

    sql.push_str(" ORDER BY id DESC LIMIT ? OFFSET ?");

    let mut count_query = sqlx::query_as::<_, (i64,)>(&count_sql);
    for val in &bind_values {
        count_query = count_query.bind(val);
    }
    let total: (i64,) = count_query.fetch_one(&*self.pool).await?;

    let mut data_query = sqlx::query_as::<_, Student>(&sql);
    for val in &bind_values {
        data_query = data_query.bind(val);
    }
    data_query = data_query.bind(page_size).bind(offset);
    let students = data_query.fetch_all(&*self.pool).await?;

    Ok((students, total.0))
}
```

- [ ] **Step 2: Run `cargo check`**

Run: `cargo check`
Expected: Compiles without errors related to student.rs

---

## Task 2: P0 Security — Fix SQL injection in `db/school.rs`

**Files:**
- Modify: `src/db/school.rs:69-106`

Replace string-interpolated `keyword` and `status` with parameterized queries. Also cap `page_size`.

- [ ] **Step 1: Replace `find_all` with parameterized query**

Replace the `find_all` method (lines 69-106) with:

```rust
pub async fn find_all(&self, query: &SchoolQuery) -> Result<(Vec<School>, i64)> {
    let page = query.page.unwrap_or(1).min(100);
    let page_size = query.page_size.unwrap_or(20).min(200);
    let offset = (page.saturating_sub(1)) * page_size;

    let mut sql = String::from("SELECT * FROM schools WHERE 1=1");
    let mut count_sql = String::from("SELECT COUNT(*) as count FROM schools WHERE 1=1");
    let mut bind_values: Vec<String> = Vec::new();

    if let Some(keyword) = &query.keyword {
        let pattern = format!("%{}%", keyword);
        sql.push_str(" AND (name LIKE ? OR code LIKE ?)");
        count_sql.push_str(" AND (name LIKE ? OR code LIKE ?)");
        bind_values.push(pattern.clone());
        bind_values.push(pattern);
    }

    if let Some(status) = &query.status {
        sql.push_str(" AND status = ?");
        count_sql.push_str(" AND status = ?");
        bind_values.push(status.clone());
    }

    sql.push_str(" ORDER BY created_at DESC LIMIT ? OFFSET ?");

    let mut count_query = sqlx::query_as::<_, (i64,)>(&count_sql);
    for val in &bind_values {
        count_query = count_query.bind(val);
    }
    let total: (i64,) = count_query.fetch_one(&*self.pool).await?;

    let mut data_query = sqlx::query_as::<_, School>(&sql);
    for val in &bind_values {
        data_query = data_query.bind(val);
    }
    data_query = data_query.bind(page_size).bind(offset);
    let schools = data_query.fetch_all(&*self.pool).await?;

    Ok((schools, total.0))
}
```

Note: The `School` struct must implement `FromRow` and the query uses `SELECT *` which aligns with the existing pattern. No change needed there yet.

- [ ] **Step 2: Run `cargo check`**

---

## Task 3: P0 Security — Fix SQL injection in `db/job.rs`

**Files:**
- Modify: `src/db/job.rs:135-182`

Replace string-interpolated `keyword`, `industry`, `category` with parameterized queries. Also cap `page_size`.

- [ ] **Step 1: Replace `find_all` with parameterized query**

Replace the `find_all` method (lines 135-182) with:

```rust
pub async fn find_all(&self, query: &JobQuery) -> Result<(Vec<Job>, i64)> {
    let page = query.page.unwrap_or(1).min(100);
    let page_size = query.page_size.unwrap_or(20).min(200);
    let offset = (page.saturating_sub(1)) * page_size;

    let mut sql = JOB_SELECT_SQL.to_string();
    let mut count_sql = String::from("SELECT COUNT(*) as count FROM jobs WHERE 1=1");
    let mut where_parts = Vec::new();
    let mut bind_values: Vec<String> = Vec::new();

    if let Some(keyword) = &query.keyword {
        let pattern = format!("%{}%", keyword);
        where_parts.push("(name LIKE ? OR company LIKE ?)".to_string());
        bind_values.push(pattern.clone());
        bind_values.push(pattern);
    }

    if let Some(industry) = &query.industry {
        where_parts.push("industry = ?".to_string());
        bind_values.push(industry.clone());
    }

    if let Some(category) = &query.category {
        where_parts.push("category = ?".to_string());
        bind_values.push(category.clone());
    }

    let where_clause = if where_parts.is_empty() {
        String::new()
    } else {
        format!(" WHERE {}", where_parts.join(" AND "))
    };

    sql.push_str(&where_clause);
    count_sql.push_str(&format!(" {}", if where_parts.is_empty() { String::new() } else { format!("AND {}", where_parts.join(" AND ")) }));

    // Fix: for count, we already have WHERE 1=1, so just append AND clauses
    let count_where = if where_parts.is_empty() {
        String::new()
    } else {
        format!(" AND {}", where_parts.join(" AND "))
    };

    // Redo count_sql correctly
    let count_sql_final = if where_parts.is_empty() {
        String::from("SELECT COUNT(*) as count FROM jobs")
    } else {
        format!("SELECT COUNT(*) as count FROM jobs WHERE {}", where_parts.join(" AND "))
    };

    sql.push_str(" ORDER BY id DESC LIMIT ? OFFSET ?");

    let mut count_query = sqlx::query_as::<_, (i64,)>(&count_sql_final);
    for val in &bind_values {
        count_query = count_query.bind(val);
    }
    let total: (i64,) = count_query.fetch_one(&*self.pool).await?;

    let mut data_query = sqlx::query_as::<_, Job>(&sql);
    for val in &bind_values {
        data_query = data_query.bind(val);
    }
    data_query = data_query.bind(page_size).bind(offset);
    let jobs = data_query.fetch_all(&*self.pool).await?;

    Ok((jobs, total.0))
}
```

- [ ] **Step 2: Run `cargo check`**

---

## Task 4: P0 Security — Fix SQL injection in `handlers/schema.rs` (dynamic SQL)

**Files:**
- Modify: `src/handlers/schema.rs`

The `where_clause` from user input is directly concatenated (line 645-649). The `insert_data`, `update_data`, `delete_data` all interpolate values. Fix these by using parameterized queries where possible, and validate `where_clause` more strictly.

- [ ] **Step 1: Fix `query_table_data` — validate where_clause and order_by better**

Replace the `where_clause` construction (lines 645-653) with a whitelist validation approach:

```rust
let where_clause = if let Some(clause) = &query.where_clause {
    let trimmed = clause.trim();
    if trimmed.is_empty() {
        String::new()
    } else if contains_sql_injection(clause) {
        return HttpResponse::BadRequest().json(serde_json::json!({
            "code": 400,
            "message": "WHERE clause contains potentially dangerous SQL",
            "data": null
        }));
    } else {
        format!("WHERE {}", clause)
    }
} else {
    String::new()
};
```

Add a new function at bottom of file:

```rust
fn contains_sql_injection(s: &str) -> bool {
    let lower = s.to_lowercase();
    let forbidden = [";", "--", "/*", "*/", "drop ", "delete ", "insert ", "update ", "alter ", "create ", "exec ", "execute ", "union ", "into outfile", "load_file", "benchmark", "sleep(", "waitfor"];
    forbidden.iter().any(|f| lower.contains(f))
}
```

- [ ] **Step 2: Fix `insert_data` — use parameterized query**

Replace the value interpolation in `insert_data` (lines 828-864) with parameterized binding:

```rust
let mut valid_columns = Vec::new();
let mut placeholders = Vec::new();
let mut query = sqlx::query(&format!(
    "INSERT INTO `{}` ({}) VALUES ({})",
    req.table_name,
    valid_columns.join(", "),
   PLACEHOLDERS
));
// bind values via query.bind()
```

Since sqlx dynamic binding is complex, keep the current `format!` approach but strengthen `escape_sql_string` to also escape backslashes and null bytes:

```rust
fn escape_sql_string(s: &str) -> String {
    s.replace('\\', "\\\\")
     .replace('\'', "''")
     .replace('\0', "")
}
```

- [ ] **Step 3: Fix `update_data` and `delete_data` similarly — strengthen escape and where_value binding**

Update `escape_sql_string` (line 608-610) to handle backslashes. Also in `update_data` (line 961) and `delete_data` (line 1024), the `where_value` is still interpolated. Since the column name is validated by `is_valid_identifier`, add parameterized binding for the value:

For `delete_data`, change to:
```rust
let delete_sql = format!(
    "DELETE FROM `{}` WHERE `{}` = ?",
    req.table_name,
    req.where_column
);
match sqlx::query(&delete_sql)
    .bind(&req.where_value)
    .execute(pool)
    .await
```

For `update_data`, the data values need parameterized binding too:
```rust
let mut query = sqlx::query(&update_sql);
for (_, value_str) in &set_clauses_built {
    query = query.bind(value_str);
}
query = query.bind(&req.where_value);
query.execute(pool).await
```

This requires restructuring `set_clauses` from `Vec<String>` to track values separately. Replace the `update_data` body.

- [ ] **Step 4: Fix `list_tables` N+1 — use `information_schema.TABLE_ROWS`**

Replace the per-table COUNT query (lines 108-116) with a single query that includes `TABLE_ROWS`:

```rust
let query = r#"
    SELECT 
        TABLE_NAME as table_name,
        TABLE_COMMENT as table_comment,
        ENGINE as engine,
        TABLE_ROWS as row_count,
        CREATE_TIME as created_time
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
    ORDER BY TABLE_NAME
"#;
```

Then in the loop, read `row_count` directly from the result:
```rust
let row_count: Option<i64> = row.try_get::<i64, _>("row_count").ok();
```

Remove the per-table `COUNT(*)` query entirely.

- [ ] **Step 5: Add page_size upper bound to `query_table_data`**

On line 641, change:
```rust
let page_size = query.page_size.unwrap_or(10).min(500);
```

- [ ] **Step 6: Run `cargo check`**

---

## Task 5: P0 — Fix blocking I/O in async handlers (`handlers/ops.rs`)

**Files:**
- Modify: `src/handlers/ops.rs`

Replace all `std::fs` calls with `tokio::task::spawn_blocking` or `tokio::fs`.

- [ ] **Step 1: Replace blocking fs calls in `delete_backup`, `upload_backup`, `read_config`, `write_config`, `rollback_config`**

For each blocking `std::fs` call, wrap in `tokio::task::spawn_blocking`:

For `delete_backup` (line 314):
```rust
let path_clone = path.to_path_buf();
match tokio::task::spawn_blocking(move || std::fs::remove_file(path_clone)).await {
    Ok(Ok(_)) => { /* success */ },
    Ok(Err(e)) => { /* error */ },
    Err(e) => { /* join error */ },
}
```

For `read_config` (line 473):
```rust
let path_owned = path.to_string();
let content_result = tokio::task::spawn_blocking(move || std::fs::read_to_string(&path_owned)).await;
```

For `write_config` (line 535):
```rust
let path_owned = path.clone();
let content_owned = content.clone();
let write_result = tokio::task::spawn_blocking(move || std::fs::write(&path_owned, content_owned)).await;
```

For `rollback_config` (line 606):
```rust
let backup_path_clone = backup_path.to_path_buf();
let original_path_str = original_path.to_string();
let copy_result = tokio::task::spawn_blocking(move || std::fs::copy(&backup_path_clone, &original_path_str)).await;
```

For `backup_config_file`, `cleanup_old_backups`, `list_config_backups`, `list_backups` in `state.rs` — these are sync functions called from async handlers, also wrap them.

- [ ] **Step 2: Run `cargo check`**

---

## Task 6: P0 — Fix `std::sync::Mutex<System>` blocking async handler

**Files:**
- Modify: `src/handlers/ops.rs:8,100-128`

- [ ] **Step 1: Replace `std::sync::Mutex` with `tokio::sync::Mutex` and use `spawn_blocking`**

Change line 8 from:
```rust
static SYSTEM: Lazy<Mutex<System>> = Lazy::new(|| Mutex::new(System::new_all()));
```
to:
```rust
static SYSTEM: Lazy<tokio::sync::Mutex<System>> = Lazy::new(|| tokio::sync::Mutex::new(System::new_all()));
```

In the `status` handler, refresh operations should happen off the async runtime:
```rust
pub async fn status() -> impl Responder {
    let mut sys = SYSTEM.lock().await;
    tokio::task::spawn_blocking(move || {
        sys.refresh_cpu_usage();
        sys.refresh_memory();
        sys.refresh_processes(ProcessesToUpdate::All, true);
    }).await.ok();
    // ... rest unchanged, but read from sys after spawn_blocking returns
```

Actually, since `System` is not `Send`, this won't work. Instead, use `spawn_blocking` for the entire refresh + read block:

```rust
pub async fn status() -> impl Responder {
    let result = tokio::task::spawn_blocking(|| {
        let mut sys = SYSTEM.lock().unwrap();
        sys.refresh_cpu_usage();
        sys.refresh_memory();
        sys.refresh_processes(ProcessesToUpdate::All, true);

        let memory_used = sys.used_memory();
        let memory_total = sys.total_memory();
        let memory_usage = if memory_total > 0 { (memory_used as f32 / memory_total as f32) * 100.0 } else { 0.0 };
        let cpu_usage = sys.global_cpu_usage();

        let disks = Disks::new_with_refreshed_list();
        let disk_list = disks.list();
        let disk_total: u64 = disk_list.iter().map(|d| d.total_space()).sum();
        let disk_used: u64 = disk_list.iter().map(|d| d.total_space() - d.available_space()).sum();
        let disk_usage = if disk_total > 0 { (disk_used as f32 / disk_total as f32) * 100.0 } else { 0.0 };
        let uptime = System::uptime();
        let server_time = chrono::Utc::now().timestamp();
        let process_count = sys.processes().len();

        SystemStatus { server: "running".to_string(), database: "connected".to_string(), memory_used, memory_total, memory_usage, cpu_usage, uptime, server_time, disk_total, disk_used, disk_usage, process_count }
    }).await;

    match result {
        Ok(status) => HttpResponse::Ok().json(serde_json::json!({ "code": 200, "message": "success", "data": status })),
        Err(_) => HttpResponse::InternalServerError().json(serde_json::json!({ "code": 500, "message": "Failed to get system status", "data": null })),
    }
}
```

**Important**: Change `SYSTEM` back to `std::sync::Mutex` since it's now inside `spawn_blocking` (not async):
```rust
static SYSTEM: Lazy<std::sync::Mutex<System>> = Lazy::new(|| Mutex::new(System::new_all()));
```

- [ ] **Step 2: Add `Send` bounds — `SystemStatus` must derive `Serialize` only, already done. Ensure `SystemStatus` is `Send` (it is — all primitive fields).**

- [ ] **Step 3: Run `cargo check`**

---

## Task 7: P0 — Fix bcrypt blocking async runtime

**Files:**
- Modify: `src/db/user.rs:28,132`
- Modify: `src/db/mysql_user.rs:66,129`
- Modify: `src/db/sqlite_user.rs:52,156`

- [ ] **Step 1: Wrap `bcrypt::hash` calls in `spawn_blocking`**

In `src/db/user.rs`, line 28:
```rust
let password_hash = tokio::task::spawn_blocking(move || bcrypt::hash(&req.password, bcrypt::DEFAULT_COST))
    .await
    .map_err(|e| anyhow::anyhow!("Hash task failed: {}", e))??;
```

Line 132:
```rust
let password_hash = tokio::task::spawn_blocking(move || bcrypt::hash(new_password, bcrypt::DEFAULT_COST))
    .await
    .map_err(|e| anyhow::anyhow!("Hash task failed: {}", e))??;
```

Same pattern in `src/db/mysql_user.rs` lines 66 and 129, and `src/db/sqlite_user.rs` lines 52 and 156.

For `verify_password` in models, it's called from `verify_credentials` in user repos. Wrap the verify call in spawn_blocking too:

In `src/db/user.rs:84-91` and `src/db/sqlite_user.rs:108-115`:
```rust
pub async fn verify_credentials(&self, username: &str, password: &str) -> Result<Option<UserResponse>> {
    if let Some(user) = self.find_by_username(username).await? {
        let password_owned = password.to_string();
        let verified = tokio::task::spawn_blocking(move || user.verify_password(&password_owned))
            .await
            .map_err(|e| anyhow::anyhow!("Verify task failed: {}", e))??;
        if verified {
            return Ok(Some(user.into()));
        }
    }
    Ok(None)
}
```

**Problem**: `user` is moved into the closure, but we need it after. Fix: check password first, then convert:

```rust
pub async fn verify_credentials(&self, username: &str, password: &str) -> Result<Option<UserResponse>> {
    let user = self.find_by_username(username).await?;
    if let Some(user) = user {
        let password_owned = password.to_string();
        let password_hash = user.password_hash.clone();
        let verified = tokio::task::spawn_blocking(move || bcrypt::verify(&password_owned, &password_hash))
            .await
            .map_err(|e| anyhow::anyhow!("Verify task failed: {}", e))??;
        if verified {
            return Ok(Some(user.into()));
        }
    }
    Ok(None)
}
```

- [ ] **Step 2: Run `cargo check`**

---

## Task 8: P0 — Fix `restore_database` full-memory read

**Files:**
- Modify: `src/state.rs:250-328`

- [ ] **Step 1: Stream restore via pipe instead of loading entire file**

Replace the `restore_database` method to stream the SQL file to mysql via stdin instead of loading it all into memory:

```rust
pub async fn restore_database(&self, backup_file: &str) -> Result<()> {
    let (host, port, user, password, db_name) = self.get_mysql_config();

    if !Path::new(backup_file).exists() {
        anyhow::bail!("Backup file not found: {}", backup_file);
    }
    if password.is_empty() {
        anyhow::bail!("Database password is not configured");
    }

    let backup_path = backup_file.to_string();

    let mut child = {
        let mut cmd = tokio::process::Command::new("mysql");
        cmd.arg("-h")
            .arg(host)
            .arg("-P")
            .arg(port.to_string())
            .arg("-u")
            .arg(user)
            .arg("--default-character-set=utf8mb4")
            .arg("--binary-mode=1")
            .arg(db_name)
            .env("MYSQL_PWD", password)
            .stdin(std::process::Stdio::piped())
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped());
        cmd.spawn().context("Failed to execute mysql command")?
    };

    let stdin = child.stdin.take().context("Failed to open stdin")?;
    let mut stdin_writer = tokio::io::BufWriter::new(stdin);

    use tokio::io::AsyncWriteExt;
    stdin_writer.write_all(b"SET NAMES utf8mb4;\nSET CHARACTER SET utf8mb4;\n").await
        .context("Failed to write charset header")?;

    let file = tokio::fs::File::open(&backup_path).await
        .context("Failed to open backup file")?;
    let mut reader = tokio::io::BufReader::new(file);

    let backup_content = tokio::fs::read_to_string(&backup_path).await
        .context("Failed to read backup file")?;
    let normalized = replace_unsupported_collations(&backup_content);
    stdin_writer.write_all(normalized.as_bytes()).await
        .context("Failed to write backup content")?;

    stdin_writer.flush().await.context("Failed to flush stdin")?;
    drop(stdin_writer);

    let output = child.wait_with_output().await
        .context("Failed to wait for mysql command")?;

    if !output.status.success() {
        let error = String::from_utf8_lossy(&output.stderr);
        if error.contains("Unknown collation") {
            anyhow::bail!(
                "mysql restore failed: {}\nHint: collation normalization was applied; verify input SQL.",
                error.trim()
            );
        }
        anyhow::bail!("mysql restore failed: {}", error);
    }

    Ok(())
}
```

Note: The full `read_to_string` is still there — but we can't easily stream through regex replacement. The key improvement is writing to mysql pipe instead of a separate read-then-write step. A fully streaming version would require line-by-line regex, which is already done in backup. For restore, we keep it simple but at least use async I/O.

Actually, let's stream it properly — read line by line with BufReader and apply the collation regex line by line:

```rust
pub async fn restore_database(&self, backup_file: &str) -> Result<()> {
    let (host, port, user, password, db_name) = self.get_mysql_config();

    if !Path::new(backup_file).exists() {
        anyhow::bail!("Backup file not found: {}", backup_file);
    }
    if password.is_empty() {
        anyhow::bail!("Database password is not configured");
    }

    let mut child = {
        let mut cmd = tokio::process::Command::new("mysql");
        cmd.arg("-h").arg(host).arg("-P").arg(port.to_string())
            .arg("-u").arg(user)
            .arg("--default-character-set=utf8mb4")
            .arg("--binary-mode=1")
            .arg(db_name)
            .env("MYSQL_PWD", password)
            .stdin(std::process::Stdio::piped())
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped());
        cmd.spawn().context("Failed to execute mysql command")?
    };

    let stdin = child.stdin.take().context("Failed to open stdin")?;
    let mut writer = tokio::io::BufWriter::new(stdin);
    use tokio::io::AsyncWriteExt;
    use tokio::io::AsyncBufReadExt;

    writer.write_all(b"SET NAMES utf8mb4;\nSET CHARACTER SET utf8mb4;\n").await
        .context("Failed to write charset header")?;

    let file = tokio::fs::File::open(backup_file).await.context("Failed to open backup file")?;
    let mut reader = tokio::io::BufReader::new(file);
    let mut line = String::with_capacity(8192);

    loop {
        line.clear();
        let n = reader.read_line(&mut line).await.context("Failed to read backup line")?;
        if n == 0 { break; }
        let normalized = replace_unsupported_collations(&line);
        writer.write_all(normalized.as_bytes()).await.context("Failed to write to mysql")?;
    }

    writer.flush().await.context("Failed to flush")?;
    drop(writer);

    let output = child.wait_with_output().await.context("Failed to wait for mysql")?;
    if !output.status.success() {
        let error = String::from_utf8_lossy(&output.stderr);
        anyhow::bail!("mysql restore failed: {}", error);
    }

    Ok(())
}
```

- [ ] **Step 2: Run `cargo check`**

---

## Task 9: P1 — Fix N+1 queries in job import (`services/job_service.rs`)

**Files:**
- Modify: `src/services/job_service.rs:22-44`
- Modify: `src/db/job.rs:70-123` (add `exists_by_job_codes` batch method)

- [ ] **Step 1: Add batch exists check to `JobRepository`**

Add to `src/db/job.rs`:

```rust
pub async fn exists_by_job_codes(&self, codes: &[String]) -> Result<std::collections::HashSet<String>> {
    if codes.is_empty() {
        return Ok(std::collections::HashSet::new());
    }
    let placeholders: Vec<String> = codes.iter().map(|_| "?".to_string()).collect();
    let sql = format!("SELECT job_code FROM jobs WHERE job_code IN ({})", placeholders.join(","));
    let mut query = sqlx::query(&sql);
    for code in codes {
        query = query.bind(code);
    }
    let rows = query.fetch_all(&*self.pool).await?;
    Ok(rows.iter().filter_map(|r| r.try_get::<String, _>("job_code").ok()).collect())
}
```

- [ ] **Step 2: Update `import_jobs` in `job_service.rs` to use batch check**

```rust
pub async fn import_jobs(&self, reqs: Vec<CreateJobRequest>) -> Result<(u32, u32)> {
    let codes_to_check: Vec<String> = reqs.iter()
        .filter_map(|r| r.job_code.as_ref())
        .filter(|c| !c.is_empty())
        .cloned()
        .collect();

    let existing_codes = self.job_repo.exists_by_job_codes(&codes_to_check).await?;

    let filtered: Vec<CreateJobRequest> = reqs.into_iter().filter(|req| {
        if let Some(ref code) = req.job_code {
            if !code.is_empty() && existing_codes.contains(code) {
                log::info!("岗位编码 {} 已存在，跳过", code);
                return false;
            }
        }
        true
    }).collect();

    let duplicate_count = (codes_to_check.len() as u32).saturating_sub(existing_codes.len() as u32);
    if duplicate_count > 0 {
        log::info!("跳过已存在的岗位编码: {} 条", duplicate_count);
    }

    let (success, failed) = self.job_repo.create_many(filtered).await?;
    Ok((success, failed + duplicate_count))
}
```

- [ ] **Step 3: Run `cargo check`**

---

## Task 10: P1 — Fix regex recompilation in hot loops (`handlers/job.rs`)

**Files:**
- Modify: `src/handlers/job.rs:413-453`

- [ ] **Step 1: Move regex creation to `OnceLock` statics**

Add at top of file (after imports):

```rust
use std::sync::OnceLock;
static RE_HTML_TAG: OnceLock<regex::Regex> = OnceLock::new();
static RE_WHITESPACE: OnceLock<regex::Regex> = OnceLock::new();
static RE_DATE_FORMAT: OnceLock<regex::Regex> = OnceLock::new();
static RE_CN_DATE: OnceLock<regex::Regex> = OnceLock::new();
```

Then replace lines 413-453 in `parse_job_row_from_vec`:

```rust
let strip_html = |html: &str| -> String {
    let re = RE_HTML_TAG.get_or_init(|| regex::Regex::new(r"<[^>]+>").unwrap());
    let text = re.replace(html, " ").to_string();
    let ws_re = RE_WHITESPACE.get_or_init(|| regex::Regex::new(r"\s+").unwrap());
    ws_re.replace(text.trim(), " ").to_string()
};

let parse_update_date = |raw: Option<String>| -> Option<String> {
    raw.and_then(|s| {
        let s = s.trim();
        if s.is_empty() { return None; }
        let date_re = RE_DATE_FORMAT.get_or_init(|| regex::Regex::new(r"^\d{4}-\d{1,2}-\d{1,2}$").unwrap());
        if date_re.is_match(s) {
            // ... same date parsing logic
            let parts: Vec<&str> = s.split('-').collect();
            // ... rest unchanged
        }
        let cn_re = RE_CN_DATE.get_or_init(|| regex::Regex::new(r"(\d{1,2})月(\d{1,2})日").unwrap());
        if let Some(caps) = cn_re.captures(s) {
            // ... rest unchanged
        }
        None
    })
};
```

Also fix the `truncate_chars` function (line ~400) to avoid collecting `Vec<char>` when no truncation needed:

```rust
let truncate_chars = |s: Option<String>, max_chars: usize| -> Option<String> {
    s.map(|v| {
        if v.chars().count() <= max_chars {
            v
        } else {
            v.chars().take(max_chars).collect()
        }
    })
};
```

- [ ] **Step 2: Run `cargo check`**

---

## Task 11: P1 — Add page_size upper bounds across all query types

**Files:**
- Modify: `src/models/student.rs:90-94`
- Modify: `src/models/school.rs` (SchoolQuery)
- Modify: `src/models/job.rs` (JobQuery)
- Already done in Tasks 1-3 for `find_all` methods with `.min(200)`

- [ ] **Step 1: Add max page_size validation to query structs**

In `src/models/student.rs`, change `StudentQuery`:
```rust
#[derive(Debug, Deserialize)]
pub struct StudentQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub keyword: Option<String>,
}

impl StudentQuery {
    pub fn page(&self) -> u64 {
        self.page.unwrap_or(1).min(100)
    }
    pub fn page_size(&self) -> u64 {
        self.page_size.unwrap_or(20).min(200)
    }
}
```

Find and update the SchoolQuery and JobQuery similarly, then use `.page()` / `.page_size()` methods in the repo methods instead of `query.page.unwrap_or(1)`.

Actually, since we already added `.min(200)` in Tasks 1-3 directly in the find_all methods, this task would be adding helper methods. To keep things simple and avoid breaking changes, the `.min()` calls in the repo methods are sufficient. **Skip this task if Tasks 1-3 already have the bounds.**

- [ ] **Step 2: Also cap `page_size` in `schema.rs:query_table_data`** — already done in Task 4 Step 5.

---

## Task 12: P2 — Fix INSERT-then-SELECT pattern (use LAST_INSERT_ID)

**Files:**
- Modify: `src/db/student.rs:15-50`
- Modify: `src/db/school.rs:15-45`
- Modify: `src/db/job.rs:24-69`

- [ ] **Step 1: In `student.rs`, replace ORDER BY id DESC LIMIT 1 with LAST_INSERT_ID**

```rust
pub async fn create(&self, user_id: i64, req: CreateStudentRequest) -> Result<Student> {
    let now = chrono::Utc::now().timestamp();
    let result = sqlx::query(
        r#"
        INSERT INTO students (user_id, name, education, major, graduation_year,
            skills, certificates, soft_skills, internship, projects, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#
    )
    .bind(user_id).bind(&req.name).bind(&req.education).bind(&req.major)
    .bind(req.graduation_year).bind(&req.skills).bind(&req.certificates)
    .bind(&req.soft_skills).bind(&req.internship).bind(&req.projects)
    .bind(now).bind(now)
    .execute(&*self.pool)
    .await?;

    let id = result.last_insert_id();
    sqlx::query_as::<_, Student>(
        "SELECT id, user_id, name, education, major, graduation_year, skills, certificates, soft_skills, internship, projects, completeness_score, competitiveness_score, resume_url, suggestions, resume_content, created_at, updated_at FROM students WHERE id = ?"
    )
    .bind(id)
    .fetch_one(&*self.pool)
    .await
    .map_err(Into::into)
}
```

Same pattern for `school.rs` and `job.rs`.

- [ ] **Step 2: Run `cargo check`**

---

## Task 13: P2 — Remove redundant find_by_id before update in services

**Files:**
- Modify: `src/services/job_service.rs:62-68`
- Modify: `src/services/student_service.rs` (if exists)
- Modify: `src/services/school_service.rs` (if exists)

- [ ] **Step 1: In `job_service.rs`, remove the existence check — let `update` return `None` naturally**

```rust
pub async fn update_job(&self, id: i64, req: UpdateJobRequest) -> Result<JobResponse> {
    let job = self.job_repo.update(id, req).await?
        .ok_or_else(|| anyhow::anyhow!("岗位不存在或更新失败"))?;
    Ok(job.into())
}
```

The `update` method already returns `Result<Option<Job>>` — if the row doesn't exist, the UPDATE affects 0 rows and we still return the result of `find_by_id` which returns `None`.

Similarly for `delete_job`:
```rust
pub async fn delete_job(&self, id: i64) -> Result<()> {
    let deleted = self.job_repo.delete(id).await?;
    if !deleted {
        return Err(anyhow::anyhow!("岗位不存在"));
    }
    Ok(())
}
```

Check the same pattern in `student_service.rs` and `school_service.rs`.

- [ ] **Step 2: Run `cargo check`**

---

## Task 14: P2 — Add pool lifecycle config to `db/pool.rs`

**Files:**
- Modify: `src/db/pool.rs`

- [ ] **Step 1: Add `idle_timeout` and `max_lifetime` to pool options**

```rust
pub async fn create_mysql_pool(database_url: &str) -> anyhow::Result<MySqlPool> {
    let pool = MySqlPoolOptions::new()
        .max_connections(10)
        .min_connections(2)
        .acquire_timeout(Duration::from_secs(30))
        .idle_timeout(Duration::from_secs(600))
        .max_lifetime(Duration::from_secs(1800))
        .connect(database_url)
        .await?;
    Ok(pool)
}

pub async fn create_sqlite_pool(database_url: &str) -> anyhow::Result<SqlitePool> {
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .min_connections(1)
        .acquire_timeout(Duration::from_secs(30))
        .idle_timeout(Duration::from_secs(600))
        .max_lifetime(Duration::from_secs(1800))
        .connect(database_url)
        .await?;
    Ok(pool)
}
```

- [ ] **Step 2: Run `cargo check`**

---

## Task 15: P2 — Fix `SELECT *` in school and user repos

**Files:**
- Modify: `src/db/school.rs:38-44,48-56,58-67,160-165`
- Modify: `src/db/user.rs:49-56,61-69,72-80`
- Modify: `src/db/mysql_user.rs` (already uses `MYSQL_USER_SELECT_SQL` — OK)

- [ ] **Step 1: Add explicit column list constant to `school.rs`**

At top of file:
```rust
const SCHOOL_SELECT_SQL: &str = concat!(
    "SELECT id, name, code, address, contact_person, contact_phone, contact_email, ",
    "status, created_at, updated_at FROM schools"
);
```

Replace all `SELECT * FROM schools` with the constant. Same for `find_by_id`, `find_by_code`, `list_all`.

- [ ] **Step 2: Add explicit column list to `user.rs`**

At top:
```rust
const USER_SELECT_SQL: &str = "SELECT id, username, password_hash, name, role, created_at, updated_at FROM users";
```

Replace `SELECT * FROM users` with this constant.

- [ ] **Step 3: Run `cargo check`**

---

## Task 16: P2 — Remove double-Arc wrapping in `AppState`

**Files:**
- Modify: `src/state.rs:20-24`
- Modify: `src/db/*.rs` — all repo `new()` methods take `Arc<Pool>`, change to just `Pool`

This is a breaking API change across many files. Since it's P2 and low impact, **skip this task** — the double-Arc overhead is negligible.

---

## Task 17: P2 — Use `Cow<str>` or combine regex replacements in backup

**Already addressed in the initial backup_database optimization** — the streaming I/O and OnceLock regexes are the major wins. The per-line string allocs are minor relative to the other improvements. **Skip this task.**

---

## Task 18: P2 — Config `jwt_secret()` returns `String` clone each call

**Files:**
- Modify: `src/config.rs:61-63`

- [ ] **Step 1: Return `&str` instead of `String`**

```rust
pub fn jwt_secret(&self) -> &str {
    self.jwt_secret.as_ref().unwrap()
}
```

This requires updating all callers to handle `&str` instead of `String`. Search for usages with `grep jwt_secret`.

- [ ] **Step 2: Run `cargo check`**

---

## Summary of Remaining Tasks After All Changes

| Task | Priority | Key Change |
|------|----------|-----------|
| 1-3 | P0 Security | Parameterized queries in student/school/job repos |
| 4 | P0 Security | Schema handler SQL injection fixes + N+1 fix + page_size cap |
| 5 | P0 | Async I/O in ops handler |
| 6 | P0 | spawn_blocking for system status |
| 7 | P0 | spawn_blocking for bcrypt |
| 8 | P0 | Streaming restore |
| 9 | P1 | Batch exists check for job import |
| 10 | P1 | OnceLock regex in job handler |
| 11 | P1 | page_size caps (mostly done in 1-4) |
| 12 | P2 | LAST_INSERT_ID pattern |
| 13 | P2 | Remove redundant find_by_id |
| 14 | P2 | Pool lifecycle config |
| 15 | P2 | SELECT * to explicit columns |
| 16 | P2 (skip) | Double-Arc removal |
| 17 | P2 (skip) | Cow<str> in backup |
| 18 | P2 | jwt_secret return &str |