#!/bin/sh
docker stack deploy -c docker-compose.yml --with-registry-auth --prune spring
