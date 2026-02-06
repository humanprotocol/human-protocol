FROM node:24.13-slim

# curl is needed for healthcheck
RUN apt-get update && apt-get install -y curl

WORKDIR /usr/src/app

ARG CORE_VERSION=latest

RUN npm init -y
RUN npm install -g yarn
RUN yarn add @human-protocol/core@${CORE_VERSION}

WORKDIR /usr/src/app/node_modules/@human-protocol/core
# Install dev dependencies needed for hardhat scripts
RUN yarn install

EXPOSE 8545
CMD ["yarn", "local"]
