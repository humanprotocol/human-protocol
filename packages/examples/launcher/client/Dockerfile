FROM node:16.15

# Add a work directory
WORKDIR /app

# Cache and Install dependencies
COPY package.json yarn.lock ./

RUN yarn install

# Copy app files
COPY . .

# Build the app
RUN yarn run build

# Expose port
EXPOSE 3001

# Start the app
CMD yarn run start-prod
