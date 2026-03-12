FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev --prefer-offline || npm install --omit=dev

# Copy source code
COPY src/ ./src/

# Expose port
EXPOSE 3009

# Start service
CMD ["node", "src/index.js"]
