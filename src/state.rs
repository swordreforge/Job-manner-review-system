use sqlx::{MySqlPool, SqlitePool};
use std::sync::Arc;
use std::path::Path;
use anyhow::{Context, Result};

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

        // 创建备份目录
        std::fs::create_dir_all(output_dir)
            .context("Failed to create backup directory")?;

        // 生成备份文件名
        let timestamp = chrono::Utc::now().format("%Y%m%d_%H%M%S").to_string();
        let filename = format!("career_db_backup_{}.sql", timestamp);
        let output_path = format!("{}/{}", output_dir, filename);

        // 检查密码
        if password.is_empty() {
            anyhow::bail!("Database password is not configured");
        }

        // 检查 mysqldump 是否存在
        let dump_cmd = if cfg!(target_os = "windows") {
            // Windows平台检测mysqldump.exe
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

        // 构建命令
        let output = {
            let mut cmd = tokio::process::Command::new(dump_cmd);
            cmd.arg("-h")
                .arg(host)
                .arg("-P")
                .arg(port.to_string())
                .arg("-u")
                .arg(user)
                .arg(format!("-p{}", password))
                .arg("--default-character-set=utf8mb4")
                .arg(db_name);
            cmd.output()
                .await
                .context("Failed to execute mysqldump command")?
        };

        if !output.status.success() {
            let error = String::from_utf8_lossy(&output.stderr);
            anyhow::bail!("mysqldump failed: {}", error);
        }

        // 清理 SQL 内容以提高兼容性
        let sql_content = String::from_utf8_lossy(&output.stdout).to_string();
        
        // 1. 添加兼容性头信息
        let mut cleaned_sql = format!(
            "CREATE DATABASE IF NOT EXISTS `{}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n",
            db_name
        );
        cleaned_sql.push_str(&format!("USE `{}`;\n", db_name));
        cleaned_sql.push_str("SET FOREIGN_KEY_CHECKS=0;\n\n");

        // 2. 过滤和清理 SQL
        for line in sql_content.lines() {
            let line = line.trim();
            
            // 跳过空行
            if line.is_empty() {
                continue;
            }
            
            // 跳过注释行
            if line.starts_with("--") || line.starts_with("/*") || line.starts_with("*/") {
                continue;
            }
            
            // 跳过 SET 语句（可能导致兼容性问题）
            if line.starts_with("SET ") {
                continue;
            }
            
            // 跳过 LOCK 和 UNLOCK 语句
            if line.starts_with("LOCK ") || line.starts_with("UNLOCK ") {
                continue;
            }
            
            // 跳过 COMMIT 语句
            if line.starts_with("COMMIT") {
                continue;
            }
            
            // 清理 SQL 语法
            let mut cleaned_line = line.to_string();
            
            // 合并多个空格
            while cleaned_line.contains("  ") {
                cleaned_line = cleaned_line.replace("  ", " ");
            }
            
            // TYPE → ENGINE（MySQL 旧语法）
            cleaned_line = cleaned_line.replace("TYPE=InnoDB", "ENGINE=InnoDB");
            
            // 移除 COMMENT（可能导致导入失败）
            cleaned_line = regex::Regex::new(r"COMMENT\s*'[^']*'").unwrap()
                .replace_all(&cleaned_line, "")
                .to_string();
            
            // 移除特定 COLLATE（utf8mb4_uca1400_ai_ci 等）
            cleaned_line = regex::Regex::new(r"COLLATE\s+utf8mb4_uca\w*").unwrap()
                .replace_all(&cleaned_line, "")
                .to_string();
            cleaned_line = cleaned_line.replace("COLLATE=utf8mb4_bin", "");
            
            // 移除 CHECK (json_valid(...)) 约束
            cleaned_line = regex::Regex::new(r"CHECK\s*\(json_valid\([^)]*\)\)").unwrap()
                .replace_all(&cleaned_line, "")
                .to_string();
            
            // 移除 AUTO_INCREMENT（避免主键冲突）
            cleaned_line = regex::Regex::new(r"AUTO_INCREMENT\s*=\s*\d+").unwrap()
                .replace_all(&cleaned_line, "")
                .to_string();
            
            // 清理括号前后的空格
            cleaned_line = regex::Regex::new(r"\s*\(").unwrap()
                .replace_all(&cleaned_line, "(")
                .to_string();
            cleaned_line = regex::Regex::new(r"\)\s*").unwrap()
                .replace_all(&cleaned_line, ")")
                .to_string();
            
            // 清理逗号前的空格
            cleaned_line = cleaned_line.replace(" ,", ",");
            
            // 确保 ENGINE 子句完整
            if cleaned_line.contains(") ENGINE=InnoDB") && !cleaned_line.contains("DEFAULT CHARSET") {
                cleaned_line = cleaned_line.replace(
                    ") ENGINE=InnoDB",
                    ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
                );
            }
            
            // 移除行首和行尾的空格
            cleaned_line = cleaned_line.trim().to_string();
            
            if !cleaned_line.is_empty() {
                cleaned_sql.push_str(&cleaned_line);
                cleaned_sql.push('\n');
            }
        }
        
        // 3. 添加结尾
        cleaned_sql.push_str("\nSET FOREIGN_KEY_CHECKS=1;\n");

        // 写入文件
        std::fs::write(&output_path, cleaned_sql)
            .context("Failed to write backup file")?;

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

        // 检查备份文件是否存在
        if !Path::new(backup_file).exists() {
            anyhow::bail!("Backup file not found: {}", backup_file);
        }

        // 检查密码
        if password.is_empty() {
            anyhow::bail!("Database password is not configured");
        }

        // 检查 mysql 命令是否存在
        if cfg!(target_os = "windows") {
            if !std::process::Command::new("where").arg("mysql").output().map(|o| o.status.success()).unwrap_or(false) {
                anyhow::bail!(
                    "未找到 mysql 命令。\n\
                     请确保 MySQL bin 目录在 PATH 中。"
                );
            }
        }

        // 使用 mysql 命令恢复数据库
        let backup_content = std::fs::read_to_string(backup_file)
            .context("Failed to read backup file")?;

        // 在备份内容前添加字符集设置
        let restored_content = format!(
            "SET NAMES utf8mb4;\nSET CHARACTER SET utf8mb4;\n{}",
            backup_content
        );

        let mut cmd = tokio::process::Command::new("mysql");
        cmd.arg("-h")
            .arg(host)
            .arg("-P")
            .arg(port.to_string())
            .arg("-u")
            .arg(user)
            .arg(format!("-p{}", password))
            .arg("--default-character-set=utf8mb4")
            .arg(db_name);

        // 写入备份内容到 stdin
        let mut child = cmd
            .stdin(std::process::Stdio::piped())
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped())
            .spawn()
            .context("Failed to execute mysql command")?;

        if let Some(mut stdin) = child.stdin.take() {
            use tokio::io::AsyncWriteExt;
            stdin.write_all(restored_content.as_bytes()).await
                .context("Failed to write backup content to mysql")?;
            drop(stdin);
        }

        let output = child.wait_with_output()
            .await
            .context("Failed to wait for mysql command")?;

        if !output.status.success() {
            let error = String::from_utf8_lossy(&output.stderr);
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