import * as React from 'react';
import { toast } from 'react-toastify';

import { ethers } from 'ethers';
import { ESCROW_STATS_RAW, fetchRawQuery } from '../../queries';
import { formatHexToNumber } from './helpers';
import { INetwork } from '../../constants/networkConstants';

const EscrowFactoryABI = require('../../contracts/EscrowFactoryABI.json');

export const useEscrowHook = ({
  scanner,
  scannerUrl,
  rpcUrl,
  defaultFactoryAddr: address,
  graphqlClientUrl,
}: INetwork) => {
  const eventsUrl = `${scanner}/address/${address}#events`;

  const [latestEscrow, setLatestEscrow] = React.useState<string>();
  const [count, setCount] = React.useState<number>();
  const [pendingEventCount, setPendingEventCount] = React.useState<number>();
  const [bulkTransferEventCount, setBulkTransferEventCount] =
    React.useState<number>();
  const [intermediateStorageEventCount, setIntermediateStorageEventCount] =
    React.useState<number>();
  const [totalEventCount, setTotalEventCount] = React.useState<number>();

  React.useEffect(() => {
    async function setupEscrow() {
      try {
        const iface = new ethers.utils.Interface(EscrowFactoryABI);
        const httpProvider = new ethers.providers.JsonRpcProvider(rpcUrl);
        const Contract = new ethers.Contract(address, iface, httpProvider);

        const lastEscrow = await Contract.lastEscrow();
        setLatestEscrow(lastEscrow);

        const { _hex } = await Contract.counter();
        const counter = formatHexToNumber({ hex: _hex, radix: 16 });
        setCount(counter);

        try {
          const { data: { escrowStatistics: stats = {} } = {} } =
            await fetchRawQuery(graphqlClientUrl, ESCROW_STATS_RAW);

          setPendingEventCount(stats.pendingEventCount);
          setBulkTransferEventCount(stats.bulkTransferEventCount);
          setIntermediateStorageEventCount(stats.intermediateStorageEventCount);
          setTotalEventCount(
            Number(stats.pendingEventCount) +
              Number(stats.bulkTransferEventCount) +
              Number(stats.intermediateStorageEventCount)
          );
        } catch (err) {
          setPendingEventCount(Number.NaN);
          setBulkTransferEventCount(Number.NaN);
          setIntermediateStorageEventCount(Number.NaN);
          setTotalEventCount(Number.NaN);
        }
      } catch (err) {
        const error: any = err;
        toast.error(error?.message, {
          position: 'top-right',
        });
        console.log(error);
      }
    }
    setupEscrow();
  }, [address, rpcUrl, graphqlClientUrl]);

  return {
    address,
    eventsUrl,
    scanner,
    scannerUrl,
    latestEscrow,
    count,
    pendingEventCount,
    bulkTransferEventCount,
    intermediateStorageEventCount,
    totalEventCount,
  };
};
