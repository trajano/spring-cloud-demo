#!/bin/sh
git clean -fdx expo-app packages/*
pushd packages/react-hooks
git clean -fdx .
popd
yarn
yarn workspaces run prepare

