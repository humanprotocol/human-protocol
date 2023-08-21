FROM node:lts-alpine

RUN apk add git

RUN git clone https://github.com/humanprotocol/human-protocol.git

WORKDIR /human-protocol

EXPOSE 8545

RUN yarn workspace @human-protocol/core install --ignore-scripts
CMD yarn workspace @human-protocol/core local