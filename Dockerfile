# Stage 1: Build
FROM node:24.14-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig*.json ./
COPY src/ ./src/
RUN npm run build

# Stage 2: Runtime
FROM node:24.14-alpine AS runtime
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=builder /app/build ./build
EXPOSE 3000
USER node
CMD ["node", "build/main.js"]
