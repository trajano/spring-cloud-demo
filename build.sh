#!/bin/sh
set -e
./gradlew spotlessApply
docker compose build
docker stack deploy -c docker-compose.yml --with-registry-auth --prune ds
docker service update -d --image local/jwks-provider --force ds_jwks-provider
docker service update --image local/gateway --force ds_gateway
