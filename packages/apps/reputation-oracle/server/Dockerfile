FROM node:22.14-slim
ARG APP_PATH=packages/apps/reputation-oracle/server

# Create app directory
WORKDIR /usr/src/app

# Copy expected yarn dist
COPY .yarn ./.yarn
COPY .yarnrc.yml ./

# Copy files for deps installation
COPY package.json yarn.lock ./
COPY ${APP_PATH}/package.json ./${APP_PATH}/

# Some deps are referenced as "workspace:*",
# so we need to copy and build them
COPY packages/core ./packages/core
COPY packages/sdk ./packages/sdk

RUN yarn install

# Copy base TS config that is required to build packages
COPY tsconfig.base.json ./
# Build libs
RUN yarn build:libs

# Copy everything else
COPY ${APP_PATH} ./${APP_PATH}

WORKDIR ./${APP_PATH}
RUN yarn build

# Start the server using the build
CMD [ "yarn", "start:prod" ]