import {buildNetworksFromEnv} from "../utils/networkBuilder";

export const networks = buildNetworksFromEnv();

export const hub = {
    address: process.env.HUB_ADDRESS,
    rpcUrl: process.env.HUB_RPC_URL,
    name: process.env.HUB_CHAIN_NAME
}
