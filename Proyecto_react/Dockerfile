# ==========================================
# Stage 1: Build React SPA
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Argumentos de compilación para variables de Vite
ARG VITE_API_URL
ARG VITE_WHATSAPP_NUMBER
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WHATSAPP_NUMBER=$VITE_WHATSAPP_NUMBER

RUN npm run build

# ==========================================
# Stage 2: Serve with Nginx Alpine
# ==========================================
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
