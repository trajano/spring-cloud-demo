FROM docker-proxy.devhaus.com/library/gradle:7.4-jdk17 AS builder
COPY ./settings.gradle \
  ./
COPY ./buildSrc ./buildSrc
RUN gradle build
COPY ./build.gradle ./build.gradle
COPY ./gateway/build.gradle ./gateway/build.gradle
COPY ./sample-service/build.gradle ./sample-service/build.gradle 
RUN gradle dependencies
COPY ./ ./
RUN gradle build
