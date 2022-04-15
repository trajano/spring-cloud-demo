FROM docker-proxy.devhaus.com/library/gradle:7.4-jdk17 AS builder
COPY ./settings.gradle \
  ./
COPY ./buildSrc ./buildSrc
RUN gradle build
COPY ./gateway/build.gradle ./gateway/build.gradle
COPY ./sample-service/build.gradle ./sample-service/build.gradle 
RUN gradle dependencies
COPY ./ ./
RUN gradle build
# build || true
# RUN find /home/ -type f
# COPY ./ ./
# RUN gradle --offline build
