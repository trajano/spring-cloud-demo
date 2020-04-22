#!/bin/sh
if [ -e /d/p/trajano.net ]
then
    docker stack deploy -c trajano-swarm.yml --with-registry-auth --prune spring
else
    docker stack deploy -c docker-compose.yml --with-registry-auth --prune spring
fi
