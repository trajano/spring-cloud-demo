#!/bin/sh
set -e
docker compose build
docker stack deploy -c docker-compose.yml --with-registry-auth --prune ds
docker service update --image local/gateway --force ds_gateway