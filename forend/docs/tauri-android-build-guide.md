# Tauri Android 构建指南

## 环境要求

| 组件 | 版本 | 路径 |
|---|---|---|
| JDK | 21 | `/usr/lib/jvm/java-21-openjdk` |
| Android SDK | - | `/opt/android-sdk` |
| Android NDK | r29 (29.0.14206865) | `/opt/android-ndk` → 符号链接到 `/opt/android-sdk/ndk/29.0.14206865` |
| Rust | stable | - |
| Node.js | 24.x | - |

## SDK 组件清单

已安装的 SDK 组件：

- `platform-tools` (36.0.2)
- `platforms;android-35`
- `platforms;android-36`
- `build-tools;35.0.0`
- `build-tools;35.0.1`
- `cmdline-tools;latest`
- `ndk;29.0.14206865`（符号链接）
- `tools` (26.1.1，旧版)

## 环境变量设置

构建前必须设置以下环境变量：

```bash
export ANDROID_HOME=/opt/android-sdk
export ANDROID_SDK_ROOT=/opt/android-sdk
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk    # 注意：不带 -amd64 后缀
```

> **重要**：Arch Linux 上 JAVA_HOME 路径为 `/usr/lib/jvm/java-21-openjdk`，不要写成 `/usr/lib/jvm/java-21-openjdk-amd64`（后者是 Debian/Ubuntu 的路径格式）。

## 构建命令

```bash
# 1. 设置环境变量
export ANDROID_HOME=/opt/android-sdk
export ANDROID_SDK_ROOT=/opt/android-sdk
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk

# 2. 构建前端
npm run build

# 3. 构建 APK（debug）
npx tauri android build --debug

# 4. 构建 APK（release）
npx tauri android build
```

构建产物路径：
- APK: `src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release-unsigned.apk`
- AAB: `src-tauri/gen/android/app/build/outputs/bundle/universalRelease/app-universal-release.aab`

## 已解决的问题及修复记录

### 问题 1：TypeScript 编译错误

**现象**：`npm run build` 失败，3 个 TS 错误。

**修复**：

1. `src/pages/Interview/index.tsx:132` — `timerRef` 类型改为 `ReturnType<typeof setInterval>`
2. `src/pages/Jobs/index.tsx:168` — 箭头函数加 `{}` 包裹 `window.setTimeout` 调用
3. `src/pages/ResumeEditor/index.tsx:4` — 移除未使用的 `OrderedListOutlined` 导入

### 问题 2：`tauri android init` 失败 — cmdline-tools 下载失败

**现象**：`failed to extract Android command line tools: i/o error`

**原因**：磁盘空间不足 + Tauri 尝试重新下载已存在的 cmdline-tools

**解决**：
1. 手动安装缺少的 SDK 组件：
   ```bash
   sudo /opt/android-sdk/cmdline-tools/latest/bin/sdkmanager "platforms;android-35" "build-tools;35.0.1"
   ```
2. 创建 Tauri 期望的路径结构：
   ```bash
   # Tauri 检查 cmdline-tools/bin/sdkmanager（不是 cmdline-tools/latest/bin）
   sudo mkdir -p /opt/android-sdk/cmdline-tools/bin
   sudo ln -sf /opt/android-sdk/cmdline-tools/latest/bin/sdkmanager /opt/android-sdk/cmdline-tools/bin/sdkmanager
   ```

### 问题 3：`tauri android init` 失败 — NDK 未找到

**现象**：`Skipping Android Studio NDK installation`

**原因**：Tauri 使用 `NDK_HOME` 环境变量，并期望 NDK 位于 `ANDROID_HOME/ndk/<version>/` 目录下。

**解决**：
```bash
# NDK 需要在 ANDROID_HOME/ndk/<version>/ 下
sudo ln -sf /opt/android-ndk /opt/android-sdk/ndk/29.0.14206865
```

> **注意**：Tauri 检测 NDK 的逻辑来自 `cargo-mobile2` 库，它查找 `ANDROID_HOME/ndk/*/source.properties` 文件。

### 问题 4：JAVA_HOME 路径错误

**现象**：`JAVA_HOME is set to an invalid directory: /usr/lib/jvm/java-21-openjdk-amd64`

**原因**：Arch Linux 的 JDK 路径不含 `-amd64` 后缀（那是 Debian/Ubuntu 的命名方式）。

**解决**：
```bash
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk   # 正确
# export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64  # 错误！
```

### 问题 5：Gradle 构建 SDK 不可写

**现象**：`The SDK directory is not writable (/opt/android-sdk)` — Gradle 自动尝试安装 `build-tools;35.0.0` 和 `platforms;android-36`

**解决**：
```bash
sudo chmod -R a+w /opt/android-sdk
# 或预先安装所需组件
sudo /opt/android-sdk/cmdline-tools/latest/bin/sdkmanager "build-tools;35.0.0" "platforms;android-36"
```

### 问题 6：前端不显示（白屏）

**潜在原因及修复**：

1. **Vite `base` 配置缺失**：在 `vite.config.ts` 中添加 `base: './'`
2. **BrowserRouter 不适用于移动端**：改为 `HashRouter`
3. **API 不可达**：生产环境 `VITE_API_BASE_URL=https://stu.swordreforge.top/api/v1` 硬编码在构建中，需确保服务器可达
4. **APK 资源过期**：删除 `src-tauri/gen/android` 后重新 `tauri android build`

## 项目结构

```
high-school-worker-design-forend/
├── src/                          # React 前端源码
│   ├── App.tsx                   # 路由（BrowserRouter → 建议改 HashRouter）
│   ├── api/index.ts              # Axios API 配置
│   ├── pages/                    # 页面组件
│   └── ...
├── src-tauri/
│   ├── Cargo.toml                # Rust 依赖（tauri 2.10.3）
│   ├── tauri.conf.json           # Tauri 配置
│   ├── src/
│   │   ├── main.rs
│   │   └── lib.rs                # Tauri 插件（仅 log）
│   └── gen/android/              # 自动生成的 Android 项目（可编辑，init 时会覆盖）
├── vite.config.ts                # Vite 配置（建议加 base: './'）
├── package.json
└── docs/
    └── tauri-android-build-guide.md  # 本文档
```

## 麦克风权限配置

Interview 页面使用 `navigator.mediaDevices.getUserMedia` 录音，Android 需要：

### 1. AndroidManifest.xml 声明权限

文件：`src-tauri/gen/android/app/src/main/AndroidManifest.xml`

```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
```

### 2. WebView 权限处理（已内置）

Wry（Tauri 使用的 WebView 引擎）已在 `RustWebChromeClient.onPermissionRequest` 中内置了麦克风权限处理逻辑：当 WebView 的 `getUserMedia` 请求 `AUDIO_CAPTURE` 时，会自动请求 `RECORD_AUDIO` + `MODIFY_AUDIO_SETTINGS` 原生权限。

**无需额外手动处理权限请求代码。** `MainActivity.kt` 保持默认即可：

```kotlin
package com.careerplanner.app

import android.os.Bundle
import androidx.activity.enableEdgeToEdge

class MainActivity : TauriActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)
  }
}
```

### 3. 安装后手动授权（unsigned APK 必须）

**未签名的 APK 安装后不会自动授予危险权限**。安装后需要在手机上手动授权：

1. 打开 **设置 → 应用 → 职业规划智能系统 → 权限**
2. 找到 **麦克风** 权限，设为 **允许**
3. 重新打开应用

也可以通过 ADB 授权：

```bash
adb shell pm grant com.careerplanner.app android.permission.RECORD_AUDIO
adb shell pm grant com.careerplanner.app android.permission.MODIFY_AUDIO_SETTINGS
```

> **正式发布时**，使用签名 APK 可以在安装时自动弹出权限请求对话框。

export ANDROID_HOME=/opt/android-sdk && export ANDROID_SDK_ROOT=/opt/android-sdk && export JAVA_HOME=/usr/lib/jvm/java-21-openjdk && npx tauri android build 2>&1 | tail -20

## 前端白屏排查清单

- [ ] `vite.config.ts` 设置 `base: './'`
- [ ] 使用 `HashRouter` 替代 `BrowserRouter`
- [ ] 确认 API 服务器 `stu.swordreforge.top` 可从移动端访问
- [ ] 检查 ProGuard 是否剥离 WebView 相关类（release 构建时）
- [ ] 用 debug 构建先确认：`npx tauri android build --debug`
- [ ] 使用 Chrome DevTools 远程调试 WebView：`chrome://inspect`