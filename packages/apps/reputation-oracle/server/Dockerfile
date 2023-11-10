# Base image
FROM node:18

# Create app directory
WORKDIR /usr/src/app

# Bundle app source
COPY . .

# Install app dependencies
RUN yarn install

# Creates a "dist" folder with the production build
RUN yarn workspace @human-protocol/reputation-oracle build

# Start the server using the production build
CMD [ "node", "packages/apps/reputation-oracle/server/dist/src/main.js" ]
