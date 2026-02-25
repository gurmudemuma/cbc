FROM node:20-alpine AS builder
WORKDIR /app
COPY services/custom-authorities/package*.json ./
COPY services/custom-authorities/tsconfig.json ./tsconfig.json
COPY services/custom-authorities/src ./src
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
EXPOSE 3005
HEALTHCHECK CMD node -e "require('http'^).get('http://localhost:3005/health', r =^> process.exit(r.statusCode === 200 ? 0 : 1^)^)"
CMD ["node", "dist/custom-authorities/src/index.js"]
