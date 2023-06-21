FROM node:16.20.0-buster

ARG JOB_LAUNCHER_SERVER_URL

WORKDIR /usr/src/app

COPY package.json yarn.lock ./

RUN yarn

COPY ./public ./public
COPY ./src ./src

RUN VITE_APP_JOB_LAUNCHER_SERVER_URL=$JOB_LAUNCHER_SERVER_URL \
    yarn build