# TODO: make this shared and part of local setup
FROM node:22.14-slim

# curl is needed for healthcheck
RUN apt-get update && apt-get install -y curl

WORKDIR /usr/src/app

# Copy expected yarn dist
COPY .yarn ./.yarn
COPY .yarnrc.yml ./
# Copy files for deps installation
COPY package.json yarn.lock ./

COPY tsconfig.base.json ./
COPY packages/core ./packages/core
RUN yarn workspace @human-protocol/core install
RUN yarn workspace @human-protocol/core build

EXPOSE 8545
CMD yarn workspace @human-protocol/core local
