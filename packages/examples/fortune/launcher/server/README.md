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
1. Create a copy of .env.test and call it .env:

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