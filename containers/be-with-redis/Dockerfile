FROM node:20-alpine AS base

FROM base AS build-stage

WORKDIR /usr/src/app

COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn

RUN yarn workspaces focus --all

COPY . .

RUN yarn nx build be

FROM base AS production

LABEL git="https://github.com/lehuygiang28/vphim"
LABEL author="lehuygiang28 <lehuygiang28@gmail.com>"
LABEL org.opencontainers.image.maintainer="lehuygiang28 <lehuygiang28@gmail.com>"

RUN apk update && \
  apk add --no-cache supervisor redis

WORKDIR /usr/src/app

RUN chown node:node /usr/src/app

RUN mkdir -p ./log
RUN chown node:node ./log

COPY --chown=node package.json yarn.lock .yarnrc.yml ./
COPY --chown=node .yarn ./.yarn
COPY --chown=node ./containers/be-with-redis/supervisord.conf ./supervisord.conf
COPY --chown=node ./containers/be-with-redis/entrypoint.sh ./entrypoint.sh

RUN chmod +x ./entrypoint.sh

RUN yarn workspaces focus --production && yarn cache clean --all

COPY --from=build-stage --chown=node /usr/src/app/dist ./dist

ENV NODE_ENV production

RUN chown node:node /usr/src/app/supervisord.conf && \
  chmod 755 /usr/src/app/supervisord.conf

USER node

ENTRYPOINT ["./entrypoint.sh"]
