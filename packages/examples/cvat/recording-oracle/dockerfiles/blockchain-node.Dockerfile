# TODO: make this shared and part of local setup
FROM node:18-slim

# wget is needed for healthcheck
RUN apt-get update && apt-get install -y wget

WORKDIR /usr/src/app

# Copy expected yarn dist
COPY .yarn ./.yarn
COPY .yarnrc ./
# Copy files for deps installation
COPY package.json yarn.lock ./

COPY tsconfig.json ./
COPY packages/core ./packages/core
RUN yarn workspace @human-protocol/core install --ignore-scripts
RUN yarn workspace @human-protocol/core build

EXPOSE 8545
CMD yarn workspace @human-protocol/core local
