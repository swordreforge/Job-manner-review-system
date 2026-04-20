use sqlx::{MySqlPool, SqlitePool};
use std::sync::Arc;

use std::path::Path;
use anyhow::{Context, Result};
use tokio::io::{AsyncBufReadExt, AsyncWriteExt};

static RE_COLLATE_EQ: std::sync::OnceLock<regex::Regex> = std::sync::OnceLock::new();
static RE_COLLATE_SPACE: std::sync::OnceLock<regex::Regex> = std::sync::OnceLock::new();
static RE_COMMENT: std::sync::OnceLock<regex::Regex> = std::sync::OnceLock::new();
static RE_CHECK_JSON: std::sync::OnceLock<regex::Regex> = std::sync::OnceLock::new();
static RE_AUTO_INC: std::sync::OnceLock<regex::Regex> = std::sync::OnceLock::new();
static RE_PAREN_OPEN: std::sync::OnceLock<regex::Regex> = std::sync::OnceLock::new();
static RE_PAREN_CLOSE: std::sync::OnceLock<regex::Regex> = std::sync::OnceLock::new();
static RE_MULTI_SPACE: std::sync::OnceLock<regex::Regex> = std::sync::OnceLock::new();

fn replace_unsupported_collations(input: &str) -> String {
    let re_eq = RE_COLLATE_EQ.get_or_init(|| regex::Regex::new(r"(?i)COLLATE\s*=\s*utf8mb4_uca[0-9a-z_]*").unwrap());
    let re_sp = RE_COLLATE_SPACE.get_or_init(|| regex::Regex::new(r"(?i)COLLATE\s+utf8mb4_uca[0-9a-z_]*").unwrap());
    let mid = re_eq.replace_all(input, "COLLATE=utf8mb4_unicode_ci");
    re_sp.replace_all(&mid, "COLLATE utf8mb4_unicode_ci").to_string()
}

/// 应用状态，统一管理所有共享依赖
#[derive(Clone)]
pub struct AppState {
    pub sqlite_pool: Arc<SqlitePool>,
    pub mysql_pool: Arc<MySqlPool>,
    pub config: Arc<crate::config::Config>,
}

impl AppState {
    pub fn new(sqlite_pool: SqlitePool, mysql_pool: MySqlPool, config: crate::config::Config) -> Self {
        AppState {
            sqlite_pool: Arc::new(sqlite_pool),
            mysql_pool: Arc::new(mysql_pool),
            config: Arc::new(config),
        }
    }

    /// 获取 SQLite 连接池（用于登录功能）
    #[allow(dead_code)]
    pub fn sqlite_db(&self) -> &SqlitePool {
        &self.sqlite_pool
    }

    /// 获取 MySQL 连接池（用于管理功能）
    pub fn mysql_db(&self) -> &MySqlPool {
        &self.mysql_pool
    }

    /// 获取配置
    #[allow(dead_code)]
    pub fn config(&self) -> &crate::config::Config {
        &self.config
    }

    /// 获取 MySQL 数据库配置信息
    #[allow(dead_code)]
    pub fn get_mysql_config(&self) -> (&str, u16, &str, &str, &str) {
        (
            self.config.mysql_host.as_str(),
            self.config.mysql_port,
            self.config.mysql_username.as_str(),
            self.config.mysql_password.as_str(),
            self.config.mysql_database.as_str(),
        )
    }

    /// 执行数据库备份
    ///
    /// # 参数
    /// - `output_dir`: 备份文件输出目录
    ///
    /// # 返回
    /// - 备份文件的完整路径
    ///
    /// # 平台支持
    /// - Linux/macOS: 完全支持
    /// - Windows: 不支持，返回错误提示用户使用其他工具
    pub async fn backup_database(&self, output_dir: &str) -> Result<String> {
        let (host, port, user, password, db_name) = self.get_mysql_config();

        tokio::fs::create_dir_all(output_dir).await
            .context("Failed to create backup directory")?;

        let timestamp = chrono::Utc::now().format("%Y%m%d_%H%M%S").to_string();
        let filename = format!("career_db_backup_{}.sql", timestamp);
        let output_path = format!("{}/{}", output_dir, filename);

        if password.is_empty() {
            anyhow::bail!("Database password is not configured");
        }

        let dump_cmd = if cfg!(target_os = "windows") {
            if std::process::Command::new("where").arg("mysqldump").output().map(|o| o.status.success()).unwrap_or(false) {
                "mysqldump"
            } else {
                anyhow::bail!(
                    "未找到 mysqldump 命令。\n\
                     请确保 MySQL bin 目录在 PATH 中，或使用以下方式之一：\n\
                     1. 添加 MySQL bin 目录到系统 PATH\n\
                     2. 使用完整路径调用 mysqldump\n\
                     3. 使用 MySQL Workbench 手动导出"
                );
            }
        } else if std::path::Path::new("/usr/bin/mariadb-dump").exists() {
            "mariadb-dump"
        } else {
            "mysqldump"
        };

        let re_comment = RE_COMMENT.get_or_init(|| regex::Regex::new(r"COMMENT\s*'[^']*'").unwrap());
        let re_check_json = RE_CHECK_JSON.get_or_init(|| regex::Regex::new(r"CHECK\s*\(json_valid\([^)]*\)\)").unwrap());
        let re_auto_inc = RE_AUTO_INC.get_or_init(|| regex::Regex::new(r"AUTO_INCREMENT\s*=\s*\d+").unwrap());
        let re_paren_open = RE_PAREN_OPEN.get_or_init(|| regex::Regex::new(r"\s*\(").unwrap());
        let re_paren_close = RE_PAREN_CLOSE.get_or_init(|| regex::Regex::new(r"\)\s*").unwrap());
        let re_multi_space = RE_MULTI_SPACE.get_or_init(|| regex::Regex::new(r" {2,}").unwrap());

        let mut child = {
            let mut cmd = tokio::process::Command::new(dump_cmd);
            cmd.arg("-h")
                .arg(host)
                .arg("-P")
                .arg(port.to_string())
                .arg("-u")
                .arg(user)
                .arg("--default-character-set=utf8mb4")
                .arg("--quick")
                .arg("--single-transaction")
                .arg("--compress")
                .arg(db_name)
                .env("MYSQL_PWD", password)
                .stdout(std::process::Stdio::piped())
                .stderr(std::process::Stdio::piped());
            cmd.spawn()
                .context("Failed to execute mysqldump command")?
        };

        let mut stdout = child.stdout.take().context("Failed to capture mysqldump stdout")?;

        let out_path = output_path.clone();
        let db_name_owned = db_name.to_string();

        let writer_handle = tokio::spawn(async move {
use tokio::io::{AsyncBufReadExt, AsyncWriteExt};

            let mut reader = tokio::io::BufReader::new(&mut stdout);
            let out_file = tokio::fs::File::create(&out_path).await
                .map_err(|e| anyhow::anyhow!("Failed to create backup file: {}", e))?;
            let mut writer = tokio::io::BufWriter::new(out_file);

            let header = format!(
                "CREATE DATABASE IF NOT EXISTS `{}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n\
                 USE `{}`;\n\
                 SET FOREIGN_KEY_CHECKS=0;\n\n",
                db_name_owned, db_name_owned
            );
            writer.write_all(header.as_bytes()).await
                .map_err(|e| anyhow::anyhow!("Failed to write header: {}", e))?;

            let mut line = String::with_capacity(4096);
            let mut line_count: u64 = 0;

            loop {
                line.clear();
                let n = reader.read_line(&mut line).await
                    .map_err(|e| anyhow::anyhow!("Failed to read mysqldump output: {}", e))?;
                if n == 0 { break; }

                let trimmed = line.trim();
                if trimmed.is_empty()
                    || trimmed.starts_with("--")
                    || trimmed.starts_with("/*")
                    || trimmed.starts_with("*/")
                    || trimmed.starts_with("SET ")
                    || trimmed.starts_with("LOCK ")
                    || trimmed.starts_with("UNLOCK ")
                    || trimmed.starts_with("COMMIT")
                {
                    continue;
                }

                let mut cleaned = trimmed.to_string();

                cleaned = re_multi_space.replace_all(&cleaned, " ").to_string();
                cleaned = cleaned.replace("TYPE=InnoDB", "ENGINE=InnoDB");
                cleaned = re_comment.replace_all(&cleaned, "").to_string();
                cleaned = replace_unsupported_collations(&cleaned);
                cleaned = cleaned.replace("COLLATE=utf8mb4_bin", "");
                cleaned = re_check_json.replace_all(&cleaned, "").to_string();
                cleaned = re_auto_inc.replace_all(&cleaned, "").to_string();
                cleaned = re_paren_open.replace_all(&cleaned, "(").to_string();
                cleaned = re_paren_close.replace_all(&cleaned, ")").to_string();
                cleaned = cleaned.replace(" ,", ",");

                if cleaned.contains(") ENGINE=InnoDB") && !cleaned.contains("DEFAULT CHARSET") {
                    cleaned = cleaned.replace(") ENGINE=InnoDB", ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
                }

                let cleaned = cleaned.trim();
                if !cleaned.is_empty() {
                    writer.write_all(cleaned.as_bytes()).await
                        .map_err(|e| anyhow::anyhow!("Failed to write line: {}", e))?;
                    writer.write_all(b"\n").await
                        .map_err(|e| anyhow::anyhow!("Failed to write newline: {}", e))?;
                    line_count += 1;
                }
            }

            writer.write_all(b"\nSET FOREIGN_KEY_CHECKS=1;\n").await
                .map_err(|e| anyhow::anyhow!("Failed to write footer: {}", e))?;
            writer.flush().await
                .map_err(|e| anyhow::anyhow!("Failed to flush: {}", e))?;

            Ok::<u64, anyhow::Error>(line_count)
        });

        let status = child.wait().await
            .context("Failed to wait for mysqldump")?;
        if !status.success() {
            let mut stderr = String::new();
            if let Some(mut err) = child.stderr.take() {
                use tokio::io::AsyncReadExt;
                let _ = err.read_to_string(&mut stderr).await;
            }
            anyhow::bail!("mysqldump failed: {}", stderr);
        }

        let line_count = writer_handle.await
            .context("Backup writer task panicked")?
            .context("Backup writer task failed")?;

        log::info!("Database backup completed: {} lines written to {}", line_count, output_path);

        Ok(output_path)
    }

/// 执行数据库恢复
    /// 
    /// # 参数
    /// - `backup_file`: 备份文件的路径
    /// 
    /// # 平台支持
    /// - Linux/macOS: 完全支持
    /// - Windows: 完全支持
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
        let mut writer = tokio::io::BufWriter::new(stdin);

        writer.write_all(b"SET NAMES utf8mb4;\nSET CHARACTER SET utf8mb4;\n").await
            .context("Failed to write charset header")?;

        let file = tokio::fs::File::open(backup_file).await
            .context("Failed to open backup file")?;
        let mut reader = tokio::io::BufReader::new(file);
        let mut line = String::with_capacity(8192);

        loop {
            line.clear();
            let n = reader.read_line(&mut line).await
                .context("Failed to read backup line")?;
            if n == 0 { break; }

            let normalized = replace_unsupported_collations(&line);
            writer.write_all(normalized.as_bytes()).await
                .context("Failed to write to mysql")?;
        }

        writer.flush().await.context("Failed to flush")?;
        drop(writer);

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

    /// 列出所有备份文件
    /// 
    /// # 参数
    /// - `backup_dir`: 备份文件目录
    /// 
    /// # 返回
    /// - 备份文件信息列表
    pub fn list_backups(&self, backup_dir: &str) -> Result<Vec<BackupInfo>> {
        let dir = Path::new(backup_dir);
        
        if !dir.exists() {
            return Ok(vec![]);
        }

        let mut backups = Vec::new();

        for entry in std::fs::read_dir(dir)
            .context("Failed to read backup directory")?
        {
            let entry = entry.context("Failed to read directory entry")?;
            let path = entry.path();

            // 只处理 .sql 文件
            if path.extension().and_then(|s| s.to_str()) != Some("sql") {
                continue;
            }

            let metadata = entry.metadata()
                .context("Failed to get file metadata")?;

            let filename = path.file_name()
                .and_then(|s| s.to_str())
                .unwrap_or("")
                .to_string();

            let file_size = metadata.len();
            let created_at = metadata.created()
                .ok()
                .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                .map(|d| d.as_secs() as i64);

            backups.push(BackupInfo {
                filename,
                file_size,
                created_at,
                file_path: path.to_string_lossy().to_string(),
            });
        }

        // 按创建时间倒序排列
        backups.sort_by(|a, b| {
            let a_time = a.created_at.unwrap_or(0);
            let b_time = b.created_at.unwrap_or(0);
            b_time.cmp(&a_time)
        });

        Ok(backups)
    }
}

/// 备份文件信息
#[derive(Debug, Clone, serde::Serialize)]
pub struct BackupInfo {
    pub filename: String,
    pub file_size: u64,
    pub created_at: Option<i64>,
    pub file_path: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_replace_unsupported_collation_with_equals_syntax() {
        let input = "CREATE TABLE t(id bigint) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;";
        let output = replace_unsupported_collations(input);

        assert!(!output.contains("utf8mb4_uca1400_ai_ci"));
        assert!(output.contains("COLLATE=utf8mb4_unicode_ci"));
    }

    #[test]
    fn test_replace_unsupported_collation_with_space_syntax() {
        let input = "CREATE TABLE t(id bigint) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;";
        let output = replace_unsupported_collations(input);

        assert!(!output.contains("utf8mb4_uca1400_ai_ci"));
        assert!(output.contains("COLLATE utf8mb4_unicode_ci"));
    }

    #[test]
    fn test_keep_supported_collation_unchanged() {
        let input = "CREATE TABLE t(id bigint) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
        let output = replace_unsupported_collations(input);

        assert_eq!(output, input);
    }
}