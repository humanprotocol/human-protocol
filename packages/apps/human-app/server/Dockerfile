FROM node:24.13-slim
ARG APP_PATH=packages/apps/human-app/server

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
COPY packages/libs ./packages/libs

RUN yarn workspaces focus @apps/human-app-server

# Copy base TS config that is required to build packages
COPY tsconfig.base.json ./
# Build libs (scoped)
RUN yarn workspaces foreach -Rpt --from @apps/human-app-server --exclude @apps/human-app-server run build

# Copy everything else
COPY ${APP_PATH} ./${APP_PATH}

WORKDIR ./${APP_PATH}
RUN yarn build

# Start the server using the build
CMD [ "yarn", "start:prod" ]
