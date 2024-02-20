import {client} from '../config/redis';
import {hub, networks} from '../config/web3';
import Web3 from 'web3';
import HUB_ABI_JSON from '../governance-hub.json';
import SPOKE_ABI_JSON from '../governance-spoke.json';
import {replacer} from '../utils/replacer';
import { HubContract, SpokeContract, ProposalVoteResult } from '../types/contracts';

const hubContractABI = HUB_ABI_JSON;
const spokeContractABI = SPOKE_ABI_JSON;

export const fetchProposalData = async (proposalId) => {
    const exists = await client.exists(proposalId);
    if (exists) {
        return await client.get(proposalId);
    } else {
        return await fetchProposalVotesFromNetworks(proposalId);
    }
};

async function fetchProposalVotesFromNetworks(proposalId) {
    const results = [];
    const web3 = new Web3(new Web3.providers.HttpProvider(hub.rpcUrl));
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const hubContract: HubContract = new web3.eth.Contract(hubContractABI, hub.address) as HubContract;

    const hubVotes = await hubContract.methods.proposalVotes(proposalId).call() as ProposalVoteResult;
    results.push({
        chain_name: hub.name,
        for: hubVotes.forVotes.toString(),
        against: hubVotes.againstVotes.toString(),
        abstain: hubVotes.abstainVotes.toString()
    });

    if (await hubContract.methods.collectionFinished(proposalId).call()) {
        const finalResult = JSON.stringify(results, replacer);
        await client.set(proposalId, finalResult);

        return finalResult;
    }

    if (await hubContract.methods.collectionStarted(proposalId).call()) {
        for (let index = 0; ; index++) {
            try {
                const {contractAddress, chainId} = await hubContract.methods.spokeContracts(index).call();

                const chainIdExtractedNumber = chainId.toString().match(/\d+/)[0];

                const {initialized} = await hubContract.methods.spokeVotes(
                    proposalId,
                    contractAddress,
                    chainIdExtractedNumber
                ).call();

                if (!initialized){
                    for (const net in networks) {
                        if (networks[net].chain_id == chainIdExtractedNumber){
                            results.push(await fetchVotesFromSpokes(net, proposalId));
                        }
                    }
                }
            } catch (error) {
                console.log(`No data for ${index}: ${error.message}`);
                break;
            }
        }

        const finalResult = JSON.stringify(results, replacer);
        await client.set(proposalId, finalResult);

        return finalResult;
    }

    for (const net in networks) {
        results.push(await fetchVotesFromSpokes(net, proposalId));
    }

    const finalResult = JSON.stringify(results, replacer);
    await client.set(proposalId, finalResult);
    await client.expire(proposalId, Number(process.env.REDIS_EXPIRATION_TIME_IN_SEC));

    return finalResult;
}

async function fetchVotesFromSpokes(net: string, proposalId) {
    const {spoke_address, rpc_url, display_name} = networks[net];
    const web3 = new Web3(new Web3.providers.HttpProvider(rpc_url));
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const spokeContract: SpokeContract  = new web3.eth.Contract(spokeContractABI, spoke_address) as SpokeContract;

    const result = await spokeContract.methods.proposalVotes(proposalId).call() as ProposalVoteResult;

    return {
        chain_name: display_name,
        for: BigInt(result.forVotes).toString(),
        against: BigInt(result.againstVotes).toString(),
        abstain: BigInt(result.abstainVotes).toString()
    };
}