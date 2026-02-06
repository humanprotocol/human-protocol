FROM node:24.13-slim

# curl is needed for healthcheck
RUN apt-get update && apt-get install -y curl

WORKDIR /usr/src/app

ARG CORE_VERSION=latest

# Use repo-managed Yarn distribution
COPY .yarn ./.yarn
COPY .yarnrc.yml ./

RUN corepack enable
RUN yarn init -y
RUN yarn add @human-protocol/core@${CORE_VERSION}

WORKDIR /usr/src/app/node_modules/@human-protocol/core
RUN yarn install

EXPOSE 8545
CMD ["yarn", "local"]
