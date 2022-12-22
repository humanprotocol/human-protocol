FROM node:16.14.0-alpine

RUN apk add g++ make py3-pip

WORKDIR /app

COPY . /app/

RUN npm install

EXPOSE 3000
CMD npm run start:production

