#!/bin/sh
set -e
./gradlew spotlessApply
docker compose build
docker stack deploy -c docker-compose.yml --with-registry-auth --prune ds
# docker service update -d --image local/jwks-provider --force ds_jwks-provider
# docker service update -d --image local/grpc-service --force ds_grpc-sample
docker service update --image docker.local/gateway --force ds_gateway
