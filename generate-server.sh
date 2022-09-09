#!/bin/bash

docker run --rm \
  --user ${UID}:${UID} \
  -v ${PWD}:/local openapitools/openapi-generator-cli generate \
  -i /local/openapi.yaml \
  -g rust-server \
  -o /local/out/rust