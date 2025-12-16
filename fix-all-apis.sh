#!/bin/bash

echo "🔧 Starting all APIs with real database connection..."

# Use existing postgres on port 5435
DB_URL="postgresql://postgres:postgres123@localhost:5435/coffee_export"

# Initialize schema in existing database
docker exec postgres psql -U postgres -d coffee_export -c "
CREATE TABLE IF NOT EXISTS exports (
  id SERIAL PRIMARY KEY,
  export_id VARCHAR(50) UNIQUE NOT NULL,
  organization VARCHAR(50) NOT NULL,
  quantity INTEGER NOT NULL,
  destination VARCHAR(100) NOT NULL,
  coffee_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);" 2>/dev/null

# Start APIs with correct paths and database
for org in commercial-bank national-bank ecta ecx shipping-line custom-authorities; do
  if [ -d "apis/$org" ]; then
    echo "Starting $org API..."
    cd apis/$org
    case $org in
      commercial-bank) PORT=3001 ;;
      national-bank) PORT=3002 ;;
      ecta) PORT=3003 ;;
      ecx) PORT=3004 ;;
      shipping-line) PORT=3005 ;;
      custom-authorities) PORT=3006 ;;
    esac
    DATABASE_URL="$DB_URL" PORT=$PORT npm start &
    cd ../..
  fi
done

echo "✅ All APIs started with database persistence!"
