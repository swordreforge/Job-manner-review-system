# 服务管理脚本使用指南

本项目提供了一键启动、停止和重启所有服务的脚本，方便开发和管理。

## 服务列表

系统包含以下四个服务：

1. **后端 API (Go)** - 职业规划系统后端服务
   - 端口: 8088
   - 启动命令: `go run career.go` 或 `./career-api`

2. **前端服务 (Vite)** - React 前端应用
   - 端口: 5173
   - 启动命令: `npm run dev`

3. **Whisper 语音服务 (FastAPI)** - 语音识别服务
   - 端口: 8000
   - 启动命令: `python3 web_app.py`

4. **教师 API (Rust)** - 教师端管理服务
   - 端口: 8081
   - 启动命令: `cargo run`

## 脚本说明

### 1. 启动所有服务

```bash
./start-all-services.sh
```

该脚本会：
- 检查所有必要的依赖（Node.js、Go、Python、Rust）
- 停止已运行的服务
- 启动所有四个服务
- 显示服务状态和访问地址
- 将日志输出到 `logs/` 目录

### 2. 停止所有服务

```bash
./stop-all-services.sh
```

该脚本会：
- 优雅地停止所有运行中的服务
- 清理 PID 文件

### 3. 重启所有服务

```bash
./restart-all-services.sh
```

该脚本会：
- 先停止所有服务
- 然后重新启动所有服务

## 访问地址

服务启动后，可以通过以下地址访问：

- 🌐 **前端界面**: http://localhost:5173
- 🔧 **后端 API**: http://localhost:8088
- 🎤 **Whisper 服务**: http://localhost:8000
- 👨‍🏫 **教师 API**: http://localhost:8081

## 日志管理

所有服务的日志都存储在 `logs/` 目录下：

- `logs/backend.log` - 后端 API 日志
- `logs/frontend.log` - 前端服务日志
- `logs/whisper.log` - Whisper 服务日志
- `logs/teacher.log` - 教师 API 日志

查看实时日志：

```bash
# 查看后端日志
tail -f logs/backend.log

# 查看前端日志
tail -f logs/frontend.log

# 查看 Whisper 日志
tail -f logs/whisper.log

# 查看教师 API 日志
tail -f logs/teacher.log
```

## 进程管理

所有服务的进程 ID (PID) 都存储在 `logs/` 目录下：

- `logs/backend.pid` - 后端 API 进程 ID
- `logs/frontend.pid` - 前端服务进程 ID
- `logs/whisper.pid` - Whisper 服务进程 ID
- `logs/teacher.pid` - 教师 API 进程 ID

手动管理进程：

```bash
# 查看进程状态
ps -p $(cat logs/backend.pid)

# 停止特定进程
kill $(cat logs/backend.pid)

# 强制停止进程
kill -9 $(cat logs/backend.pid)
```

## 常见问题

### 1. 端口被占用

如果启动时提示端口被占用，可以先停止服务或手动释放端口：

```bash
# 查找占用端口的进程
lsof -i :8088

# 停止占用端口的进程
kill -9 <PID>
```

### 2. 依赖未安装

如果启动时提示依赖未安装，需要先安装相应的依赖：

```bash
# 安装前端依赖
cd high-school-worker-design-forend
npm install

# 安装 Whisper 依赖
pip install -U openai-whisper fastapi uvicorn opencc

# 安装 Rust 依赖（首次运行时会自动编译）
cd teacher-app
cargo build --release
```

### 3. 配置文件缺失

确保以下配置文件存在：

- 后端: `etc/career-api.yaml`
- 教师 API: 可以通过命令行参数配置

### 4. 数据库连接失败

确保 MySQL 数据库已启动并配置正确：

```bash
# 检查 MySQL 服务状态
systemctl status mysql

# 启动 MySQL 服务
systemctl start mysql
```

## 开发模式 vs 生产模式

### 开发模式

使用 `start-all-services.sh` 脚本启动时，默认使用开发模式：

- 后端使用 `go run` 启动，支持热重载
- 前端使用 Vite 开发服务器，支持 HMR
- 教师 API 使用 `cargo run` 启动

### 生产模式

如需在生产环境运行，建议：

1. 编译所有服务为可执行文件：
   ```bash
   # 后端
   go build -o career-api career.go

   # 教师 API
   cd teacher-app
   cargo build --release
   ```

2. 使用进程管理工具（如 systemd、supervisor）管理服务

3. 使用 Nginx 作为反向代理

### 前端独立部署（用户侧）

前端编译后可通过 `serve` 独立运行，无需启动完整的开发服务：

```bash
# 安装 serve（如未安装）
npm install -g serve

# 进入前端目录
cd high-school-worker-design-forend

# 编译生产版本
npm run build

# 使用 serve 运行
serve -s dist -l 3000
```

编译后的前端会自动请求后端 API `https://stu.swordreforge.top/api/v1`，用户可直接通过 http://localhost:3000 访问。

## 健康检查

检查服务是否正常运行：

```bash
# 检查后端 API
curl http://localhost:8088/api/v1/health

# 检查前端
curl http://localhost:5173

# 检查 Whisper
curl http://localhost:8000/docs

# 检查教师 API
curl http://localhost:8081
```

## 故障排查

如果服务无法启动，请检查：

1. 查看服务日志：`tail -f logs/[服务名].log`
2. 检查端口是否被占用：`lsof -i :[端口]`
3. 检查依赖是否安装完整
4. 检查配置文件是否正确
5. 检查数据库连接是否正常

## 支持

如有问题，请查看相关文档或联系开发团队。