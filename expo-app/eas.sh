#!/bin/bash
npm install -g eas-cli
eas build --profile development --platform all --no-wait --non-interactive --clear-cache
eas build --profile development-simulator --platform ios --no-wait --non-interactive --clear-cache
eas build --profile preview --platform all --no-wait --non-interactive --clear-cache
eas update --non-interactive --auto
