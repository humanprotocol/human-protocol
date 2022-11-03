import React, { useState, useEffect } from 'react';
import axios from 'axios';
import EscrowFile from '../build/contracts/Escrow.json';
import getWeb3 from '../web3';

import './index.css';

const statusesMap = ['Launched', 'Pending', 'Partial', 'Paid', 'Complete', 'Cancelled'];
const EscrowABI = EscrowFile.abi;

function parseQuery(qs) {
  const result = {};
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
export default function Escrow() {
  const web3 = getWeb3();
  const [escrow, setEscrow] = useState('');
  const [fortune, setFortune] = useState('');
  const [escrowStatus, setEscrowStatus] = useState('');
  const [balance, setBalance] = useState('');
  const [recordingOracleUrl, setRecordingOracleUrl] = useState('');

  useEffect(() => {
    const qs = parseQuery(window.location.search);
    const address = qs.address;
    if (web3.utils.isAddress(address)) {
      setMainEscrow(web3.utils.toChecksumAddress(address));
    }
  }, []);

  const setMainEscrow = async (address) => {
    setEscrow(address);
    const Escrow = new web3.eth.Contract(EscrowABI, address);

    const escrowSt = await Escrow.methods.status().call();
    setEscrowStatus(statusesMap[escrowSt]);

    const balance = await Escrow.methods.getBalance().call();
    setBalance(web3.utils.fromWei(balance, 'ether'));

    const manifestUrl = await Escrow.methods.manifestUrl().call();
    if (manifestUrl) {
      const manifestContent = (await axios.get(manifestUrl)).data;

      setRecordingOracleUrl(manifestContent.recording_oracle_url);
    }
  }

  const sendFortune = async () => {
    const account = (await web3.eth.getAccounts())[0];
    const body = {
      workerAddress: account,
      escrowAddress: escrow,
      fortune
    };
    await axios.post(recordingOracleUrl, body);
    alert('Your fortune has been submitted');
    setFortune('');
  }


  return (
    <div className="escrow-container">
      <div className="escrow-view">
        <div>
          <input onChange={(e) => setEscrow(e.target.value)} value={escrow} />
          <button onClick={() => setMainEscrow(web3.utils.toChecksumAddress(escrow))}> Confirm </button>
        </div>
        <span> Fill the exchange address to pass the fortune to the recording oracle</span>
        <span> <b>Address: </b> {escrow} </span>
        <span> <b>Status: </b> {escrowStatus}</span>
        <span> <b>Balance: </b> {balance}</span>
        <div>
          <input onChange={(e) => setFortune(e.target.value)}/>
          <button onClick={sendFortune}> Send Fortune </button>
        </div>
      </div>
    </div>
  )
}
