# 多阶段构建：编译阶段
FROM rust:1.75-alpine AS builder

# 安装构建依赖
RUN apk add --no-cache \
    musl-dev \
    pkgconfig \
    openssl-dev \
    ffmpeg-dev

WORKDIR /app

# 复制 Cargo 配置
COPY Cargo.toml Cargo.lock ./

# 创建虚拟的 src/main.rs 以预编译依赖
RUN mkdir src && \
    echo "fn main() {}" > src/main.rs && \
    cargo build --release && \
    rm -rf src

# 复制源代码
COPY src ./src

# 构建应用
RUN cargo build --release

# 运行阶段
FROM alpine:3.19

# 安装运行时依赖
RUN apk add --no-cache \
    ffmpeg \
    ca-certificates

WORKDIR /app

# 从构建阶段复制二进制文件
COPY --from=builder /app/target/release/xunfei-asr-server .

# 复制环境变量示例
COPY .env.example .env.example

# 创建非 root 用户
RUN addgroup -g 1000 appuser && \
    adduser -D -u 1000 -G appuser appuser && \
    chown -R appuser:appuser /app

USER appuser

# 暴露端口
EXPOSE 8000

# 设置环境变量
ENV SERVER_HOST=0.0.0.0
ENV SERVER_PORT=8000

# 启动应用
CMD ["./xunfei-asr-server"]