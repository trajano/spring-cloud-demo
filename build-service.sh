#!/bin/sh
set -e
./gradlew spotlessApply
docker compose build sample grpc-sample
# ( echo -e "version: '3.9'\n"; docker-compose config )| docker stack deploy -c - --with-registry-auth --prune ds
#docker service update -d --image local/jwks-provider --force ds_jwks-provider
#docker service update --image local/gateway --force ds_gateway
docker service update --image local/sample-service --force ds_sample
docker service update --image local/grpc-service --force ds_grpc-sample
