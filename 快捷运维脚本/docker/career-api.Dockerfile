FROM ubuntu:24.04

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY career-api .
COPY etc/ ./etc/

RUN chmod +x ./career-api

EXPOSE 8088

VOLUME ["/app/img"]

RUN mkdir -p /app/logs /app/img
CMD ["./career-api", "-f", "etc/career-api.yaml", "--skip-all"]