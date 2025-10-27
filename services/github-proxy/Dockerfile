# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package.json and package-lock.json and install dependencies
COPY package*.json ./
RUN npm install --frozen-lockfile

# Copy source code
COPY . .

# Build the TypeScript application
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Copy only necessary files from the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Define environment variable for the port, with a default
ENV PORT 3001

# Expose the application port
EXPOSE ${PORT}

# Command to run the application
# Assuming the compiled entry point is dist/index.js
CMD ["node", "dist/index.js"]
