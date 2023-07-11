FROM node:lts-hydrogen

COPY . /app
WORKDIR /app

EXPOSE 8545

RUN yarn workspace @human-protocol/core install
CMD yarn workspace @human-protocol/core local
