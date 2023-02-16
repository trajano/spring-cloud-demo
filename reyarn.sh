#!/bin/sh
set -e
set -x
git submodule update --init --recursive
git clean -fdx expo-app packages/*
pushd packages/react-hooks
git clean -fdx .
popd
# rm -f package-lock.json
pnpm i
# npm run prepare --workspaces
# npm run prepare
# yarn
# yarn workspaces run prepare

