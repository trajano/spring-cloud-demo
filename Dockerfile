FROM gradle:7.4-jdk17 AS builder
COPY ./buildSrc/ \
  ./gateway/build.gradle \
  ./sample-service/build.gradle \
  ./settings.gradle \
  ./
RUN gradle dependencies
COPY ./ ./
RUN gradle build
