# Vote Aggregator

The "Vote Aggregator" is an application designed to serve as a backend component for the Human Protocol. It's responsible for collecting votes from various chains, with a simple REST API to interface with the frontend.

## What does the app do?

Once fully developed, the application will:

1. Query smart contracts across different Ethereum-compatible chains using Alchemy/Infura.
2. Aggregate vote results from different chains.
3. Store the aggregated data in Redis for faster retrieval.
4. Offer a REST API for data retrieval from the frontend.

Contract classes are generated from ABIs, and all configurations (like the hub, spokes, cache ttl, and rpc addresses) are derived from the `.env` file. The application also has the flexibility to query multiple contract addresses for each network.

## How to Setup

1. Clone this repository: `git clone https://github.com/blockydevs/bdmh-cross-chain-governance`
2. Navigate to the project directory: `cd vote-aggregator`
3. Create an .env file in the project root and populate it with appropriate values (refer to the Configuration section)
4. Build: `docker-compose -f docker-compose.yml build vote-aggregator`
5. Run: `docker-compose -f docker-compose.yml up`

## Configuration

Your .env file should contain:

```
NODE_PORT=8080

REDIS_PORT=6379
REDIS_HOST=redis-docker

HUB_RPC_URL=
HUB_ADDRESS=
HUB_CHAIN_NAME=

NETWORK_<network_name>_SPOKE_ADDRESS=
NETWORK_<network_name>_CHAIN_ID=
NETWORK_<network_name>_RPC_URL=
NETWORK_<network_name>_DISPLAY_NAME=

REDIS_EXPIRATION_TIME_IN_SEC=180
```

## Setting up a SPOKE

The Human Protocol utilizes a hub-and-spoke model, where the central contract (the "hub") interacts with multiple individual contracts on different networks (known as "spokes"). This design allows the protocol to operate across various Ethereum-compatible chains, maximizing its reach and efficiency.

### How to Define a SPOKE?

A "SPOKE" represents an individual network's interface to the Human Protocol. Each SPOKE corresponds to a particular Ethereum-compatible chain and has its specific configuration. Here's how to define a SPOKE:

1. **Configuration in the .env file**: Every SPOKE must be defined within your `.env` file using the format:

    ```
    NETWORK_<network_name>_SPOKE_ADDRESS=<contract_address_on_the_network>
    NETWORK_<network_name>_CHAIN_ID=<network_chain_id>
    NETWORK_<network_name>_RPC_URL=<network_rpc_url>
    NETWORK_<network_name>_DISPLAY_NAME=<display_name_for_frontend>
    ```

   `chain id` should be taken from wormhole documentation describing automatic relayers. Here https://docs.wormhole.com/wormhole/blockchain-environments/contracts#automatic-relayer you can find supported chains and their respective ids.



2. **Understanding the SPOKE Parameters**:
    - `NETWORK_<network_name>_SPOKE_ADDRESS`: Contract address of the SPOKE on the network.
    - `NETWORK_<network_name>_CHAIN_ID`: Unique Chain ID used to identify the network.
    - `NETWORK_<network_name>_RPC_URL`: RPC URL for communication with the network.
    - `NETWORK_<network_name>_DISPLAY_NAME`: User-friendly name for the frontend display.
   
    
3. **Loading the Configuration**: Restart the application after updating the `.env` file. The new SPOKE configurations will be automatically loaded and integrated into the voting aggregation system.


## API Endpoints
Example endpoint:

GET /proposal?id=123

Response:
```json
[
{
"chain_name": "sepolia",
"for": 100,
"against": 200,
"abstain": 300
},
{
"chain_name": "mumbai",
"for": 100,
"against": 200,
"abstain": 300
}
]
```

## Built With
Express - Web application framework.        
Redis - In-memory data structure store.     
dotenv - Module to load environment variables from .env file.       
web3.js - Ethereum JavaScript API.

## Github Actions deploy
Set proper NETWORK_PARAMS in secrets with format
```json
{"NETWORK_PARAMS":
  [
    {
      "NETWORK_SPOKE_ADDRESS": "0xabc",
      "NETWORK_CHAIN_ID": 1,
      "NETWORK_RPC_URL": "https: //xyz",
      "NETWORK_DISPLAY_NAME": "name"
    },
    {
      "NETWORK_SPOKE_ADDRESS": "0xabc",
      "NETWORK_CHAIN_ID": 1,
      "NETWORK_RPC_URL": "https://xyz",
      "NETWORK_DISPLAY_NAME": "name"
    }
  ]
}
```


