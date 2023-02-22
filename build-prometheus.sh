#!/bin/sh
set -e
docker compose build prometheus
# ( echo -e "version: '3.9'\n"; docker-compose config )| docker stack deploy -c - --with-registry-auth --prune ds
#docker service update -d --image local/jwks-provider --force ds_jwks-provider
#docker service update --image local/gateway --force ds_gateway
docker service update --image docker.local/prometheus --force ds_prometheus
