# Base stage
FROM node:20-alpine AS base

# Build stage
FROM base AS build-stage
WORKDIR /usr/src/app

COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn

RUN yarn workspaces focus --all

COPY --chown=node:node . .

RUN yarn nx build api

# Production dependencies stage
FROM base AS production-deps
WORKDIR /usr/src/app

COPY --chown=node:node package.json yarn.lock .yarnrc.yml ./
COPY --chown=node:node .yarn ./.yarn
COPY --chown=node:node --from=build-stage /usr/src/app/dist/apps/api/package.json ./package.json

RUN yarn workspaces focus --production && yarn cache clean --all

# Final production stage
FROM base AS production

LABEL git="https://github.com/lehuygiang28/vphim"
LABEL author="lehuygiang28 <lehuygiang28@gmail.com>"
LABEL org.opencontainers.image.maintainer="lehuygiang28 <lehuygiang28@gmail.com>"

# Install Redis and dependencies for cloudflared
RUN apk update && \
  apk add --no-cache redis curl

WORKDIR /usr/src/app

# Install cloudflared
RUN curl -L --output cloudflared https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 && \
  chmod +x cloudflared && \
  mv cloudflared /usr/local/bin/

# Install PM2
RUN npm install -g pm2 dotenv-cli

# Copy built app and production dependencies
COPY --chown=node:node --from=build-stage /usr/src/app/dist ./dist
COPY --chown=node:node --from=production-deps /usr/src/app/node_modules ./node_modules

# Copy necessary files
COPY --chown=node:node --from=build-stage /usr/src/app/containers/be-redis-cloudflared/ecosystem.config.js ./ecosystem.config.js
COPY --chown=node:node --from=build-stage /usr/src/app/containers/be-redis-cloudflared/entrypoint.sh ./entrypoint.sh

# Copy schema.gql file and set correct permissions
COPY --chown=node:node --from=build-stage /usr/src/app/schema.gql ./schema.gql
RUN chmod 644 ./schema.gql

ENV NODE_ENV production

USER node

CMD ["/bin/sh", "./entrypoint.sh"]
