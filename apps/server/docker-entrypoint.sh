#!/bin/sh

node app/build/ace.js migration:run --force

# Then exec the original CMD
exec "$@"
