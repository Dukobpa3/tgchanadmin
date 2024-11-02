# Build stage
FROM node:23-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM node:23-alpine

WORKDIR /app
COPY --from=builder /app/build ./build
COPY package*.json ./
RUN npm ci --only=production && rm -rf /var/cache/apk/*

ENV NODE_ENV=production

CMD ["node", "build/server.js"]
