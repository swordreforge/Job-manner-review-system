#!/bin/bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

ARTIFACTS_DIR="$PROJECT_ROOT/构建产物"
DATASET_FILE="$PROJECT_ROOT/项目数据集.sql"
DOCKER_DIR="$SCRIPT_DIR/docker"
DEPLOY_DIR="$PROJECT_ROOT/部署"

BACKEND_ARTIFACT="$ARTIFACTS_DIR/主服务后端/career-api"
BACKEND_CONFIG="$ARTIFACTS_DIR/主服务后端/etc/career-api.yaml.docker"
BACKEND_CONFIG_LOCAL="$ARTIFACTS_DIR/主服务后端/etc/career-api.yaml"
ADMIN_ARTIFACT="$ARTIFACTS_DIR/管理端/teacher-api"
VOICE_ARTIFACT="$ARTIFACTS_DIR/语音服务/xunfei-asr-server"

info()    { echo -e "${BLUE}[INFO]${NC} $*"; }
success() { echo -e "${GREEN}[OK]${NC} $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

check_prerequisites() {
    info "检查系统环境..."

    if ! command -v docker &> /dev/null; then
        error "未找到 docker，请先安装 Docker"
    fi

    if ! docker info &> /dev/null; then
        error "Docker 守护进程未运行，请先启动 Docker"
    fi

    if docker compose version &> /dev/null 2>&1; then
        COMPOSE_CMD="docker compose"
    elif command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    else
        error "未找到 docker compose 或 docker-compose，请先安装"
    fi

    info "使用 Compose 命令: $COMPOSE_CMD"
    success "系统环境检查通过"
}

check_artifacts() {
    info "检查构建产物..."

    if [ ! -f "$BACKEND_ARTIFACT" ]; then
        error "主服务后端二进制文件不存在: $BACKEND_ARTIFACT"
    fi
    if [ ! -f "$BACKEND_CONFIG" ] && [ ! -f "$BACKEND_CONFIG_LOCAL" ]; then
        error "主服务配置文件不存在"
    fi
    if [ ! -f "$ADMIN_ARTIFACT" ]; then
        error "管理端二进制文件不存在: $ADMIN_ARTIFACT"
    fi
    if [ ! -f "$VOICE_ARTIFACT" ]; then
        error "语音服务二进制文件不存在: $VOICE_ARTIFACT"
    fi
    if [ ! -f "$ARTIFACTS_DIR/前端/index.html" ]; then
        error "前端构建产物不存在: $ARTIFACTS_DIR/前端/index.html"
    fi
    if [ ! -f "$DATASET_FILE" ]; then
        error "项目数据集不存在: $DATASET_FILE"
    fi

    success "构建产物检查通过"
}

extract_config() {
    info "从构建产物自动提取配置..."

    local config_file="$BACKEND_CONFIG"
    [ ! -f "$config_file" ] && config_file="$BACKEND_CONFIG_LOCAL"

    MYSQL_DATABASE=$(grep -oP 'DataSource:.*?/(\w+)\?' "$config_file" 2>/dev/null | grep -oP '/\K\w+(?=\?)' || echo "career_db")
    if [ -z "$MYSQL_DATABASE" ] || [ "$MYSQL_DATABASE" = "" ]; then
        MYSQL_DATABASE="career_db"
    fi

    DB_DATASET=$(grep -oP 'USE\s+\`(\w+)\`' "$DATASET_FILE" 2>/dev/null | head -1 | grep -oP '\`\K\w+(?=\`)' || echo "")
    if [ -n "$DB_DATASET" ] && [ "$DB_DATASET" != "" ]; then
        MYSQL_DATABASE="$DB_DATASET"
        info "从数据集检测到数据库名: $MYSQL_DATABASE"
    fi

    AI_PROVIDER=$(grep -oP 'Provider:\s*\K\S+' "$config_file" 2>/dev/null || echo "deepseek")
    AI_MODEL=$(grep -oP 'Model:\s*\K\S+' "$config_file" 2>/dev/null || echo "deepseek-chat")
    AI_BASE_URL=$(awk '/^AI:/,/^[A-Z]/{print}' "$config_file" | grep -oP 'BaseURL:\s*"?\K[^"\s]+' | head -1 || echo "https://api.deepseek.com/v1")
    if [ -z "$AI_BASE_URL" ]; then
        AI_BASE_URL="https://api.deepseek.com/v1"
    fi
    AI_API_KEY_FROM_CONFIG=$(awk '/^AI:/,/^[A-Z]/{print}' "$config_file" | grep -oP 'ApiKey:\s*\K\S+' || echo "")

    local config_port=$(grep -oP 'Port:\s*\K\d+' "$config_file" 2>/dev/null | head -1 || echo "8088")
    if [ -n "$config_port" ] && [ "$config_port" != "8088" ]; then
        CAREER_API_PORT="$config_port"
    fi

    success "配置提取完成: DB=$MYSQL_DATABASE, AI=$AI_PROVIDER/$AI_MODEL, Port=${CAREER_API_PORT:-8088}"
}

prompt_config() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  职业规划系统 Docker 快速部署配置${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""

    read -p "MySQL root 密码 [career2026]: " input_pw
    MYSQL_ROOT_PASSWORD="${input_pw:-career2026}"

    read -p "MySQL 数据库名 [$MYSQL_DATABASE]: " input_db
    MYSQL_DATABASE="${input_db:-$MYSQL_DATABASE}"

    read -p "主服务端口 [8088]: " input_port
    CAREER_API_PORT="${input_port:-8088}"

    read -p "管理端端口 [8081]: " input_tport
    TEACHER_API_PORT="${input_tport:-8081}"

    read -p "语音服务端口 [8000]: " input_vport
    VOICE_API_PORT="${input_vport:-8000}"

    read -p "Nginx 端口 [8080]: " input_nport
    NGINX_PORT="${input_nport:-8080}"

    read -p "前端端口 [3000]: " input_fport
    FRONTEND_PORT="${input_fport:-3000}"

    read -p "JWT 密钥 [career2026secret]: " input_jwt
    JWT_SECRET="${input_jwt:-career2026secret}"

    echo ""
    echo -e "${YELLOW}--- AI 服务配置 (影响核心功能) ---${NC}"
    read -p "AI 提供商 [$AI_PROVIDER]: " input_aip
    AI_PROVIDER="${input_aip:-$AI_PROVIDER}"

    read -p "AI API Key [${AI_API_KEY_FROM_CONFIG:-未配置}]: " input_aikey
    AI_API_KEY="${input_aikey:-${AI_API_KEY_FROM_CONFIG}}"

    read -p "AI 模型 [$AI_MODEL]: " input_aim
    AI_MODEL="${input_aim:-$AI_MODEL}"

    read -p "AI Base URL [$AI_BASE_URL]: " input_aiurl
    AI_BASE_URL="${input_aiurl:-$AI_BASE_URL}"

    echo ""
    echo -e "${YELLOW}--- 讯飞语音服务配置 ---${NC}"
    read -p "讯飞 APP ID [140c88e2]: " input_xfid
    XUNFEI_APP_ID="${input_xfid:-140c88e2}"

    read -p "讯飞 API Key [63101bc8a895022a2f12d0875f909ee6]: " input_xfkey
    XUNFEI_API_KEY="${input_xfkey:-63101bc8a895022a2f12d0875f909ee6}"

    read -p "讯飞 API Secret [ZGRiNWVjZTRhMjQ0NmE0YTRkOGMxZWEx]: " input_xfsec
    XUNFEI_API_SECRET="${input_xfsec:-ZGRiNWVjZTRhMjQ0NmE0YTRkOGMxZWEx}"

    echo ""
    echo -e "${GREEN}配置摘要:${NC}"
    echo "  MySQL: root@localhost:${MYSQL_PORT:-3307}/$MYSQL_DATABASE"
    echo "  主服务: 0.0.0.0:$CAREER_API_PORT"
    echo "  管理端: 0.0.0.0:$TEACHER_API_PORT"
    echo "  语音: 0.0.0.0:$VOICE_API_PORT"
    echo "  Nginx: 0.0.0.0:$NGINX_PORT"
    echo "  前端:  0.0.0.0:$FRONTEND_PORT"
    echo "  AI: $AI_PROVIDER/$AI_MODEL @ $AI_BASE_URL"
    echo ""
    read -p "确认启动部署? [Y/n]: " confirm
    if [[ "$confirm" =~ ^[Nn] ]]; then
        echo "已取消部署"
        exit 0
    fi
}

setup_deploy_dir() {
    info "准备部署目录..."

    if [ -d "$DEPLOY_DIR" ]; then
        info "检测到已有部署目录，正在停止旧服务..."
        cd "$DEPLOY_DIR"
        $COMPOSE_CMD -p career down 2>/dev/null || true
        cd - > /dev/null
    fi

    rm -rf "$DEPLOY_DIR"
    mkdir -p "$DEPLOY_DIR"/{config,mysql-init,nginx,frontend}

    cp "$DATASET_FILE" "$DEPLOY_DIR/mysql-init/01-init.sql"
    success "项目数据集已复制到 MySQL 初始化目录"

    cp "$DOCKER_DIR/nginx.conf" "$DEPLOY_DIR/nginx/nginx.conf"
    cp "$DOCKER_DIR/frontend.conf" "$DEPLOY_DIR/nginx/frontend.conf"

    local frontend_dist="$ARTIFACTS_DIR/前端"
    if [ -d "$frontend_dist" ] && [ -f "$frontend_dist/index.html" ]; then
        cp -r "$frontend_dist/." "$DEPLOY_DIR/frontend/"
        success "前端构建产物已复制"
    else
        error "未找到前端构建产物: $frontend_dist"
    fi

    cp "$DOCKER_DIR/docker-compose.yml" "$DEPLOY_DIR/docker-compose.yml"

    success "部署目录准备完成"
}

prepare_build_contexts() {
    info "准备 Docker 构建上下文..."

    mkdir -p "$DEPLOY_DIR"/{career-api,teacher-api,voice-api}

    cp "$BACKEND_ARTIFACT" "$DEPLOY_DIR/career-api/career-api"
    chmod +x "$DEPLOY_DIR/career-api/career-api"
    if [ -d "$ARTIFACTS_DIR/主服务后端/etc" ]; then
        cp -r "$ARTIFACTS_DIR/主服务后端/etc" "$DEPLOY_DIR/career-api/"
    fi

    cp "$ADMIN_ARTIFACT" "$DEPLOY_DIR/teacher-api/teacher-api"
    chmod +x "$DEPLOY_DIR/teacher-api/teacher-api"

    cp "$VOICE_ARTIFACT" "$DEPLOY_DIR/voice-api/xunfei-asr-server"
    chmod +x "$DEPLOY_DIR/voice-api/xunfei-asr-server"

    local backend_arch
    backend_arch=$(file -b "$BACKEND_ARTIFACT" 2>/dev/null | grep -oP 'x86-64|aarch64|ARM' || echo "unknown")
    info "主服务后端架构: $backend_arch"
    local admin_arch
    admin_arch=$(file -b "$ADMIN_ARTIFACT" 2>/dev/null | grep -oP 'x86-64|aarch64|ARM' || echo "unknown")
    info "管理端架构: $admin_arch"

    success "构建上下文准备完成"
}

generate_config() {
    info "生成服务配置..."

    cat > "$DEPLOY_DIR/config/career-api.yaml" << EOF
Name: career-api
Host: 0.0.0.0
Port: ${CAREER_API_PORT:-8088}
Mode: pro
Timeout: 120000
Log:
    ServiceName: career-api
    Mode: console
    Level: info
    KeepDays: 7
    Encoding: plain
Mysql:
    DataSource: root:${MYSQL_ROOT_PASSWORD}@tcp(mysql:3306)/${MYSQL_DATABASE}?charset=utf8mb4&parseTime=true&loc=Local
    MaxOpenConns: 100
    MaxIdleConns: 10
    ConnMaxLifetime: 3600
Redis:
    Host: redis:6379
    Type: node
    Pass: ""
    DB: 0
    PoolSize: 100
CacheRedis:
    Host: redis:6379
    Pass: ""
    DB: 1
    PoolSize: 50
Auth:
    AccessSecret: "${JWT_SECRET}"
    AccessExpire: 86400
AI:
    Provider: ${AI_PROVIDER}
    ApiKey: ${AI_API_KEY}
    Model: ${AI_MODEL}
    BaseURL: "${AI_BASE_URL}"
    Timeout: 60
Prometheus:
    Host: 0.0.0.0
    Port: 9091
CORS:
    Origins:
        - "*"
    Methods:
        - GET
        - POST
        - PUT
        - DELETE
        - OPTIONS
    Headers:
        - Content-Type
        - Authorization
        - X-Requested-With
        - Accept
        - Cache-Control
RateLimit:
    TokensPerSecond: 100
    Burst: 200
CircuitBreaker:
    ForceOpen: false
    SleepWindow: 5000
    ErrorPercentThreshold: 50
Avatar:
    SavePath: "./img"
    BaseURL: "http://localhost:${CAREER_API_PORT:-8088}/img"
    MaxFileSize: 5242880
EOF

    success "career-api 配置已生成"
}

generate_env() {
    info "生成环境变量文件..."

    cat > "$DEPLOY_DIR/.env" << EOF
COMPOSE_PROJECT_NAME=career
MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}
MYSQL_DATABASE=${MYSQL_DATABASE}
MYSQL_PORT=3307
REDIS_PORT=6379
CAREER_API_PORT=${CAREER_API_PORT:-8088}
TEACHER_API_PORT=${TEACHER_API_PORT:-8081}
VOICE_API_PORT=${VOICE_API_PORT:-8000}
FRONTEND_PORT=${FRONTEND_PORT:-3000}
NGINX_PORT=${NGINX_PORT:-8080}
JWT_SECRET=${JWT_SECRET}
AI_PROVIDER=${AI_PROVIDER}
AI_API_KEY=${AI_API_KEY}
AI_MODEL=${AI_MODEL}
AI_BASE_URL=${AI_BASE_URL}
XUNFEI_APP_ID=${XUNFEI_APP_ID}
XUNFEI_API_KEY=${XUNFEI_API_KEY}
XUNFEI_API_SECRET=${XUNFEI_API_SECRET}
EOF

    success ".env 文件已生成"
}

build_images() {
    info "构建 Docker 镜像..."

    docker build -t career-api:latest \
        -f "$DOCKER_DIR/career-api.Dockerfile" \
        "$DEPLOY_DIR/career-api" || error "构建 career-api 镜像失败"
    success "career-api 镜像构建完成"

    docker build -t career-teacher-api:latest \
        -f "$DOCKER_DIR/teacher-api.Dockerfile" \
        "$DEPLOY_DIR/teacher-api" || error "构建 teacher-api 镜像失败"
    success "teacher-api 镜像构建完成"

    docker build -t career-voice-api:latest \
        -f "$DOCKER_DIR/voice-api.Dockerfile" \
        "$DEPLOY_DIR/voice-api" || error "构建 voice-api 镜像失败"
    success "voice-api 镜像构建完成"

    info "清理构建上下文..."
    rm -rf "$DEPLOY_DIR/career-api" "$DEPLOY_DIR/teacher-api" "$DEPLOY_DIR/voice-api"
    success "构建上下文已清理"
}

start_services() {
    info "优化系统参数..."

    if [ -w /proc/sys/vm/overcommit_memory ]; then
        echo 1 > /proc/sys/vm/overcommit_memory 2>/dev/null || true
    elif command -v sysctl &> /dev/null; then
        sudo sysctl -w vm.overcommit_memory=1 &> /dev/null || true
    fi

    info "启动服务..."

    cd "$DEPLOY_DIR"

    $COMPOSE_CMD -p career up -d || error "启动服务失败"

    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  服务启动成功!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
echo "服务访问地址:"
    echo "  前端页面:      http://localhost:${FRONTEND_PORT:-3000}"
    echo "  主服务 API:    http://localhost:${CAREER_API_PORT:-8088}"
    echo "  管理后台:       http://localhost:${TEACHER_API_PORT:-8081}"
    echo "  语音服务:      http://localhost:${VOICE_API_PORT:-8000}"
    if [ "${NGINX_PORT:-8080}" != "80" ]; then
        echo "  Nginx 统一入口: http://localhost:${NGINX_PORT}"
    else
        echo "  Nginx 统一入口: http://localhost"
    fi
    echo ""
    echo "数据连接:"
    echo "  MySQL:  root@localhost:${MYSQL_PORT:-3307}/$MYSQL_DATABASE"
    echo "  Redis:  localhost:6379"
    echo ""
    echo "管理命令:"
    echo "  查看状态: cd $DEPLOY_DIR && $COMPOSE_CMD -p career ps"
    echo "  查看日志: cd $DEPLOY_DIR && $COMPOSE_CMD -p career logs -f"
    echo "  停止服务: cd $DEPLOY_DIR && $COMPOSE_CMD -p career down"
    echo "  重启服务: cd $DEPLOY_DIR && $COMPOSE_CMD -p career restart"
    echo ""
    echo "数据盘路径:"
    echo "  MySQL 数据:   docker volume ls | grep mysql"
    echo "  Redis 数据:   docker volume ls | grep redis"
    echo "  上传文件:     docker volume ls | grep upload"
    echo ""

    info "等待 MySQL 初始化数据集..."
    local max_wait=60
    local waited=0
    while [ $waited -lt $max_wait ]; do
        if docker exec career-mysql mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" -e "USE ${MYSQL_DATABASE};" &> /dev/null; then
            success "MySQL 数据集初始化完成"
            return
        fi
        sleep 2
        waited=$((waited + 2))
        echo -n "."
    done
    echo ""
    warn "MySQL 初始化等待超时，请手动检查: docker exec -it career-mysql mysql -uroot -p"
}

main() {
    echo -e "${BLUE}"
    echo "  ╔══════════════════════════════════════╗"
    echo "  ║   职业规划系统 Docker 快速部署脚本   ║"
    echo "  ║   (基于构建产物，无需编译)           ║"
    echo "  ╚══════════════════════════════════════╝"
    echo -e "${NC}"

    check_prerequisites
    check_artifacts
    extract_config
    prompt_config
    setup_deploy_dir
    prepare_build_contexts
    generate_config
    generate_env
    build_images
    start_services
}

main "$@"