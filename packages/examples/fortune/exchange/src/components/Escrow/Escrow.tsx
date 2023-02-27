import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import sendFortune from '../../services/RecordingOracle/RecordingClient';
import './Escrow.css';
import { useGetAccountInfo } from '@multiversx/sdk-dapp/hooks';
import { EscrowService } from 'src/services/mx/escrow.service';
import { Web3EscrowContract } from 'src/services/web3/escrow.service';
import { EscrowInterface } from 'src/services/common/escrow-interface.service';
import getWeb3 from 'src/utils/web3';


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
  const { address } = useGetAccountInfo();
  const isMxLoggedIn = Boolean(address);
  const web3 = getWeb3();
  const [escrow, setEscrow] = useState('');
  const [fortune, setFortune] = useState('');
  const [escrowStatus, setEscrowStatus] = useState('');
  const [balance, setBalance] = useState('');
  const [recordingOracleUrl, setRecordingOracleUrl] = useState('');

  const setMainEscrow = useCallback(async (address: string) => {
    setEscrow(address);

    let escrowAdress = address;
    if (!isMxLoggedIn) {
      escrowAdress = web3.utils.toChecksumAddress(address);
    }

    var Escrow: EscrowInterface;
    if (isMxLoggedIn) {
      Escrow = new EscrowService(escrowAdress);
    } else {
      Escrow = new Web3EscrowContract(escrowAdress);
    }

    const escrowSt = await Escrow.getStatus();
    setEscrowStatus(escrowSt);

    const balance = await Escrow.getBalance();
    setBalance(balance);

    const manifestUrl = await Escrow.getManifest();
    if (manifestUrl) {
      const manifestContent = (await axios.get(manifestUrl)).data;

      setRecordingOracleUrl(manifestContent.recording_oracle_url);
    }
    return;
  }, [isMxLoggedIn, web3.utils]);

  useEffect(() => {
    const qs: any = parseQuery(window.location.search);
    const address = qs.address;

    setMainEscrow(address);
  }, [setMainEscrow]);

  const send = async () => {
    let account: string;
    if (isMxLoggedIn) {
      account = address;
    } else {
      const accounts = await web3.eth.getAccounts();
      account = accounts[0];
    }
    await sendFortune(account, escrow, fortune, recordingOracleUrl);
    alert('Your fortune has been submitted');
    setFortune('');
    return;
  }

  return (
    <div className="escrow-container">
      <div className="escrow-view">
        <div>
          <input onChange={(e) => setEscrow(e.target.value)} value={escrow} data-testid="escrowAddress"/>
          <button type="button" onClick={() => setMainEscrow(escrow)}> Confirm </button>
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
