#!/bin/sh
set -e
for jar in *.jar
do
  if [ "$( jar tf $jar BOOT-INF/layers.idx )" ]
  then
    DIR=$(basename $jar -0.0.1-SNAPSHOT.jar)
    mkdir $DIR
    java -Djarmode=layertools -jar $jar extract --destination $DIR
  fi
done
