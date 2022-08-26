FROM node:16.16.0 as doc-builder
RUN npm i -g @redocly/openapi-cli
WORKDIR /w
COPY redocly.yaml /w
COPY src/openapi/* /w/src/openapi/
RUN openapi bundle --output dist/openapi.json

FROM gradle:7.5-jdk17 AS builder
WORKDIR /w
COPY ./ /w
RUN --mount=type=cache,target=/home/gradle/.gradle/caches gradle build --no-daemon -x test

FROM openjdk:17-jdk as extractor
WORKDIR /w
COPY bin/extract.sh /w/extract.sh
COPY --from=builder /w/*/build/libs/*.jar /w/
RUN sh ./extract.sh

#FROM openjdk:17-jdk as jwks-provider
FROM gcr.io/distroless/java17-debian11 as jwks-provider
WORKDIR /w
COPY --from=extractor /w/jwks-provider/* /w/
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=80", "org.springframework.boot.loader.JarLauncher"]
HEALTHCHECK --interval=5s --start-period=60s \
    CMD ["java", \
         "-Dloader.main=net.trajano.swarm.gateway.healthcheck.HealthProbe", \
         "org.springframework.boot.loader.PropertiesLauncher" ]
#HEALTHCHECK --interval=5s --start-period=60s \
#    CMD curl -sfo /dev/null http://localhost:8080/actuator/health
USER 5000
EXPOSE 8080

FROM openjdk:17-jdk as sample-service
WORKDIR /w
COPY --from=extractor /w/sample-service/* /w/
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=80", "org.springframework.boot.loader.JarLauncher"]
HEALTHCHECK --interval=5s --start-period=60s \
    CMD curl -sfo /dev/null http://localhost:8080/actuator/health
USER 5000
EXPOSE 8080

FROM openjdk:17-jdk as grpc-service
WORKDIR /w
COPY --from=extractor /w/grpc-service/* /w/
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=80", "org.springframework.boot.loader.JarLauncher"]
HEALTHCHECK --interval=5s --start-period=60s \
    CMD ["java", \
         "-Dloader.main=net.trajano.swarm.sampleservice.HealthProbe", \
         "org.springframework.boot.loader.PropertiesLauncher" ]
# HEALTHCHECK --interval=5s --start-period=60s \
#     CMD curl -sfo /dev/null http://localhost:8080/actuator/health
USER 5000
EXPOSE 8080

#FROM openjdk:17-jdk as gateway
FROM gcr.io/distroless/java17-debian11 as gateway
WORKDIR /w
COPY --from=extractor /w/gateway/* /w/
COPY --from=doc-builder /w/dist/openapi.json /
# ENTRYPOINT ["java", "-XX:MaxRAMPercentage=80", "-Dorg.slf4j.simpleLogger.defaultLogLevel=debug","org.springframework.boot.loader.JarLauncher"]
# ENTRYPOINT ["java","-XX:+AllowRedefinitionToAddDeleteMethods","org.springframework.boot.loader.JarLauncher"]
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=80", "org.springframework.boot.loader.JarLauncher"]
HEALTHCHECK --interval=5s --start-period=60s \
    CMD ["java", "-Dloader.main=net.trajano.swarm.gateway.healthcheck.HealthProbe", "org.springframework.boot.loader.PropertiesLauncher" ]
#HEALTHCHECK --interval=5s --start-period=60s \
#    CMD curl -sfo /dev/null http://localhost:8080/actuator/health
# Must be root in order to access /var/run/docker.sock
# USER 5000
EXPOSE 8080

FROM openjdk:17-jdk-alpine as gateway-alpine
WORKDIR /w
COPY --from=extractor /w/gateway/* /w/
COPY --from=doc-builder /w/dist/openapi.json /
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=80", "org.springframework.boot.loader.JarLauncher"]
# ENTRYPOINT ["java","-XX:+AllowRedefinitionToAddDeleteMethods","org.springframework.boot.loader.JarLauncher"]
#ENTRYPOINT ["java","-Dorg.slf4j.simpleLogger.defaultLogLevel=trace","org.springframework.boot.loader.JarLauncher"]
HEALTHCHECK --interval=5s --start-period=60s \
    CMD wget -qO /dev/null http://localhost:8080/actuator/health
# Must be root in order to access /var/run/docker.sock
# USER 5000
EXPOSE 8080
