#!/bin/sh
set -x
set -e
#./gradlew :cloud-auth:clean :cloud-auth:build
./gradlew :cloud-auth:build

docker service update -d --force --image trajano/cloud-auth:latest spring_auth
#docker service update -d --force --image localhost.localdomain:5000/cloud-gateway:latest spring_api
