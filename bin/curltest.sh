#!/bin/bash
set -e
access_token=$(curl  -s --location --request POST 'http://localhost:28082/auth' --header 'Content-Type: application/json' --header 'Accept: application/json' --data-raw '{
    "username": "good",
    "authenticated": true,
    "accessTokenExpiresInMillis": 100000,
    "refreshTokenExpiresInMillis": 2000000
}' | jq -r '.access_token')

curl -s --location --request POST 'http://localhost:28082/grpc/Echo/echo' \
--header 'Accept: application/json' \
--header "Authorization: Bearer $access_token" \
--header 'Content-Type: application/json' \
--data-raw '{
    "message": "FFbarsdfasf"
}'

curl -s --location --request POST 'http://localhost:28082/sample/Echo/echo' \
--header 'Accept: application/json' \
--header "Authorization: Bearer $access_token" \
--header 'Content-Type: application/json' \
--data-raw '{
    "message": "FFbarsdfasf"
}'

curl -sL --location --request POST 'http://localhost:28082/whoami' \
--header 'Accept: application/json' \
--header "Authorization: Bearer $access_token" \

