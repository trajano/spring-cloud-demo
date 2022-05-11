#!/bin/sh
set -e
set -x
# artillery run -q --output build/report.json --environment localhost-direct-heavy-load gateway/src/test/artillery/functional-test.yml
# artillery run --output build/report.json --environment localhost-direct-heavy-load gateway/src/test/artillery/functional-test.yml
# artillery run --output build/report.json --environment localhost-direct-heavy-load gateway/src/test/artillery/kill-ping.yml
artillery run --output build/report.json --environment localhost-direct-heavy-load gateway/src/test/artillery/happy-path.yml

artillery report build/report.json