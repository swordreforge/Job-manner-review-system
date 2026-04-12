# 构建阶段
FROM golang:1.21-alpine AS builder

# 设置工作目录
WORKDIR /build

# 安装必要的工具
RUN apk add --no-cache git

# 复制 go mod 文件
COPY go.mod go.sum ./

# 下载依赖
RUN go mod download

# 复制源代码
COPY . .

# 构建应用
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o career-api career.go

# 运行阶段
FROM alpine:latest

# 安装必要的运行时依赖
RUN apk --no-cache add ca-certificates tzdata

# 设置时区
ENV TZ=Asia/Shanghai

WORKDIR /root/

# 从构建阶段复制二进制文件
COPY --from=builder /build/career-api .
COPY --from=builder /build/etc ./etc
COPY --from=builder /build/img ./img

# 创建必要的目录
RUN mkdir -p img

# 暴露端口
EXPOSE 8088 9091

# 运行应用
CMD ["./career-api", "-f", "etc/career-api.yaml"]