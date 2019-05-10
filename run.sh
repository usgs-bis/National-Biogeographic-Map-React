#!/usr/bin/env bash
if [ "$1" == "static" ]; then
    set -x
    docker-compose -f docker-compose.static.yml up --build
else
    set -x
    docker-compose up --build
fi
