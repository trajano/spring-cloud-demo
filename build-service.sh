#!/bin/sh
set -e
./gradlew spotlessApply
docker compose build sample
docker-compose config | docker stack deploy -c - --with-registry-auth --prune ds
#docker service update -d --image local/jwks-provider --force ds_jwks-provider
#docker service update --image local/gateway --force ds_gateway
docker service update --image local/sample-service --force ds_sample
