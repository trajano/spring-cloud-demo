FROM gradle:7.4-jdk17 AS builder
WORKDIR /w
COPY ./ /w
RUN --mount=type=cache,target=/home/gradle/.gradle/caches gradle build -x test

FROM openjdk:17-alpine as extractor
WORKDIR /w
COPY extract.sh /w/extract.sh
COPY --from=builder /w/*/build/libs/*.jar /w/
RUN sh ./extract.sh

FROM openjdk:17-alpine as jwks-provider
WORKDIR /w
COPY --from=extractor /w/jwks-provider/* /w/
ENTRYPOINT ["java","org.springframework.boot.loader.JarLauncher"]
EXPOSE 8080

FROM openjdk:17-alpine as sample-service
WORKDIR /w
COPY --from=extractor /w/sample-service/* /w/
ENTRYPOINT ["java","org.springframework.boot.loader.JarLauncher"]
EXPOSE 8080

FROM openjdk:17-alpine as gateway
WORKDIR /w
COPY --from=extractor /w/gateway/* /w/
ENTRYPOINT ["java","org.springframework.boot.loader.JarLauncher"]
HEALTHCHECK --interval=5s --start-period=60s \
    CMD wget -qO /dev/null http://localhost:8080/actuator/health
EXPOSE 8080