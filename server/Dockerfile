# ---------- Dependencies ----------
FROM node:22-alpine AS deps

WORKDIR /app

COPY package*.json ./

RUN npm ci


# ---------- Development ----------
FROM node:22-alpine AS development

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY . .

EXPOSE 4000

CMD ["npm", "run", "dev"]


# ---------- Build ----------
FROM deps AS build

WORKDIR /app

COPY . .

RUN npm run build

# Remove development dependencies
RUN npm prune --omit=dev


# ---------- Production ----------
FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

EXPOSE 4000

CMD ["node", "dist/index.js"]