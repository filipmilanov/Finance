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

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]


# ---------- Build ----------
FROM deps AS build

WORKDIR /app

COPY . .

RUN npm run build


# ---------- Production ----------
FROM nginx:alpine AS production

COPY --from=build /app/dist /usr/share/nginx/html

# ---------- See nginx.conf for more information ----------
COPY nginx.conf /etc/nginx/conf.d/default.conf 

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]