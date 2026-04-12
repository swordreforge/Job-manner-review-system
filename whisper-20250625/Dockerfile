FROM python:3.11-slim

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY requirements-web.txt .

# 安装 Python 依赖
RUN pip install --no-cache-dir -r requirements-web.txt

# 复制应用代码
COPY web_app.py .
COPY whisper/ ./whisper/

# 暴露端口
EXPOSE 8000

# 设置环境变量
ENV PYTHONUNBUFFERED=1
ENV MODEL_NAME=base

# 启动服务
CMD ["uvicorn", "web_app:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]