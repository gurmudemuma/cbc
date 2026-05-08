FROM node:20-alpine

WORKDIR /app

# Copy shared folder first and install its dependencies
COPY services/shared ../shared
WORKDIR /shared
RUN npm install --legacy-peer-deps || npm install

# Go back to app directory
WORKDIR /app

# Copy service files
COPY services/national-bank/package*.json ./
COPY services/national-bank/tsconfig.json ./tsconfig.json
COPY services/national-bank/src ./src
COPY services/tsconfig.base.json ../tsconfig.base.json

# Install service dependencies
RUN npm install --legacy-peer-deps || npm install

# Install ts-node and tsconfig-paths globally
RUN npm install -g ts-node typescript tsconfig-paths

# Create directories
RUN mkdir -p logs wallet

ENV NODE_PATH=/shared/node_modules:/app/node_modules

EXPOSE 3004

HEALTHCHECK CMD node -e "require('http').get('http://localhost:3004/health', r => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["ts-node", "-r", "tsconfig-paths/register", "src/index.ts"]
