#!/bin/bash
set -e
npm install -g eas-cli
yarn tsc
eas update --non-interactive --auto
