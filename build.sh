#!/bin/sh
set -e
docker compose build
docker stack deploy -c docker-compose.yml ds
