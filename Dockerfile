FROM docker-proxy.devhaus.com/library/gradle:7.4-jdk17 AS builder
COPY ./ ./
RUN --mount=type=cache,target=/home/gradle/.gradle/caches gradle build
