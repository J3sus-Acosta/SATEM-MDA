# ==========================================
# SATEM Helpdesk Core — Multi-stage Dockerfile
# ==========================================

# 1. Etapa de Construcción
FROM node:22-alpine AS builder

WORKDIR /app

# Instalar dependencias necesarias para compilar módulos nativos
RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma/

RUN npm ci

COPY src ./src/
RUN npx prisma generate
RUN npm run build

# 2. Etapa de Producción
FROM node:22-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

ENV NODE_ENV=production
ENV PORT=4000

COPY package*.json ./
COPY prisma ./prisma/

# Instalar solo dependencias de producción
RUN npm ci --omit=dev && npm cache clean --force
RUN npx prisma generate

# Copiar el build compilado
COPY --from=builder /app/dist ./dist

# Usuario no root para máxima seguridad en runtime
USER node

EXPOSE 4000

CMD ["node", "dist/index.js"]
