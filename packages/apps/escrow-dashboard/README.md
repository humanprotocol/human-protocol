# HUMAN Escrow Factory Dashboard

This is a readonly dashboard of the [Escrow Factory](https://github.com/humanprotocol/hmt-escrow/blob/master/contracts/EscrowFactory.sol) contract

Escrow Factory is used for grouping Escrows in the blockchain. Everything is happening inside Polygon Mainnet. Other networks will be added later

## Available Scripts

In the project directory, you can run:

### `yarn start`

Runs the app in the development mode.\
Open [http://localhost:3002](http://localhost:3002) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `yarn run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.

### `yarn test/ run lint`

# Branching
[GitFlow convention](https://www.gitkraken.com/learn/git/git-flow) is to be followed (and feature PRs should target `develop` branch rather than `master`)

# Deployment

[Internal CI CD documentation](https://www.notion.so/human-protocol/Escrow-Dashboard-47d26b3be14f4ad395e2fcd4a168d77f)

## Deployment Endpoints

`develop` branch → staging: http://ec2-18-219-139-195.us-east-2.compute.amazonaws.com/ 

`master` branch → production: https://dashboard.humanprotocol.org/

# Tests
Feel free to add your own automated tests following GiHub Actions documentation
