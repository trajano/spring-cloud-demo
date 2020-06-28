#!/bin/sh
set -x
set -e
./gradlew -q :spring-cloud-docker-swarm:clean :cloud-gateway:clean :spring-cloud-docker-swarm:build :cloud-gateway:build

docker service update -d --force --image trajano/cloud-gateway:latest spring_api
#docker service update -d --force --image localhost.localdomain:5000/cloud-gateway:latest spring_api
