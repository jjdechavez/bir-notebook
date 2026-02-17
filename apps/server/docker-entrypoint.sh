#!/bin/sh

node build/ace.js migration:run --force

# Then exec the original CMD
exec "$@"
