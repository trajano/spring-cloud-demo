#!/bin/sh
set -x
set -e
./gradlew build
docker stack deploy -c docker-compose.yml --with-registry-auth --prune spring
