# Use the official Node.js image with the specific version (22.12.0)
FROM node:22.12.0-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy the package.json and package-lock.json (if you have one) into the container
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy the rest of your application code into the container
COPY . .

# Copy the .env file into the container
COPY .env .env

# Build the Next.js app
RUN npm run build

# Expose the port the app will run on
EXPOSE 3000

# Start the Next.js app
CMD ["npm", "start"]
