# Base stage
FROM node:20-alpine AS base

# Build stage
FROM base AS build-stage
WORKDIR /usr/src/app

COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn

RUN yarn workspaces focus --all

COPY . .

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

# Install Redis and Supervisor
RUN apk update && \
  apk add --no-cache supervisor redis curl

# Install cloudflared
RUN curl -L --output cloudflared https://github.com/cloudflare/cloudflared/releases/download/2024.10.0/cloudflared-linux-amd64 && \
  chmod +x cloudflared && \
  mv cloudflared /usr/local/bin/

WORKDIR /usr/src/app

RUN npm install -g pm2

RUN chown node:node /usr/src/app
# Create log directory
RUN mkdir -p ./log
RUN chown node:node ./log

# Copy necessary files
COPY --chown=node:node --from=build-stage /usr/src/app/containers/be-redis-cloudflared/ecosystem.config.js ./ecosystem.config.js
COPY --chown=node:node ./containers/be-redis-cloudflared/supervisord.conf ./supervisord.conf
COPY --chown=node:node ./containers/be-redis-cloudflared/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# Copy built app and production dependencies
COPY --chown=node:node --from=build-stage /usr/src/app/dist ./dist
COPY --chown=node:node --from=production-deps /usr/src/app/node_modules ./node_modules


# Copy schema.gql file and set correct permissions
COPY --chown=node:node --from=build-stage /usr/src/app/schema.gql ./schema.gql
RUN chmod 644 ./schema.gql

ENV NODE_ENV production

# Set proper permissions
RUN chown node:node /usr/src/app/supervisord.conf && \
  chmod 755 /usr/src/app/supervisord.conf

USER node

ENTRYPOINT ["./entrypoint.sh"]
