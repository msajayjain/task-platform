FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/types/package*.json ./packages/types/
RUN npm ci

COPY . .
ARG DATABASE_URL=postgresql://postgres:postgres@localhost:5432/task_platform
ENV DATABASE_URL=$DATABASE_URL
RUN npm run prisma:generate -w apps/api && npm run build -w packages/types && npm run build -w apps/api

EXPOSE 3001
CMD ["npm", "run", "start", "-w", "apps/api"]
