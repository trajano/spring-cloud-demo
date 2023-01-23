#!/bin/sh
git submodule update --init --recursive
git clean -fdx expo-app packages/*
pushd packages/react-hooks
git clean -fdx .
popd
yarn
yarn workspaces run prepare

