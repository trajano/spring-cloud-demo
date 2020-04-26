#!/bin/sh
set -x
set -e
./gradlew :sample-service:clean :sample-service:build

docker service update -d --force --image trajano/sample-service:latest spring_sample
#docker service update -d --force --image localhost.localdomain:5000/cloud-gateway:latest spring_api
