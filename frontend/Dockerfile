# /frontend/Dockerfile

# STAGE 1: Build the React application
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy source code and build the app
# Note: Ensure your React app relies on environment variables (like VITE_API_URL) 
# pointing to your VM's public IP for WebSockets/API calls.
COPY . .
RUN npm run build

# STAGE 2: Serve with Nginx
FROM nginx:alpine

# Remove default Nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy the built React app from the previous stage
COPY --from=build /app/dist /usr/share/nginx/html
# Note: If you are using Create React App instead of Vite, change '/app/dist' to '/app/build'

# Add a simple Nginx configuration to support React Router (SPA fallback)
RUN echo "server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files \$uri \$uri/ /index.html; \
    } \
}" > /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]