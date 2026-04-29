#!/bin/sh
set -e

echo "Substituting BACKEND_URL: $BACKEND_URL"
envsubst '${BACKEND_URL}' < /etc/nginx/nginx.conf > /tmp/nginx.conf
mv /tmp/nginx.conf /etc/nginx/nginx.conf

exec nginx -g "daemon off;"