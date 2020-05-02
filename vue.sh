#!/bin/sh
set -x
set -e
#./gradlew :cloud-auth:clean :cloud-auth:build
./gradlew :vue-app:build

docker service update -d --force --image trajano/cloud-vue-app:latest spring_vue
#docker service update -d --force --image localhost.localdomain:5000/cloud-gateway:latest spring_api
