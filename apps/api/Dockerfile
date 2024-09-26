FROM node:20-alpine AS base

FROM base AS build-stage

WORKDIR /usr/src/app

COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn

RUN yarn workspaces focus --all

COPY . .

RUN yarn nx build api

### Production dependencies stage
FROM base AS production-deps

USER node
WORKDIR /usr/src/app

COPY --chown=node --from=build-stage /usr/src/app/dist ./dist
COPY --chown=node --from=build-stage /usr/src/app/.yarn ./.yarn
COPY --chown=node --from=build-stage /usr/src/app/.yarnrc.yml ./.yarnrc.yml
COPY --chown=node --from=build-stage /usr/src/app/yarn.lock ./yarn.lock

# Using a generated package.json by webpack that contains only production dependencies used by NestJS
COPY --chown=node --from=build-stage /usr/src/app/dist/apps/api/package.json ./package.json

RUN yarn workspaces focus --production && yarn cache clean --all

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
