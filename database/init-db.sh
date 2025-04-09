#!/bin/bash
set -e

# Only run seed if in development
if [ "$ENV" = "development" ]; then
    echo "Seeding development data..."
    psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /docker-entrypoint-initdb.d/seed-dev.sql
else
    echo "Production environment detected. Skipping seed data."
fi
