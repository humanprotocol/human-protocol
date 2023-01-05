# Escrows Data Recovery
## Run
1. Create `.env` file:
```
cp .env.example .env
```

2. Edit the file `.env` created previously with the values needed for the desired network:
- **RPC_URL:** node rpc url
- **RPC_URL_GRAPH:** {name of the network}:{RPC_URL}
- **SUBGRAPH_URL:** url of the deployed subgraph at step [value not know at this point yet, leave empty]
- **FACTORY_CONTRACT_ADDRESS:** address of the factory contract
- **NETWORK:** name of the network

3. Run a graph node locally:
```
yarn graph-node
```

4. Create the config file for the subgraph:
```
yarn create-config
```
5. Edit the file created in step 4 with the values for the desired network.

6. Add the abi file for all the contracts (EscrowFactory, HMToken, Escrow) in the folder `./src/abis`, using the structure `EscrowFactory_[network_name]_[contract_address].json` as name of the files. These abi files can be obtained from the block scanner if the contract was validated.(TODO: get abi files automatically from block scanner)

7. Run this to generate and deploy your subgraph:
```
yarn deploy
```

8. When the previous command finishes, it will print the value you must set in your `.env` file for the variable `FACTORY_CONTRACT_ADDRESS`.

9. Wait until the graph node has indexed all data, this might take a few hours depending on the number of blocks have passed since the contract deployment. Check the logs running:
```
docker logs --tail 20 graph-node
```


10. Run the script to pull the data from the subgraph and store the data in json files inside the folder results:
```
yarn start
```