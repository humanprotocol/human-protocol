# Base image
FROM node:18

# Create app directory
WORKDIR /usr/src/app

# Bundle app source
COPY . .

# Install app dependencies
RUN yarn install

# Creates a "dist" folder with the production build
RUN yarn workspace @human-protocol/human-app-server build

# Start the server using the production build
CMD [ "node", "packages/apps/human-app/server/dist/src/main.js" ]
