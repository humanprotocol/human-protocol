FROM node:16.13-alpine3.14

WORKDIR /usr/src/app

COPY package.json yarn.lock ./

RUN apk add python3 make gcc g++
RUN yarn

COPY ./src ./src
