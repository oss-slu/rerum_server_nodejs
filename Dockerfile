
FROM node

# Set the working directory inside the container.
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker's build cache.
COPY package*.json ./

# Install application dependencies.
RUN npm install

# Copy the rest of the application code.
COPY . .

# Expose the port the app runs on.
EXPOSE 3001

# The command to start the application.
CMD ["node", "./bin/rerum_v1.js"]