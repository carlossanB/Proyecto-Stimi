# ==========================================
# Stage 1: Build & Transpile TypeScript
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependencias necesarias para la compilación
COPY package*.json ./
RUN npm ci

# Copiar configuraciones y código fuente
COPY tsconfig*.json nest-cli.json ./
COPY src ./src

# Compilar la aplicación NestJS a JavaScript en /app/dist
RUN npm run build

# ==========================================
# Stage 2: Production Runtime
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Instalar únicamente dependencias de producción
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copiar el código transpilado desde la fase de build
COPY --from=builder /app/dist ./dist

# Crear directorios de uploads requeridos y asignar permisos al usuario node
RUN mkdir -p /app/uploads/informes /app/uploads/firmas && \
    chown -R node:node /app

# Ejecutar como usuario no root
USER node

# Exponer el puerto del backend NestJS
EXPOSE 3000

# Iniciar servidor en producción
CMD ["node", "dist/main.js"]
