.PHONY: help build up down restart logs ps clean backup restore

help:
	@echo "可用命令:"
	@echo "  make build        - 构建所有 Docker 镜像"
	@echo "  make up           - 启动所有服务"
	@echo "  make down         - 停止所有服务"
	@echo "  make restart      - 重启所有服务"
	@echo "  make logs         - 查看所有服务日志"
	@echo "  make ps           - 查看服务状态"
	@echo "  make clean        - 清理所有容器和卷"
	@echo "  make backup       - 备份数据库"
	@echo "  make restore      - 恢复数据库"
	@echo "  make dev          - 开发模式启动（带源码挂载）"
	@echo "  make prod         - 生产模式启动"
	@echo ""
	@echo "服务命令:"
	@echo "  make logs-<service>  - 查看特定服务日志"
	@echo "  make restart-<service>  - 重启特定服务"
	@echo ""
	@echo "示例:"
	@echo "  make logs-backend   - 查看后端日志"
	@echo "  make restart-whisper - 重启 Whisper 服务"

build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down

restart:
	docker-compose restart

logs:
	docker-compose logs -f

ps:
	docker-compose ps

clean:
	docker-compose down -v
	docker system prune -f

dev:
	docker-compose -f docker-compose.dev.yml up -d

prod:
	docker-compose up -d

backup:
	@echo "备份数据库到 backup_$(shell date +%Y%m%d_%H%M%S).sql"
	docker-compose exec mysql mysqldump -uroot -p123456zj career_db > backup_$(shell date +%Y%m%d_%H%M%S).sql

restore:
	@read -p "输入备份文件名: " file; \
	docker-compose exec -T mysql mysql -uroot -p123456zj career_db < $$file

# 服务特定命令
logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

logs-whisper:
	docker-compose logs -f whisper

logs-mysql:
	docker-compose logs -f mysql

logs-redis:
	docker-compose logs -f redis

restart-backend:
	docker-compose restart backend

restart-frontend:
	docker-compose restart frontend

restart-whisper:
	docker-compose restart whisper

restart-mysql:
	docker-compose restart mysql

restart-redis:
	docker-compose restart redis