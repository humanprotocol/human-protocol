FROM node:16.20.0-buster

ARG PUBLIC_URL
WORKDIR /usr/src/app

COPY package.json yarn.lock ./

RUN yarn

COPY ./public ./public
COPY ./src ./src

RUN PUBLIC_URL=$PUBLIC_URL yarn build