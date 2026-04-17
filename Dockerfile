FROM rust:1.75-alpine AS builder

RUN apk add --no-cache musl-dev openssl-dev pkgconfig

WORKDIR /app
COPY . .
RUN cargo build --release

FROM alpine:3.19

RUN apk add --no-cache ca-certificates openssl

WORKDIR /app
COPY --from=builder /app/target/release/teacher-api /usr/local/bin/

CMD ["teacher-api"]
