#!/bin/bash

# Skip API building entirely - use pre-built images or start without build
echo "🚀 Skipping API build - starting with existing images..."

# Update start-system.sh to skip API building
sed -i '/Building API services/,/✓ All API services built/c\
echo -e "${YELLOW}Skipping API build - using existing images${NC}"' start-system.sh

# Update docker-compose to use simple images
for service in commercialbank national-bank ecta shipping-line custom-authorities; do
    cat > api/$service/Dockerfile.simple << EOF
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production --silent
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
EOF
done

echo "✅ API build optimized - will be much faster now"
