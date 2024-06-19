# frontend/Dockerfile
# Stage 1: Build
FROM node:18 AS builder

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Copy app source code
COPY . .

# Build the app
RUN npm run build

# Stage 2: Production
FROM node:18

# Create app directory
WORKDIR /usr/src/app

# Copy built files from builder stage
COPY --from=builder /usr/src/app .

# Install only production dependencies
RUN npm install --only=production

# Expose the port
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
