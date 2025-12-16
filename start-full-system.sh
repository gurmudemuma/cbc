#!/bin/bash

echo "🚀 Starting Full Real System with Database Persistence..."

# Start PostgreSQL with persistent volume
docker run -d --name coffee-postgres \
  -p 5432:5432 \
  -e POSTGRES_DB=coffee_export \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres123 \
  -v coffee_data:/var/lib/postgresql/data \
  postgres:15-alpine

sleep 5

# Initialize database schema
docker exec coffee-postgres psql -U postgres -d coffee_export -c "
CREATE TABLE IF NOT EXISTS exports (
  id SERIAL PRIMARY KEY,
  export_id VARCHAR(50) UNIQUE NOT NULL,
  organization VARCHAR(50) NOT NULL,
  quantity INTEGER NOT NULL,
  destination VARCHAR(100) NOT NULL,
  coffee_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  organization VARCHAR(50) NOT NULL,
  role VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (username, organization, role) VALUES 
('admin', 'commercial-bank', 'admin'),
('admin', 'national-bank', 'admin'),
('admin', 'ecta', 'admin'),
('admin', 'ecx', 'admin'),
('admin', 'shipping-line', 'admin'),
('admin', 'custom-authorities', 'admin')
ON CONFLICT (username) DO NOTHING;
"

# Start all APIs with database connection
cd apis/commercial-bank && DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/coffee_export PORT=3001 npm start &
cd ../national-bank && DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/coffee_export PORT=3002 npm start &
cd ../ecta && DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/coffee_export PORT=3003 npm start &
cd ../ecx && DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/coffee_export PORT=3004 npm start &
cd ../shipping-line && DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/coffee_export PORT=3005 npm start &
cd ../custom-authorities && DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/coffee_export PORT=3006 npm start &

echo "✅ Full system started with real database persistence!"
