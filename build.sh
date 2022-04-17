#!/bin/sh
docker compose build
docker stack deploy -c docker-compose.yml ds
