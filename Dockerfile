ARG RUST_IMAGE=rust:1.94-alpine
FROM ${RUST_IMAGE} AS builder

ARG ALPINE_MIRROR=dl-cdn.alpinelinux.org
RUN sed -i "s/dl-cdn.alpinelinux.org/${ALPINE_MIRROR}/g" /etc/apk/repositories \
	&& apk add --no-cache musl-dev pkgconfig

ARG CARGO_REGISTRY_MIRROR=sparse+https://rsproxy.cn/index/
RUN mkdir -p /root/.cargo \
	&& printf '[source.crates-io]\nreplace-with = "mirror"\n\n[source.mirror]\nregistry = "%s"\n\n[net]\ngit-fetch-with-cli = true\n' "${CARGO_REGISTRY_MIRROR}" > /root/.cargo/config.toml

WORKDIR /app
COPY Cargo.toml Cargo.lock ./
RUN cargo fetch --locked

COPY . .
RUN cargo build --release --locked --offline

ARG ALPINE_RUNTIME_IMAGE=alpine:3.19
FROM ${ALPINE_RUNTIME_IMAGE}

ARG ALPINE_MIRROR=dl-cdn.alpinelinux.org
RUN sed -i "s/dl-cdn.alpinelinux.org/${ALPINE_MIRROR}/g" /etc/apk/repositories \
	&& apk add --no-cache ca-certificates

WORKDIR /app
COPY --from=builder /app/target/release/teacher-api /usr/local/bin/

CMD ["teacher-api"]
