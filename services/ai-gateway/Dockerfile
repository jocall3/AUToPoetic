# Dockerfile for the AI Gateway Microservice

# Stage 1: Install all dependencies, including dev dependencies
# This stage is optimized for caching. It only re-runs if package.json or package-lock.json changes.
FROM node:20-alpine AS deps

# Set the working directory in the container
WORKDIR /app

# Copy package files and install all dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: Build the TypeScript application
# This stage uses the dependencies from the previous stage and copies the source code to build the project.
FROM node:20-alpine AS builder

WORKDIR /app

# Copy node_modules from the deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy the entire monorepo source code. This allows the build process to access shared types/configs.
COPY . .

# Compile the TypeScript source code for the ai-gateway service into JavaScript.
# This assumes the service has its own tsconfig.json which specifies an output directory (e.g., 'dist').
# The root tsconfig.server.json can be extended by the service-specific tsconfig.
RUN npx tsc -p services/ai-gateway/tsconfig.json

# After building, remove dev dependencies to prepare for the production image.
# This significantly reduces the size of the node_modules folder that will be copied to the final stage.
RUN npm prune --production

# Stage 3: Create the final, lean production image
# This stage starts from a fresh, lightweight Node.js image and copies only the necessary artifacts.
FROM node:20-alpine AS production

WORKDIR /app

# Set the environment to production to enable optimizations in Node.js and dependent libraries.
ENV NODE_ENV=production

# Copy the pruned production node_modules from the builder stage.
COPY --from=builder /app/node_modules ./node_modules

# Copy the compiled JavaScript application from the builder stage.
COPY --from=builder /app/services/ai-gateway/dist ./dist

# Copy the root package.json. Some libraries might need it to function correctly at runtime.
COPY --from=builder /app/package.json ./package.json

# The AI Gateway service will listen on this port.
# Using an environment variable makes it easy to change the port without rebuilding the image.
ENV PORT=8080
EXPOSE $PORT

# Add a healthcheck to ensure the service is running correctly
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD [ "wget", "-q", "-O", "/dev/null", "http://localhost:8080/health" ]

# Define the command to run the application.
# This starts the Node.js server, pointing to the compiled entrypoint.
CMD ["node", "dist/index.js"]
