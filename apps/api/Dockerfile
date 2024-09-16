FROM node:20-alpine AS base

FROM base AS build-stage

WORKDIR /usr/src/app

COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn

RUN yarn workspaces focus --all

COPY . .

RUN yarn nx build api

FROM base AS production

LABEL git="https://github.com/lehuygiang28/vphim"
LABEL author="lehuygiang28 <lehuygiang28@gmail.com>"
LABEL org.opencontainers.image.maintainer="lehuygiang28 <lehuygiang28@gmail.com>"

USER node

WORKDIR /usr/src/app

COPY --chown=node package.json yarn.lock .yarnrc.yml ./
COPY --chown=node .yarn ./.yarn

RUN yarn workspaces focus --production && yarn cache clean --all

COPY --from=build-stage --chown=node /usr/src/app/dist ./dist

ENV NODE_ENV production

CMD ["node", "dist/apps/api/main"]
