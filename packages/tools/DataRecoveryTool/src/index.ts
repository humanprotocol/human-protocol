import * as fs from 'fs'
import { Contract, providers } from 'ethers';
import path from 'path';
import dotenv from "dotenv";

dotenv.config();

const subgraphUrl = process.env.SUBGRAPH_URL || 'http://localhost:8000/subgraphs/name/posix4e/humansubgraph';
const rpcUrl = process.env.RPC_URL || 'https://rpc.ankr.com/eth_rinkeby';
const factoryAddress = process.env.FACTORY_CONTRACT_ADDRESS || '0x925B24444511c86F4d4E63141D8Be0A025E2dca4';
const network = process.env.NETWORK || 'rinkeby';

const gqlFetch = (
    url: string,
    query: string,
    variables?: any,
    headers?: any
) =>
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...headers,
        },
        body: JSON.stringify({ query, variables }),
    });


export interface EscrowEventDayData {
    timestamp: string;
    dailyBulkTransferEvents: number;
    dailyIntermediateStorageEvents: number;
    dailyPendingEvents: number;
    dailyTotalEvents: number;
    dailyEscrowAmounts: number;
}

const RAW_EVENT_DAY_DATA_QUERY = `{
    eventDayDatas(first: 30, orderBy: timestamp, orderDirection: desc) {
      timestamp
      dailyBulkTransferEvents
      dailyIntermediateStorageEvents
      dailyPendingEvents
      dailyEscrowAmounts
    }
  }`;

const RAW_ESCROW_STATS_QUERY = `{
    escrowStatistics(id:"escrow-statistics-id") {
      intermediateStorageEventCount
      pendingEventCount
      bulkTransferEventCount
    }
  }`;

async function fetchEscrowEventsAsync() {
    const eventDayDatas = await gqlFetch(
        subgraphUrl,
        RAW_EVENT_DAY_DATA_QUERY
    )
        .then((res) => res.json())
        .then((json) =>
            json.data.eventDayDatas.map((d: EscrowEventDayData) => ({
                ...d,
                dailyBulkTransferEvents: Number(d.dailyBulkTransferEvents),
                dailyIntermediateStorageEvents: Number(
                    d.dailyIntermediateStorageEvents
                ),
                dailyPendingEvents: Number(d.dailyPendingEvents),
                dailyTotalEvents:
                    Number(d.dailyBulkTransferEvents) +
                    Number(d.dailyIntermediateStorageEvents) +
                    Number(d.dailyPendingEvents),
                dailyEscrowAmounts: Number(d.dailyEscrowAmounts),
            }))
        );
    writeFile(JSON.stringify(eventDayDatas), 'EscrowEvents');
}


async function fetchEscrowStatsAsync() {

    const eventDayDatas = await gqlFetch(
        subgraphUrl,
        RAW_ESCROW_STATS_QUERY
    )
        .then((res) => res.json())
        .then((json) => {
            const {
                intermediateStorageEventCount,
                pendingEventCount,
                bulkTransferEventCount,
            } = json.data.escrowStatistics;

            return {
                intermediateStorageEventCount: Number(
                    intermediateStorageEventCount
                ),
                pendingEventCount: Number(pendingEventCount),
                bulkTransferEventCount: Number(bulkTransferEventCount),
                totalEventCount:
                    Number(intermediateStorageEventCount) +
                    Number(pendingEventCount) +
                    Number(bulkTransferEventCount),
            };
        });
    writeFile(JSON.stringify(eventDayDatas), 'EscrowStats');
}

async function fetchEscrowAmountsAsync() {

    const provider = new providers.JsonRpcProvider(rpcUrl);
    fs.readFile(path.join(__dirname, `./abis/EscrowFactory_${network}_${factoryAddress}.json`),'utf8', async function (error, data) {
        if (error) {
            return console.log("error");
        }
        const contract = new Contract(factoryAddress, data, provider);
        const escrowAmount = await contract.counter();
        writeFile(Number(escrowAmount).toString(), 'EscrowAmount');
    });
}

function getDateString() {
    const now = new Date();
    return now.toISOString().slice(0, 19).replace(/-/g, '').replace(/:/g, '').replace('T', '');
}

function writeFile(data: any, name: string) {
    fs.writeFile(`./results/${network}_${factoryAddress}_${name}.json`, data, function (err) {
        if (err) {
            return console.log("error");
        }
    });
}

fetchEscrowEventsAsync();
fetchEscrowStatsAsync();
fetchEscrowAmountsAsync();