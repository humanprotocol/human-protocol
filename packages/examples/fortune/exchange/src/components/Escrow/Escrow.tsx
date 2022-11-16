import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import EscrowABI from '@human-protocol/core/abis/Escrow.json';
import getWeb3 from '../../utils/web3';
import sendFortune from '../../services/RecordingOracle/RecordingClient';
import './Escrow.css';

const statusesMap = ['Launched', 'Pending', 'Partial', 'Paid', 'Complete', 'Cancelled'];

function parseQuery(qs: any) {
  const result : string[] = [];
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
  const web3 = getWeb3();
  const [escrow, setEscrow] = useState('');
  const [fortune, setFortune] = useState('');
  const [escrowStatus, setEscrowStatus] = useState('');
  const [balance, setBalance] = useState('');
  const [recordingOracleUrl, setRecordingOracleUrl] = useState('');

  const setMainEscrow = useCallback(async (address: string) => {
    setEscrow(address);
    const Escrow = new web3.eth.Contract(EscrowABI as [], address);

    const escrowSt = await Escrow.methods.status().call();
    setEscrowStatus(statusesMap[escrowSt]);

    const balance = await Escrow.methods.getBalance().call();
    setBalance(web3.utils.fromWei(balance, 'ether'));

    const manifestUrl = await Escrow.methods.manifestUrl().call();
    if (manifestUrl) {
      const manifestContent = (await axios.get(manifestUrl)).data;

      setRecordingOracleUrl(manifestContent.recording_oracle_url);
    }
    return;
  }, [web3.eth.Contract, web3.utils])

  useEffect(() => {
    const qs: any = parseQuery(window.location.search);
    const address = qs.address;
    if (web3.utils.isAddress(address)) {
      setMainEscrow(web3.utils.toChecksumAddress(address));
    }
  }, [setMainEscrow, web3.utils]);
  
  const send = async () => {
    await sendFortune(escrow, fortune, recordingOracleUrl);
    alert('Your fortune has been submitted');
    setFortune('');
    return;
  }


  return (
    <div className="escrow-container">
      <div className="escrow-view">
        <div>
          <input onChange={(e) => setEscrow(e.target.value)} value={escrow} data-testid="escrowAddress"/>
          <button type="button" onClick={() => setMainEscrow(web3.utils.toChecksumAddress(escrow))}> Confirm </button>
        </div>
        <span> Fill the exchange address to pass the fortune to the recording oracle</span>
        <span> <b>Address: </b> {escrow} </span>
        <span> <b>Status: </b> {escrowStatus}</span>
        <span> <b>Balance: </b> {balance}</span>
        <div>
          <input onChange={(e) => setFortune(e.target.value)}/>
          <button type="button" onClick={send}> Send Fortune </button>
        </div>
      </div>
    </div>
  )
}
