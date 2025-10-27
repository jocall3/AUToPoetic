# Stage 1: Build Stage
# Use a Node.js LTS image that includes build tools.
# Naming this stage 'builder' for later reference.
FROM node:20 AS builder

# Set the working directory inside the container.
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to leverage Docker's layer caching.
# This step is separate so that dependencies are only re-installed if these files change.
COPY package.json package-lock.json ./

# Install all dependencies, including devDependencies required for the build process.
# Using 'npm ci' for deterministic builds based on package-lock.json.
RUN npm ci

# Copy the rest of the application's source code into the container.
COPY . .

# Execute the build script defined in package.json to compile TypeScript to JavaScript.
# This will typically create a 'dist' directory.
RUN npm run build


# Stage 2: Production Stage
# Use a lightweight and more secure Node.js Alpine image for the final container.
FROM node:20-alpine

# Set the working directory for the production application.
WORKDIR /usr/src/app

# Set the environment to production. This can disable debugging features and
# cause some libraries to run in an optimized mode.
ENV NODE_ENV=production

# Create a non-root user and group for security best practices.
# Running as a non-root user minimizes potential damage if the container is compromised.
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy package.json and package-lock.json to install production dependencies.
COPY package.json package-lock.json ./

# Install only production dependencies.
# The --omit=dev flag skips devDependencies, resulting in a smaller image.
RUN npm ci --omit=dev

# Copy the compiled application code from the 'builder' stage.
COPY --from=builder /usr/src/app/dist ./dist

# Change ownership of the application files to the non-root user.
RUN chown -R appuser:appgroup .

# Switch to the non-root user.
USER appuser

# Expose the port the BFF will listen on. Using a common port like 8080.
EXPOSE 8080

# The command to start the BFF server.
# This assumes the main entry point after compilation is 'dist/server.js'.
CMD ["node", "dist/server.js"]
