#!/bin/bash
# Database initialization script that runs all migrations in order

set -e

echo "Starting database initialization..."

# Wait for PostgreSQL to be ready
until pg_isready -U postgres; do
  echo "Waiting for PostgreSQL to be ready..."
  sleep 2
done

echo "PostgreSQL is ready. Running migrations..."

# Run all migration files in order
for migration in /docker-entrypoint-initdb.d/migrations/*.sql; do
  if [ -f "$migration" ]; then
    echo "Running migration: $(basename $migration)"
    psql -U postgres -d coffee_export_db -f "$migration"
  fi
done

echo "Database initialization complete!"
