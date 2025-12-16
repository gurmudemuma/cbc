FROM node:20-alpine
WORKDIR /app
COPY ../package*.json ./
COPY ../commercial-bank ./commercial-bank/
COPY ../shared ./shared/
RUN npm install --workspace=commercial-bank --legacy-peer-deps
CMD ["node", "commercial-bank/src/index.js"]
