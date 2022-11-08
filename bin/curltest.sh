#!/bin/bash
set -e
BASE_URI=${BASE_URI:-http://localhost:28082}
auth_token=$(curl  -s --location --request POST "${BASE_URI}/auth" --header 'Content-Type: application/json' --header 'Accept: application/json' --data-raw '{
    "username": "good",
    "authenticated": true,
    "accessTokenExpiresInMillis": 100000,
    "refreshTokenExpiresInMillis": 2000000
}')
access_token=$(echo $auth_token | jq -r '.access_token')
refresh_token=$(echo $auth_token | jq -r '.refresh_token')

curl -s --location --request POST "${BASE_URI}/grpc/Echo/echo" \
--header 'Accept: application/json' \
--header "Authorization: Bearer $access_token" \
--header 'Content-Type: application/json' \
--data-raw '{
    "message": "FFbarsdfasf"
}'

curl -s --location --request POST "${BASE_URI}/sample/Echo/echo" \
--header 'Accept: application/json' \
--header "Authorization: Bearer $access_token" \
--header 'Content-Type: application/json' \
--data-raw '{
    "message": "FFbarsdfasf"
}'

curl -sL --location --request POST "${BASE_URI}/whoami" \
--header 'Accept: application/json' \
--header "Authorization: Bearer $access_token"

sleep 10s
curl -s --location --request POST "${BASE_URI}/refresh" \
--header 'Accept: application/json' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-raw "grant_type=refresh_token&refresh_token=${refresh_token}"

#curl -s --location --request POST "${BASE_URI}/grpc/Echo/echoStream" \
#--header 'Accept: text/event-stream' \
#--header "Authorization: Bearer $access_token" \
#--header 'Content-Type: application/json' \
#-N \
#--data-raw '{
#    "message": "FFbarsdfasf"
#}'
