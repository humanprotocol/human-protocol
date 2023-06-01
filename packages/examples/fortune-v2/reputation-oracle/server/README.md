# Reputation Oracle Server
Pre-reading: https://github.com/humanprotocol/.github/wiki

## Software Requirements
The Reputation Oracle Server requires of a number key components, before installing the Server you should ensure you have completed the pre-install steps below.

1. Node.js and NPM
To see if you have installed Node.js and npm, execute the following commands in your terminal:

`node -v`

`npm -v`

If you do not have these installed you can follow the guide here:
https://docs.npmjs.com/downloading-and-installing-node-js-and-npm

2. Postgres Database
The server uses postgres as a database to store user emails and passwords.  Ensure that you have installed postgres and created a database before installing the actual server itself.  For postgres install instructions see here: 
https://www.postgresql.org/download/ 

Make a note of the postgres username, password and database name. 

3. Hardhat
Hardhat is an Ethereum development environment. Compile your contracts and run them on a development network. To install Hardhat see here:
https://hardhat.org/hardhat-runner/docs/getting-started

4. S3 credentials
The server uses S3 to store job details.  To setup an S3 bucket and generate the API Key & Secret follow this guide: https://medium.com/@shamnad.p.s/how-to-create-an-s3-bucket-and-aws-access-key-id-and-secret-access-key-for-accessing-it-5653b6e54337 

Take a note of the AWS region for the S3 bucket you just created, your API Key and Secret.

## Installation
5. When installing for the first time it will be necessary to run a database migration.  To do so you should execute the following command in your terminal:


6. Clone this repo to your local machine and change directory into the cloned repo:
   
`git clone git@github.com:humanprotocol/human-protocol.git` 

7. Install using yarn
   
`yarn install`

8. Set the variable <NODE_ENV> to development, testing or production. Populate the .env.<NODE_ENV> file with the values you noted down in steps 2, 3 and 4. Use .env.example file to start.

9. Run migrations using yarn

`yarn migration:run`

`yarn migration:create <MIGRATION_NAME>` - Create new migration 

`yarn migration:revert` - Revert latest migration

10. Run application using yarn
`yarn start`

