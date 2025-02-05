FROM node:18-slim
ARG APP_PATH=packages/apps/job-launcher/server

# Create app directory
WORKDIR /usr/src/app

# Copy expected yarn dist
COPY .yarn ./.yarn
COPY .yarnrc ./
# Copy files for deps installation
COPY package.json yarn.lock ./
COPY ${APP_PATH}/package.json ./${APP_PATH}/package.json
# Some deps are referenced as "*", so we need to build them
COPY tsconfig.json ./
COPY packages/core ./packages/core
COPY packages/sdk ./packages/sdk

RUN yarn install

# Copy everything else to ensure proper build process
COPY . .

WORKDIR ./${APP_PATH}
RUN yarn build

# Start the server using the build
CMD [ "yarn", "start:prod" ]