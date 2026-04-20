FROM ubuntu:24.04

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY teacher-api .

RUN chmod +x ./teacher-api

EXPOSE 8081

VOLUME ["/app/data"]

CMD ["./teacher-api"]