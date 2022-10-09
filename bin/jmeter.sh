#!/bin/sh
set -e
set -x
C=$(docker run \
  --memory 1g \
  -e JVM_XMN=256 \
  -e JVM_XMS=800 \
  -e JVM_XMX=800 \
  --add-host=host.docker.internal:host-gateway \
  -v ${PWD}/gateway/src/test/jmeter:/work:ro \
  -d \
  justb4/jmeter -n -t /work/load-test.jmx \
  -JbaseUri=http://host.docker.internal:28082 \
  -JmaxConcurrentUsers=500 \
  -JloopCount=20 \
  -l /results.jtl -e -o /results)
docker attach $C
mkdir -p gateway/build/jmeter/results/
docker cp $C:/results.jtl gateway/build/jmeter/results.jtl
docker cp $C:/results/ gateway/build/jmeter/
docker rm $C
	
