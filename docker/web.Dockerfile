FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
COPY packages/types/package*.json ./packages/types/
COPY packages/ui/package*.json ./packages/ui/
RUN npm ci

COPY . .
RUN npm run build -w packages/types && npm run build -w packages/ui && npm run build -w apps/web

EXPOSE 3000
CMD ["npm", "run", "start", "-w", "apps/web"]
