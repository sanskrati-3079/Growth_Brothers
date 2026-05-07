# Build stage — compile the Vite app.
FROM node:20-alpine AS build

WORKDIR /app

# Build-time API base URL. Pass via:
#   docker build --build-arg VITE_API_BASE_URL=https://api.example.com .
ARG VITE_API_BASE_URL=http://localhost:8000
ARG VITE_BACKEND_URL=http://localhost:8000
ARG VITE_AI_CONTENT_AGENT_URL=http://localhost:8000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_AI_CONTENT_AGENT_URL=$VITE_AI_CONTENT_AGENT_URL

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Runtime stage — serve the static build with nginx.
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
