# Build stage
FROM node:alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM node:alpine

WORKDIR /app
COPY --from=builder /app/build ./build
COPY package*.json ./
RUN npm install --production

ENV NODE_ENV=production

CMD ["node", "build/server.js"]
