FROM node:18-alpine

WORKDIR /app

# Copy shared dependencies
COPY api/shared ./api/shared
COPY package*.json ./

# Copy ESW API
COPY api/esw ./api/esw

# Install dependencies
RUN npm install

# Build TypeScript
WORKDIR /app/api/esw
RUN npm run build

EXPOSE 3008

CMD ["npm", "start"]

