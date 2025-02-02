FROM node:20-alpine AS base

FROM base AS build-stage

WORKDIR /usr/src/app

RUN npm install -g bun
COPY package.json bun.lock ./

RUN bun install

COPY . .

RUN npx nx build api

### Production dependencies stage
FROM base AS production-deps

USER node
WORKDIR /usr/src/app

COPY --chown=node --from=build-stage /usr/src/app/dist ./dist
COPY --chown=node --from=build-stage /usr/src/app/bun.lock ./bun.lock

# Using a generated package.json by webpack that contains only production dependencies used by NestJS
COPY --chown=node --from=build-stage /usr/src/app/dist/apps/api/package.json ./package.json

RUN bun install --production

### Production stage, copies all the build files and removes the development dependencies
FROM base AS production

LABEL git="https://github.com/lehuygiang28/vphim"
LABEL author="lehuygiang28 <lehuygiang28@gmail.com>"
LABEL org.opencontainers.image.maintainer="lehuygiang28 <lehuygiang28@gmail.com>"

USER node
WORKDIR /usr/src/app

COPY --chown=node --from=build-stage /usr/src/app/dist ./dist
COPY --chown=node --from=production-deps /usr/src/app/node_modules ./node_modules

ENV NODE_ENV production

CMD ["node", "dist/apps/api/main"]
