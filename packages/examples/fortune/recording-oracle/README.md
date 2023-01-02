**Deno Recording Oracle** - An Ethereum Oracle which records the task output and who does what. In this case, the Recording Oracle will receive responses from the Exchange Oracle. The Exchange Oracle passes the responses to the Recording Oracle, which the check the quality of the answers.

If the quality is acceptable, the answers are then routed to the Reputation Oracle. 
This Recording Oracle is implemented using Deno.

This is a simple API that accepts a POST request with a JSON body containing the worker address, the escrow address, and the fortune. It validates the worker address and the escrow address, retrieves some data from the Escrow contract, adds the fortune to the storage, and returns a 201 Created response.

Check the video demo here: <video src="https://youtu.be/9UbEiK9QG6M" width="480" height="320" controls></video>


### Usage

To run the code, you need to have Deno installed on your machine. You can install Deno by following the instructions [here](https://deno.land/#installation).

Once you have Deno installed, you can run the code using the following command:

```
deno run --allow-net --allow-env mod.ts

```

### Code Structure

The directory tree for this Deno app are as follows:

```
.
├── .vercelignore
├── README.md
├── src
│   ├── contract
│   │   └── EscrowAbi.json
│   ├── constants.ts
│   ├── server.ts
│   ├── storage.ts
│   ├── utils.ts
│   └── index.html
├── test
│   ├── server.test.ts
│   └── storage.test.ts
├── vercel.json
└── .env
```

This directory tree includes the following directories and files:

`src`: This directory contains the source code for the Deno app.
`index.html`: This file contains the HTML frontend for the app.
`server.ts`: This file contains the implementation of the REST API server.
`storage.ts`: This file contains the implementation of the storage module.
`utils.ts`: This file contains utility functions used by the app.
`contract`: This directory contains the contract ABIs used by the app.
`EscrowAbi.json`: This file contains the ABI of the Escrow contract.
`test`: This directory contains the unit and integration tests for the app.
`server.test.ts`: This file contains the tests for the REST API server.
`storage.test.ts`: This file contains the tests for the storage module.
`vercel.json`: This file contains the configuration for deploying the app to Vercel.
`.vercelignore`: This file contains the patterns of files and directories that should be ignored during the app deployment to Vercel.


### Code Flow


Here's a high-level overview of the code flow:

1. The code imports the necessary modules from the Deno standard library and third-party libraries.
2. It sets the environment variables for the private key, the HTTP server, and the port number. It also creates an instance of the Application class and an instance of the Router class.
3. It creates a new Web3 instance and adds the private key to the wallet. It sets the default account to the address of the private key.
4. It defines the route for the /job/results endpoint and applies the necessary middleware.
5. In the route handler, it validates the worker address and the escrow address.
6. It creates an instance of the Escrow contract and retrieves the recordingOracle address from it. It compares the recordingOracle address with the current account address and returns an error if they do not match.
7. It checks the status of the Escrow contract and returns an error if it is not in the Pending state.
8. It retrieves the manifestUrl and the reputationOracleUrl from the Escrow contract and makes a GET request to the manifestUrl to retrieve the fortunes_requested and the reputation_oracle_url values.
9. It checks if the Escrow contract address is in the storage and adds it if it is not.
10. It checks if the worker has already submitted a fortune for the Escrow contract and returns an error if they have.
11. It adds the fortune to the storage and checks if the number of fortunes in the storage matches the fortunes_requested value. 
12. If they do, it makes a POST request to the reputationOracleUrl with the escrowAddress and the list of fortunes. It then clears the fortunes from the storage.
13. It returns a 201 Created response to indicate that the fortune has been added successfully.
14. if an error occurs at any point in the process, it is caught and a 500 Internal Server Error response is returned with the error message.
15. The route is registered with the Application instance and the server is started.


We used the Application and Router classes from the http://oakserver.github.io/oak/ library to define the routes and handle the requests and responses. We also used the Web3 class from the https://deno.land/x/web3/mod.ts library to interact with the Ethereum network.


Here is a more detailed expression of the code structure:

First, we import the necessary modules from the Deno standard library and third-party libraries.

```
import { Application, Router } from "https://deno.land/x/oak@v5.2.0/mod.ts";

import { bodyParser } from "https://deno.land/x/oak@v5.2.0/mod.ts";

import { cors } from "https://deno.land/x/cors@v1.0.1/mod.ts";

import { EscrowABI } from "./contracts/EscrowAbi.json";

import { convertUrl } from "./utils.ts";

import { statusesMap } from "./constants.ts";
```

Next, we set some environment variables for the private key, the HTTP server, and the port number. We also create an instance of the Application class from the oak module and an instance of the Router class.

```
const privKey = Deno.env.get("ETH_PRIVATE_KEY") || "486a0621e595dd7fcbe5608cbbeec8f5a8b5cabe7637f11eccfc7acd408c3a0e";

const ethHttpServer = Deno.env.get("ETH_HTTP_SERVER") || "http://localhost:8547";

const port = Number(Deno.env.get("PORT")) || 3005;

const app = new Application();

const router = new Router();
```

Then, we create a new Web3 instance and add the private key to the wallet. We set the default account to the address of the private key.

```

const web3 = new Web3(ethHttpServer);

const account = web3.eth.accounts.privateKeyToAccount(`0x${privKey}`);

web3.eth.accounts.wallet.add(account);

web3.eth.defaultAccount = account.address;
```

After that, we define the route for the /job/results endpoint. This endpoint accepts a POST request with a JSON body containing the worker address, the escrow address, and the fortune.

```
router.post(
  "/job/results",
  bodyParser({ limit: "1mb" }),
  async (context: any) => {
    try {
      const { workerAddress, escrowAddress, fortune } = context.request.body;
```

Next, we validate the worker address and the escrow address to ensure they are valid Ethereum addresses. If either of them is not a valid Ethereum address, we return a 400 Bad Request response with a relevant error message.

```
      if (!web3.utils.isAddress(workerAddress)) {
        return context.response.status = 400,
          context.response.body = {
            field: "workerAddress",
            message: "Valid ethereum address required",
          };
      }
      if (!web3.utils.isAddress(escrowAddress)) {
        return context.response.status = 400,
          context.response.body = {
            field: "escrowAddress",
            message: "Valid ethereum address required",
          };
      }
```


We then create an instance of the Escrow contract using the ABI and the address provided in the request. We also retrieve the recordingOracle address of the Escrow contract and compare it with the current account address. If they do not match, we return a 400 Bad Request response with an error message.

```
      const Escrow = new web3.eth.Contract(EscrowABI, escrowAddress);
      const escrowRecOracleAddr = await Escrow.methods
        .recordingOracle()
        .call({ from: account.address });
      if (
        web3.utils.toChecksumAddress(escrowRecOracleAddr) !==
        web3.utils.toChecksumAddress(account.address)
      ) {
        return context.response.status = 400,
          context.response.body = {
            field: "escrowAddress",
            message:
              "The Escrow Recording Oracle address mismatches the current one",
          };
      }
```


Next, we check the status of the Escrow contract and ensure it is in the Pending state. If it is not in the Pending state, we return a 400 Bad Request response with an error message.

```
      const escrowStatus = await Escrow.methods.status()
        .call({ from: account.address });
      if (statusesMap[escrowStatus] !== "Pending") {
        return context.response.status = 400,
          context.response.body = {
            field: "escrowAdderss",
            message: "The Escrow is not in the Pending status",
          };
      }
```

Then, we retrieve the manifestUrl and the reputationOracleUrl from the Escrow contract and make a GET request to the manifestUrl to retrieve the fortunes_requested and the reputation_oracle_url values.

```      const manifestUrl = await Escrow.methods.manifestUrl()
        .call({ from: account.address });
      const manifestResponse = await axios.get(convertUrl(manifestUrl));
      const {
        fortunes_requested: fortunesRequested,
        reputation_oracle_url: reputationOracleUrl,
      } = manifestResponse.data;
```

Next, we check if the storage module has a record of the Escrow contract address. If not, we add it to the storage.

```      
    if (!storage.getEscrow(escrowAddress)) {
        storage.newEscrow(escrowAddress);
      }
```

We then check if the worker has already submitted a fortune for the Escrow contract. If they have, we return a 400 Bad Request response with an error message.

```
      const workerPreviousResult = storage.getWorkerResult(
        escrowAddress,
        workerAddress,
      );
      if (workerPreviousResult) {
        return context.response.status = 400,
          context.response.body = {
            message: `${workerAddress} already submitted a fortune`,
          };
      }
```     

After that, we add the fortune to the storage and check if the number of fortunes in the storage matches the fortunes_requested value. If they do, we make a POST request to the reputationOracleUrl with the escrowAddress and the list of fortunes. Then, we clear the fortunes from the storage.

```
storage.putFortune(escrowAddress, workerAddress, fortune);
const fortunes = storage.getFortunes(escrowAddress);
if (fortunes.length === fortunesRequested) {
  console.log("Doing bulk payouts");
  // a cron job might check how much annotations are in work
  // if this is full - then just push them to the reputation oracle
  await axios.post(convertUrl(reputationOracleUrl), {
    escrowAddress,
    fortunes,
  });
  storage.cleanFortunes(escrowAddress);
}
```

Finally, we return a 201 Created response to indicate that the fortune has been added successfully.

```
context.response.status = 201;
context.response.body = "";
```

If an error occurs at any point in the process, we catch it and return a 500 Internal Server Error response with the error message.

```
} catch (err) {
  console.error(err);
  context.response.status = 500;
  context.response.body = {
    message: err.message,
  };
}
```

After defining the route, we apply the cors middleware and register the route with the Application instance. We then log a message to the console and start the server.

```
app.use(cors());
app.use(router.routes());
app.use(router.allowedMethods());
console.log(`Listening on port ${port}...`);
await app.listen({ port });
```

### CI/CD 

To create a CI/CD pipeline for the Deno app using GitHub Actions and Vercel, we will need to perform the following steps:

Create a GitHub repository for the Deno app and push the code to it.
Create a new Vercel project and link it to the GitHub repository.
In the Vercel project, create a new environment for the Deno app.
In the GitHub repository, create a new workflow file at .github/workflows/ci-cd.yml with the following content:

```
name: CI/CD

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2

      - name: Setup Deno
        uses: denolib/setup-deno@v1
        with:
          deno-version: 1.4.2

      - name: Install dependencies
        run: deno cache src/server.ts src/storage.ts

      - name: Test
        run: deno test --allow-net

      - name: Build
        run: deno build src/server.ts src/storage.ts

```
Push the changes to the GitHub repository. This will trigger the workflow and run the CI/CD pipeline. The pipeline will first install Deno, then install the dependencies, build the app, run the tests, and finally deploy the app to Vercel.

After the deployment is complete, Vercel will display the URL where the Deno app is accessible. You can access the app at this URL to verify that it has been successfully deployed.

### To run locally

To run the Deno app, follow these steps:

1. Make sure you have installed the latest version of Deno on your system. You can check if Deno is installed by running the `deno -v` command in your terminal.

2. Navigate to the directory containing the Deno app in your terminal.

3. Run the `deno cache src/server.ts src/storage.ts` command to download the dependencies of the app.

4. Run the `deno run --allow-net --allow-env src/server.ts` command to start the app server.

5. Open a web browser and navigate to http://localhost:3005 to access the app.

6. You can also run the app tests by running the `deno test --allow-net command`.

7. Note that the `--allow-net` flag is required to grant the app access to the network, and the `--allow-env` flag is required to allow the app to access environment variables from the .env file.

8. By following these steps, you can run the Deno app on your local system and start using it. You can also deploy the app to a hosting service like Vercel to make it accessible from anywhere.

### Conclusion

We built a Deno based recording oracle from scratch. We also wrote unit and integration tests for the code using the Deno.test function. We used various features of the Deno runtime, such as the fetch function from the https://deno.land/std/http/server.ts module and the encode function from the https://deno.land/std/encoding/utf8.ts module, to write the tests.


