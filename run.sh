#!/bin/bash
set -e

running=$(docker inspect --format="{{ .State.Running }}" cyb-z-backend 2>/dev/null || true)
if [ "$running" != "" ]; then
    printf "The container already exists. Do you want to remove it? (y/n) "
    read remove

    if [ "$remove" != "y" ]; then
        echo "Aborting"
        exit 1
    fi

    docker rm -f cyb-z-backend 2>/dev/null || true
fi

docker_args=''
if [ "$(hostname -s)" == "scw-78960e" ]; then
    docker_args="--net cyb"
else
    echo "Running in development mode"
    docker_args="-p 8000:8000"
fi

test -f reports.json || touch reports.json

docker run \
  $docker_args \
  --name cyb-z-backend \
  -d --restart=always \
  -v "$(pwd)/archive":/usr/src/app/archive \
  -v "$(pwd)/reports.json":/usr/src/app/reports.json \
  cyb/z-backend
