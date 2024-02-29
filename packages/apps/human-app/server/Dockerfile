FROM node:latest
LABEL authors="maciek.nabialek"
WORKDIR /app
COPY package.json yarn.lock ./
COPY packages/apps/human-app/server ./packages/apps/human-app/server

WORKDIR /app/packages/apps/human-app/server

RUN yarn install --frozen-lockfile --ignore-scripts
RUN yarn build
EXPOSE 3000
CMD ["yarn", "start"]
