# frontend/Dockerfile
FROM node:18

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Copy app source code
COPY . .

# Build the app
RUN npm run build


# Expose the port
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
