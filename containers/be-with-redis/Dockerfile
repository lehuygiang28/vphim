# Base stage
FROM node:20-alpine AS base

# Build stage
FROM base AS build-stage
WORKDIR /usr/src/app

RUN npm install -g bun
COPY package.json bun.lock ./

RUN bun install

COPY . .

RUN npx nx build api

# Production dependencies stage
FROM base AS production-deps
WORKDIR /usr/src/app

COPY --chown=node:node --from=build-stage /usr/src/app/bun.lock ./bun.lock

# Using a generated package.json by webpack that contains only production dependencies used by NestJS
COPY --chown=node:node --from=build-stage /usr/src/app/dist/apps/api/package.json ./package.json

RUN bun install --production

# Final production stage
FROM base AS production

LABEL git="https://github.com/lehuygiang28/vphim"
LABEL author="lehuygiang28 <lehuygiang28@gmail.com>"
LABEL org.opencontainers.image.maintainer="lehuygiang28 <lehuygiang28@gmail.com>"

# Install Redis and Supervisor
RUN apk update && \
	apk add --no-cache supervisor redis

# COPY --from=redis:7-alpine3.20 /usr/local/bin/redis-cli /usr/local/bin/redis-cli

WORKDIR /usr/src/app

RUN chown node:node /usr/src/app
# Create log directory
RUN mkdir -p ./log
RUN chown node:node ./log

# Copy necessary files
COPY --chown=node:node ./containers/be-with-redis/supervisord.conf ./supervisord.conf
COPY --chown=node:node ./containers/be-with-redis/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# Copy built app and production dependencies
COPY --chown=node:node --from=build-stage /usr/src/app/dist ./dist
COPY --chown=node:node --from=production-deps /usr/src/app/node_modules ./node_modules

ENV NODE_ENV production

# Set proper permissions
RUN chown node:node /usr/src/app/supervisord.conf && \
	chmod 755 /usr/src/app/supervisord.conf

USER node

ENTRYPOINT ["./entrypoint.sh"]
