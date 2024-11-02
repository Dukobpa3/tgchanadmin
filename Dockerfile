# Stage 1: Build Stage
FROM node:18 AS builder

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the project files
COPY . .

# Compile TypeScript
RUN npm run build

# Stage 2: Production Stage
FROM node:18-slim

# Set the working directory
WORKDIR /app

# Copy only the compiled code and node_modules from the build stage
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Set NODE_ENV to production
ENV NODE_ENV=production

# Expose the port the app runs on
EXPOSE 8080

# Start the application
CMD ["node", "./build/server.js"]
