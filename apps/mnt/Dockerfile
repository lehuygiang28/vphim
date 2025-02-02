FROM node:20-alpine AS base

FROM base AS build-stage

USER root

# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat

WORKDIR /usr/src/app

RUN npm install -g bun
COPY package.json bun.lock ./

RUN bun install

COPY . .

ENV NEXT_SHARP_PATH "/usr/src/app/node_modules/sharp"
RUN npx nx build mnt --skip-nx-cache

FROM base AS production

LABEL git="https://github.com/lehuygiang28/vphim"
LABEL author="lehuygiang28 <lehuygiang28@gmail.com>"
LABEL org.opencontainers.image.maintainer="lehuygiang28 <lehuygiang28@gmail.com>"

WORKDIR /usr/src/app

COPY --from=build-stage --chown=node:node /usr/src/app/apps/mnt/.next/standalone/apps/mnt ./
COPY --from=build-stage --chown=node:node /usr/src/app/apps/mnt/.next/standalone/package.json ./
COPY --from=build-stage --chown=node:node /usr/src/app/apps/mnt/.next/static ./.next/static
COPY --from=build-stage --chown=node:node /usr/src/app/apps/mnt/.next/standalone/node_modules ./node_modules
COPY --from=build-stage --chown=node:node /usr/src/app/apps/mnt/public ./public

RUN rm -rf /usr/src/app/.env

USER node

ENV NODE_ENV production
ENV HOSTNAME "0.0.0.0"
ENV NEXT_SHARP_PATH "/usr/src/app/node_modules/sharp"

CMD ["node", "server.js"]
