FROM node:20-alpine AS builder
WORKDIR /app
COPY services/shipping-line/package*.json ./
COPY services/shipping-line/tsconfig.json ./tsconfig.json
COPY services/shipping-line/src ./src
COPY services/shared ../shared
COPY services/tsconfig.base.json ../tsconfig.base.json
RUN npm install --legacy-peer-deps || npm install
RUN npm run build || npx tsc
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/../shared ./shared
RUN addgroup -g 1001 nodejs && adduser -S -u 1001 nodejs && mkdir -p logs wallet && chown -R nodejs:nodejs /app
USER nodejs
EXPOSE 3007
HEALTHCHECK CMD node -e "require('http'^).get('http://localhost:3007/health', r =^> process.exit(r.statusCode === 200 ? 0 : 1^)^)"
CMD ["node", "dist/shipping-line/src/index.js"]
