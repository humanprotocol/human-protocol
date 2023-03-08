# Job Launcher server
Job Launcher server is an API that allows Human Protocol users to create jobs.
### Validations:
1. In order to accept the job creation the user needs to approve to the job launcher address, in the contract of the token selected, to spend the amount of tokens desired for funding the escrow.
2. Check for curse words in title and description.

### Flow:
1. User approves the amount necessary
2. User submits the escrow data calling ```POST /escrow```
3. Server passes validations
4. Server creates the escrow
5. Server funds the escrow
6. Server uploads manifest with the escrow data
7. Server sets the escrow up
8. Server returns escrow address


## Run locally
1. Create a copy of .env.development and call it .env:

```bash
cp .env.test .env
````

2. Edit .env file with the required values.
3. Start the server:

```bash
yarn start
```

## Tests
```bash
yarn test
```

## Deployment on Vercel
1. On Github fork this repository. (Skip this step for Human Protocol team)
2. Then go to your Vercel dashboard and click on Add New... Project.
3. Choose the forked repository or this repository if you are on Human Protocol team.
4. Give to the project a name.
5. Choose the root directory as `packages/examples/fortune/launcher/server`
6. Leave Build and Output Settings section empty, it will use `vercel.json` config.
7. Set Environnment Variables from `.env.development` with your own values. (You will need to create an Stripe account https://stripe.com/)