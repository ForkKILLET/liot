#!/bin/sh
set -eu

echo "[entrypoint] running database migrations..."
npm run db:migrate

echo "[entrypoint] starting app..."
exec "$@"
