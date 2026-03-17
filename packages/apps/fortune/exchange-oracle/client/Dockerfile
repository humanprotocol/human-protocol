# Using bullseye instead of slim because it needs Python and build tools for node-gyp
FROM node:24.13-bullseye
ARG APP_PATH=packages/apps/fortune/exchange-oracle/client

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

RUN yarn workspaces focus @apps/fortune-exchange-oracle-client

# Copy base TS config that is required to build packages
COPY tsconfig.base.json ./
# Build libs (scoped)
RUN yarn workspaces foreach -Rpt --from @apps/fortune-exchange-oracle-client --exclude @apps/fortune-exchange-oracle-client run build

# Copy everything else
COPY ${APP_PATH} ./${APP_PATH}

WORKDIR ./${APP_PATH}
RUN yarn build

# Start the server using the build
CMD [ "yarn", "start:prod" ]
