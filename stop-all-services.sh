#!/bin/bash

# 停止所有服务脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "========================================"
echo "  停止所有服务"
echo "========================================"
echo ""

# 停止函数
stop_service() {
    local service_name=$1
    local pid_file=$2
    local process_pattern=$3
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            echo -n "🛑 停止 $service_name (PID: $pid)... "
            kill $pid 2>/dev/null
            sleep 2
            
            # 如果进程还在运行，强制杀死
            if ps -p $pid > /dev/null 2>&1; then
                kill -9 $pid 2>/dev/null
                sleep 1
            fi
            
            if ps -p $pid > /dev/null 2>&1; then
                echo -e "${RED}❌ 失败${NC}"
            else
                echo -e "${GREEN}✅ 成功${NC}"
            fi
        else
            echo -e "${YELLOW}⚠️  $service_name 未运行${NC}"
        fi
        rm -f "$pid_file"
    else
        # 尝试通过进程名查找并停止
        local found=false
        for p in $(pgrep -f "$process_pattern" 2>/dev/null || true); do
            if [ -n "$p" ]; then
                echo -n "🛑 停止 $service_name (PID: $p)... "
                kill $p 2>/dev/null
                sleep 1
                if ps -p $p > /dev/null 2>&1; then
                    kill -9 $p 2>/dev/null
                fi
                echo -e "${GREEN}✅ 成功${NC}"
                found=true
            fi
        done
        if [ "$found" = false ]; then
            echo -e "${YELLOW}⚠️  $service_name 未运行${NC}"
        fi
    fi
}

# 停止所有服务
stop_service "后端 API (Go)" "$PROJECT_ROOT/logs/backend.pid" "career-api|career.go"
stop_service "前端服务" "$PROJECT_ROOT/logs/frontend.pid" "vite"
stop_service "Whisper 服务" "$PROJECT_ROOT/logs/whisper.pid" "web_app.py"
stop_service "教师 API (Rust)" "$PROJECT_ROOT/logs/teacher.pid" "teacher-api"

echo ""
echo -e "${GREEN}✅ 所有服务已停止${NC}"