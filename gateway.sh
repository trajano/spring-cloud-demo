#!/bin/sh
set -x
set -e
./gradlew :cloud-gateway:clean :cloud-gateway:build

#docker service update -d --force --image trajano/cloud-gateway:latest spring_api
docker service update -d --force --image localhost.localdomain:5000/cloud-gateway:latest spring_api
