FROM node:16.13-buster

WORKDIR /usr/src/app

COPY package.json yarn.lock ./

RUN yarn install

COPY ./public ./public
COPY ./src ./src

COPY tsconfig.json ./

RUN yarn run build

EXPOSE 3000

CMD yarn run start-prod
