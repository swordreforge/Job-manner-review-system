use anyhow::{Context, Result};
use tracing::{debug, info, warn};
use std::process::Command;

/// 将音频转换为 PCM 格式（16bit, 16kHz, 单声道）
pub fn convert_to_pcm(audio_data: Vec<u8>, filename: &str) -> Result<Vec<u8>> {
    // 检查是否已经是 PCM 格式
    if filename.ends_with(".pcm") || filename.ends_with(".raw") {
        debug!("音频已经是 PCM 格式，无需转换");
        return Ok(audio_data);
    }

    // 创建临时文件
    let temp_dir = std::env::temp_dir();
    let temp_input = temp_dir.join(format!("input_{}.tmp", uuid::Uuid::new_v4()));
    let temp_output = temp_dir.join(format!("output_{}.pcm", uuid::Uuid::new_v4()));

    // 写入临时输入文件
    std::fs::write(&temp_input, &audio_data)
        .context("写入临时输入文件失败")?;

    debug!("开始转换音频格式: {} -> PCM", filename);

    // 使用 ffmpeg 转换为 PCM 格式
    // -f s16le: 16bit 小端格式
    // -ar 16000: 采样率 16kHz
    // -ac 1: 单声道
    let result = Command::new("ffmpeg")
        .arg("-y") // 覆盖输出文件
        .arg("-i")
        .arg(&temp_input)
        .arg("-f")
        .arg("s16le")
        .arg("-ar")
        .arg("16000")
        .arg("-ac")
        .arg("1")
        .arg(&temp_output)
        .output()
        .context("执行 ffmpeg 命令失败");

    // 清理临时文件
    let _ = std::fs::remove_file(&temp_input);

    match result {
        Ok(output) => {
            if output.status.success() {
                // 读取转换后的 PCM 数据
                let pcm_data = std::fs::read(&temp_output)
                    .context("读取转换后的 PCM 数据失败")?;

                // 清理临时输出文件
                let _ = std::fs::remove_file(&temp_output);

                info!(
                    "音频转换成功: {} -> {} 字节",
                    audio_data.len(),
                    pcm_data.len()
                );
                Ok(pcm_data)
            } else {
                let stderr = String::from_utf8_lossy(&output.stderr);
                warn!("ffmpeg 转换失败: {}", stderr);
                // 如果转换失败，返回原始数据（可能已经是 PCM 格式）
                let _ = std::fs::remove_file(&temp_output);
                Ok(audio_data)
            }
        }
        Err(e) => {
            warn!("ffmpeg 执行失败: {}，尝试直接使用原始数据", e);
            // 清理临时输出文件（如果存在）
            let _ = std::fs::remove_file(&temp_output);
            Ok(audio_data)
        }
    }
}

/// 检查音频数据大小是否合法
pub fn validate_audio_size(audio_data: &[u8], max_duration_seconds: u32) -> Result<()> {
    // PCM 格式：16bit (2字节) * 采样率 (16000Hz) * 时长
    let max_size = max_duration_seconds as usize * 16000 * 2;

    if audio_data.is_empty() {
        return Err(anyhow::anyhow!("音频数据为空"));
    }

    if audio_data.len() > max_size {
        return Err(anyhow::anyhow!(
            "音频过长，最大支持 {} 秒（当前 {:.1} 秒）",
            max_duration_seconds,
            audio_data.len() as f64 / (16000.0 * 2.0)
        ));
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_audio_size() {
        // 测试空数据
        assert!(validate_audio_size(&[], 60).is_err());

        // 测试正常数据
        let normal_data = vec![0u8; 16000 * 2]; // 1 秒
        assert!(validate_audio_size(&normal_data, 60).is_ok());

        // 测试过长的数据
        let long_data = vec![0u8; 61 * 16000 * 2]; // 61 秒
        assert!(validate_audio_size(&long_data, 60).is_err());
    }

    #[test]
    fn test_check_ffmpeg_installed() {
        // 这个测试会检查系统是否安装了 ffmpeg
        let installed = check_ffmpeg_installed();
        println!("ffmpeg installed: {}", installed);
    }
}