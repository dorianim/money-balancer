FROM rust:1.64.0-alpine3.16 as build

WORKDIR /build
COPY . .
RUN cargo build --release

FROM scratch

COPY --from=build /build/target/release/money-balancer /money-balancer
ENTRYPOINT ["/money-balancer"]