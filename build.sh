#!/bin/sh
set -x
set -e
./gradlew build
./deploy.sh
