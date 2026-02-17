#!/bin/sh

node build/ace.js migration:run --force
node build/ace.js db:seed

# Then exec the original CMD
exec "$@"
