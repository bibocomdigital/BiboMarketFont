
# =========================
# Base commune
# =========================
FROM node:20-alpine AS base

WORKDIR /app
RUN apk add --no-cache curl

# =========================
# Dépendances
# =========================
FROM base AS deps

# 3️⃣ Installer les dépendances
COPY package*.json ./

# 4️⃣ Copier le code
RUN npm ci

# =========================
# Source commune
# =========================
FROM deps AS src

COPY . .

EXPOSE 3000
CMD ["npm", "run", "start"]

# =========================
# BUILD (prod)
# =========================
FROM src AS build

RUN npm run build

# =========================
# RUNTIME (prod)
# =========================
FROM base AS prod

ENV NODE_ENV=production

COPY --from=build /app/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./

EXPOSE 3000


CMD ["npm", "run", "start"]