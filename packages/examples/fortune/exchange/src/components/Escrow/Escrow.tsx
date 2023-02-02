import EscrowABI from '@human-protocol/core/abis/Escrow.json';
import { getContract, getProvider } from '@wagmi/core';
import axios from 'axios';
import { ethers } from 'ethers';
import { useCallback, useEffect, useState } from 'react';
import { useAccount, useNetwork } from 'wagmi';
import sendFortune from '../../services/RecordingOracle/RecordingClient';
import './Escrow.css';

const statusesMap = [
  'Launched',
  'Pending',
  'Partial',
  'Paid',
  'Complete',
  'Cancelled',
];

function parseQuery(qs: any) {
  const result: string[] = [];
  if (qs.length === 0) {
    return {};
  }

  if (qs[0] === '?') {
    qs = qs.slice(1);
  }

  const kvs = qs.split('&');

  for (let kv of kvs) {
    const kvArr = kv.split('=');

    if (kvArr.length > 2) {
      continue;
    }

    const key = kvArr[0];
    const value = kvArr[1];

    result[key] = value;
  }

  return result;
}
export const Escrow = () => {
  const { address } = useAccount();
  const { chain } = useNetwork();
  const provider = getProvider();
  const [escrow, setEscrow] = useState('');
  const [fortune, setFortune] = useState('');
  const [escrowStatus, setEscrowStatus] = useState('');
  const [balance, setBalance] = useState('');
  const [recordingOracleUrl, setRecordingOracleUrl] = useState('');

  const setMainEscrow = useCallback(
    async (address: string) => {
      setEscrow(address);
      const Escrow = getContract({
        address,
        abi: EscrowABI,
        signerOrProvider: provider,
      });

      const escrowSt = await Escrow.status();
      setEscrowStatus(statusesMap[escrowSt]);

      const balance = await Escrow.getBalance();
      setBalance(ethers.utils.formatEther(balance));

      const manifestUrl = await Escrow.manifestUrl();
      if (manifestUrl) {
        const manifestContent = (await axios.get(manifestUrl)).data;

        setRecordingOracleUrl(manifestContent.recording_oracle_url);
      }
      return;
    },
    [provider]
  );

  useEffect(() => {
    const qs: any = parseQuery(window.location.search);
    const address = qs.address;
    if (ethers.utils.isAddress(address)) {
      setMainEscrow(ethers.utils.getAddress(address));
    }
  }, [setMainEscrow]);

  const send = async () => {
    await sendFortune(
      escrow,
      fortune,
      recordingOracleUrl,
      address as string,
      chain?.id as number
    );
    alert('Your fortune has been submitted');
    setFortune('');
    return;
  };

  return (
    <div className="escrow-container">
      <div className="escrow-view">
        <div>
          <input
            onChange={(e) => setEscrow(e.target.value)}
            value={escrow}
            data-testid="escrowAddress"
          />
          <button
            type="button"
            onClick={() => setMainEscrow(ethers.utils.getAddress(escrow))}
          >
            {' '}
            Confirm{' '}
          </button>
        </div>
        <span>
          {' '}
          Fill the exchange address to pass the fortune to the recording oracle
        </span>
        <span>
          {' '}
          <b>Address: </b> {escrow}{' '}
        </span>
        <span>
          {' '}
          <b>Status: </b> {escrowStatus}
        </span>
        <span>
          {' '}
          <b>Balance: </b> {balance}
        </span>
        <div>
          <input onChange={(e) => setFortune(e.target.value)} />
          <button type="button" onClick={send}>
            {' '}
            Send Fortune{' '}
          </button>
        </div>
      </div>
    </div>
  );
};
