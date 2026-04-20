FROM ubuntu:24.04

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY xunfei-asr-server .

RUN chmod +x ./xunfei-asr-server

EXPOSE 8000

CMD ["./xunfei-asr-server", "--server-host", "0.0.0.0", "--server-port", "8000"]