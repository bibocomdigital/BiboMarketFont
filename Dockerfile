# =========================
# Base commune
# =========================
FROM node:22-alpine AS base

WORKDIR /app
RUN apk add --no-cache libc6-compat

# =========================
# Dépendances
# =========================
FROM base AS deps

COPY package*.json ./
RUN npm ci

# =========================
# BUILD (prod)
# =========================
FROM base AS build

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_BACKEND_URL
ARG NEXT_PUBLIC_FRONTEND_URL
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ARG NEXT_PUBLIC_ENV
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_FRONTEND_URL=$NEXT_PUBLIC_FRONTEND_URL
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID
ENV NEXT_PUBLIC_ENV=$NEXT_PUBLIC_ENV


ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# =========================
# RUN dev
# =========================
FROM deps AS run_dev

ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0

COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev"]

# =========================
# RUNTIME (prod)
# =========================
FROM base AS prod

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
