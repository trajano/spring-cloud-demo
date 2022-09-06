#!/bin/sh
set -e
set -x
rm buildSrc.jar
rm dynamic-grpc-client-*.jar
rm gateway-common-*.jar
rm spring-redis-region-*.jar
for jar in *.jar
do
  DIR=$(basename $jar -0.0.1-SNAPSHOT.jar)
  mkdir $DIR
  java -Djarmode=layertools -jar $jar extract --destination $DIR
done
