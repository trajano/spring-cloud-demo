FROM node:16.15.0 as doc-builder
RUN npm i -g @redocly/openapi-cli
WORKDIR /w
COPY redocly.yaml /w
COPY src/openapi/spring-cloud-docker-swarm.yaml /w/src/openapi/spring-cloud-docker-swarm.yaml
RUN openapi bundle --output dist/openapi.json

FROM gradle:7.4-jdk17 AS builder
WORKDIR /w
COPY ./ /w
RUN --mount=type=cache,target=/home/gradle/.gradle/caches gradle build -x test

FROM openjdk:17-jdk as extractor
WORKDIR /w
COPY extract.sh /w/extract.sh
COPY --from=builder /w/*/build/libs/*.jar /w/
RUN sh ./extract.sh

FROM openjdk:17-jdk as jwks-provider
WORKDIR /w
COPY --from=extractor /w/jwks-provider/* /w/
ENTRYPOINT ["java","org.springframework.boot.loader.JarLauncher"]
HEALTHCHECK --interval=5s --start-period=60s \
    CMD curl -sfo /dev/null http://localhost:8080/actuator/health
EXPOSE 8080

FROM openjdk:17-jdk as sample-service
WORKDIR /w
COPY --from=extractor /w/sample-service/* /w/
ENTRYPOINT ["java","org.springframework.boot.loader.JarLauncher"]
EXPOSE 8080

FROM openjdk:17-jdk as gateway
WORKDIR /w
COPY --from=extractor /w/gateway/* /w/
COPY --from=doc-builder /w/dist/openapi.json /
ENTRYPOINT ["java","org.springframework.boot.loader.JarLauncher"]
HEALTHCHECK --interval=5s --start-period=60s \
    CMD curl -sfo /dev/null http://localhost:8080/actuator/health
EXPOSE 8080