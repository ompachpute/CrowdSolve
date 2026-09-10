# CrowdSolve Frontend Dockerfile
FROM node:18-alpine AS build

WORKDIR /app

ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Copy package files first for layer caching
COPY package*.json ./
RUN npm install --only=production

# Copy source
COPY . .

# Build
RUN npm run build

# Production server with Nginx
FROM nginx:alpine

# Copy built assets
COPY --from=build /app/build /usr/share/nginx/html

# Copy Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]