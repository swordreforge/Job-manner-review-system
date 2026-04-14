#!/bin/bash

# 一键启动四个服务脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "========================================"
echo "  职业规划系统 - 一键启动脚本"
echo "========================================"
echo ""

# 检查必要的工具
check_dependencies() {
    echo "🔍 检查依赖..."
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js 未安装${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅${NC} Node.js: $(node --version)"

    # 检查 Go
    if ! command -v go &> /dev/null; then
        echo -e "${RED}❌ Go 未安装${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅${NC} Go: $(go version)"

    # 检查 Python
    if ! command -v python3 &> /dev/null; then
        echo -e "${RED}❌ Python3 未安装${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅${NC} Python: $(python3 --version)"

    # 检查 Rust
    if ! command -v cargo &> /dev/null; then
        echo -e "${RED}❌ Rust/Cargo 未安装${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅${NC} Rust: $(rustc --version)"
    echo ""
}

# 停止已运行的服务
stop_services() {
    echo "🛑 停止已运行的服务..."
    
    # 停止后端 API (Go)
    pkill -f "career-api" || true
    pkill -f "career.go" || true
    
    # 停止前端 (Vite)
    pkill -f "vite" || true
    
    # 停止 Whisper 服务
    pkill -f "web_app.py" || true
    
    # 停止教师 API (Rust)
    pkill -f "teacher-api" || true
    
    sleep 2
    echo -e "${GREEN}✅ 服务已停止${NC}"
    echo ""
}

# 创建日志目录
mkdir -p "$PROJECT_ROOT/logs"

# 启动后端 API (Go)
start_backend() {
    echo "🚀 启动后端 API (Go)..."
    cd "$PROJECT_ROOT"
    
    # 检查是否存在编译后的可执行文件
    if [ -f "./career-api" ]; then
        nohup ./career-api -f etc/career-api.yaml > "$PROJECT_ROOT/logs/backend.log" 2>&1 &
    else
        nohup go run career.go -f etc/career-api.yaml > "$PROJECT_ROOT/logs/backend.log" 2>&1 &
    fi
    
    BACKEND_PID=$!
    echo $BACKEND_PID > "$PROJECT_ROOT/logs/backend.pid"
    echo -e "${GREEN}✅ 后端 API 已启动 (PID: $BACKEND_PID)${NC}"
    echo -e "${BLUE}📝 日志: $PROJECT_ROOT/logs/backend.log${NC}"
}

# 启动前端 (Vite)
start_frontend() {
    echo "🚀 启动前端服务..."
    cd "$PROJECT_ROOT/high-school-worker-design-forend"
    
    # 检查依赖
    if [ ! -d "node_modules" ]; then
        echo "⏳ 安装前端依赖..."
        npm install
    fi
    
    nohup npm run dev > "$PROJECT_ROOT/logs/frontend.log" 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > "$PROJECT_ROOT/logs/frontend.pid"
    echo -e "${GREEN}✅ 前端服务已启动 (PID: $FRONTEND_PID)${NC}"
    echo -e "${BLUE}📝 日志: $PROJECT_ROOT/logs/frontend.log${NC}"
}

# 启动 Whisper 语音服务
start_whisper() {
    echo "🚀 启动 Whisper 语音服务..."
    cd "$PROJECT_ROOT/whisper-20250625"
    
    # 检查依赖
    if ! python3 -c "import fastapi" 2>/dev/null || ! python3 -c "import uvicorn" 2>/dev/null; then
        echo -e "${YELLOW}⚠️  Whisper 依赖未完全安装，正在安装...${NC}"
        pip install -U openai-whisper fastapi uvicorn opencc || true
    fi
    
    # 创建 static 目录
    mkdir -p static
    
    nohup python3 web_app.py > "$PROJECT_ROOT/logs/whisper.log" 2>&1 &
    WHISPER_PID=$!
    echo $WHISPER_PID > "$PROJECT_ROOT/logs/whisper.pid"
    echo -e "${GREEN}✅ Whisper 服务已启动 (PID: $WHISPER_PID)${NC}"
    echo -e "${BLUE}📝 日志: $PROJECT_ROOT/logs/whisper.log${NC}"
}

# 启动教师 API (Rust)
start_teacher_api() {
    echo "🚀 启动教师 API (Rust)..."
    cd "$PROJECT_ROOT/teacher-app"
    
    # 检查是否已编译
    if [ -f "target/release/teacher-api" ]; then
        nohup target/release/teacher-api --port 8081 > "$PROJECT_ROOT/logs/teacher.log" 2>&1 &
    else
        nohup cargo run --release -- --port 8081 > "$PROJECT_ROOT/logs/teacher.log" 2>&1 &
    fi
    
    TEACHER_PID=$!
    echo $TEACHER_PID > "$PROJECT_ROOT/logs/teacher.pid"
    echo -e "${GREEN}✅ 教师 API 已启动 (PID: $TEACHER_PID)${NC}"
    echo -e "${BLUE}📝 日志: $PROJECT_ROOT/logs/teacher.log${NC}"
}

# 等待服务启动
wait_for_service() {
    local service_name=$1
    local port=$2
    local max_attempts=30
    local attempt=0
    
    echo -n "⏳ 等待 $service_name 启动..."
    
    while [ $attempt -lt $max_attempts ]; do
        if nc -z localhost $port 2>/dev/null || curl -s "http://localhost:$port" > /dev/null 2>&1; then
            echo -e " ${GREEN}✅${NC}"
            return 0
        fi
        attempt=$((attempt + 1))
        echo -n "."
        sleep 1
    done
    
    echo -e " ${RED}❌ 超时${NC}"
    return 1
}

# 显示服务状态
show_status() {
    echo ""
    echo "========================================"
    echo "  服务状态"
    echo "========================================"
    echo ""
    
    # 检查后端 API
    if [ -f "$PROJECT_ROOT/logs/backend.pid" ]; then
        if ps -p $(cat "$PROJECT_ROOT/logs/backend.pid") > /dev/null 2>&1; then
            echo -e "${GREEN}✅ 后端 API (Go)${NC} - 运行中"
        else
            echo -e "${RED}❌ 后端 API (Go)${NC} - 已停止"
        fi
    else
        echo -e "${YELLOW}⚠️  后端 API (Go)${NC} - 未启动"
    fi
    
    # 检查前端
    if [ -f "$PROJECT_ROOT/logs/frontend.pid" ]; then
        if ps -p $(cat "$PROJECT_ROOT/logs/frontend.pid") > /dev/null 2>&1; then
            echo -e "${GREEN}✅ 前端服务${NC} - 运行中"
        else
            echo -e "${RED}❌ 前端服务${NC} - 已停止"
        fi
    else
        echo -e "${YELLOW}⚠️  前端服务${NC} - 未启动"
    fi
    
    # 检查 Whisper
    if [ -f "$PROJECT_ROOT/logs/whisper.pid" ]; then
        if ps -p $(cat "$PROJECT_ROOT/logs/whisper.pid") > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Whisper 服务${NC} - 运行中"
        else
            echo -e "${RED}❌ Whisper 服务${NC} - 已停止"
        fi
    else
        echo -e "${YELLOW}⚠️  Whisper 服务${NC} - 未启动"
    fi
    
    # 检查教师 API
    if [ -f "$PROJECT_ROOT/logs/teacher.pid" ]; then
        if ps -p $(cat "$PROJECT_ROOT/logs/teacher.pid") > /dev/null 2>&1; then
            echo -e "${GREEN}✅ 教师 API (Rust)${NC} - 运行中"
        else
            echo -e "${RED}❌ 教师 API (Rust)${NC} - 已停止"
        fi
    else
        echo -e "${YELLOW}⚠️  教师 API (Rust)${NC} - 未启动"
    fi
    
    echo ""
    echo "========================================"
    echo "  访问地址"
    echo "========================================"
    echo ""
    echo "🌐 前端界面:    http://localhost:5173"
    echo "🔧 后端 API:    http://localhost:8088"
    echo "🎤 Whisper:     http://localhost:8000"
    echo "👨‍🏫 教师 API:   http://localhost:8081"
    echo ""
    echo "========================================"
    echo "  管理命令"
    echo "========================================"
    echo ""
    echo "📊 查看日志: tail -f logs/[服务名].log"
    echo "🛑 停止服务: ./stop-all-services.sh"
    echo "🔄 重启服务: ./restart-all-services.sh"
    echo ""
}

# 主函数
main() {
    check_dependencies
    stop_services
    
    echo "开始启动服务..."
    echo ""
    
    # 启动所有服务
    start_backend
    start_frontend
    start_whisper
    start_teacher_api
    
    echo ""
    echo "⏳ 等待服务启动完成..."
    sleep 5
    
    # 检查服务状态
    show_status
    
    echo -e "${GREEN}🎉 所有服务启动完成！${NC}"
}

# 运行主函数
main