FROM rust:1.75-alpine AS builder

RUN apk add --no-cache musl-dev openssl-dev pkgconfig

WORKDIR /app
COPY Cargo.toml Cargo.lock ./
RUN mkdir .cargo && cp Cargo.toml .cargo/

COPY src ./src
RUN cargo build --release

FROM alpine:3.19

RUN apk add --no-cache ca-certificates

WORKDIR /app
COPY --from=builder /app/target/release/xunfei-asr-server /usr/local/bin/

CMD ["xunfei-asr-server"]
