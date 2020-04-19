#!/bin/sh
set -x
set -e
./gradlew :cloud-config:clean :cloud-config:build

docker service update -d --force --image trajano/cloud-config:latest spring_configserver
#docker service update -d --force --image localhost.localdomain:5000/cloud-gateway:latest spring_api
