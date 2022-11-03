import React, { useState } from 'react';
import axios from 'axios';
import EscrowFile from '../build/contracts/Escrow.json';
import HMTokenFile from '../build/contracts/HMToken.json';
import getWeb3 from '../web3';
import {HMT_ADDRESS, REC_ORACLE_ADDRESS, REP_ORACLE_ADDRESS} from '../constants';

const statusesMap = ['Launched', 'Pending', 'Partial', 'Paid', 'Complete', 'Cancelled'];
const EscrowABI = EscrowFile.abi;
const HMTokenABI = HMTokenFile.abi;

export default function Escrow() {

  const web3 = getWeb3();
  const [escrow, setEscrow] = useState('');

  const [escrowStatus, setEscrowStatus] = useState('');

  const [reputationOracle, setReputationOracle] = useState('');
  const [reputationOracleStake, setReputationOracleStake] = useState('');

  const [recordingOracle, setRecordingOracle] = useState('');
  const [recordingOracleStake, setRecordingOracleStake] = useState('');

  const [manifestUrl, setManifestUrl] = useState('');
  const [finalResultsUrl, setFinalResultsUrl] = useState('');
  const [balance, setBalance] = useState('');

  const [exchangeUrl, setExchangeUrl] = useState('');

  const setMainEscrow = async (address) => {
    setEscrow(address);
    const Escrow = new web3.eth.Contract(EscrowABI, address);

    const escrowSt = await Escrow.methods.status().call();
    setEscrowStatus(statusesMap[escrowSt]);

    const recOracleAddr = await Escrow.methods.recordingOracle().call();
    setRecordingOracle(recOracleAddr);

    const recOracleStake = await Escrow.methods.recordingOracleStake().call();
    setRecordingOracleStake(recOracleStake);

    const repOracleAddr = await Escrow.methods.reputationOracle().call();
    setReputationOracle(repOracleAddr);

    const repOracleStake = await Escrow.methods.reputationOracleStake().call();
    setReputationOracleStake(repOracleStake);

    const finalResults = await Escrow.methods.finalResultsUrl().call();
    setFinalResultsUrl(finalResults);

    const manifest = await Escrow.methods.manifestUrl().call();
    setManifestUrl(manifest);

    if (manifest) {
      const exchangeOracleUrl = (await axios.get(manifest)).data.exchange_oracle_url;
      setExchangeUrl(`${exchangeOracleUrl}?address=${address}`);
    }


    const balance = await Escrow.methods.getBalance().call();
    setBalance(web3.utils.fromWei(balance, 'ether'));
  }


  return (
    <div className="escrow-view">
      <div className="escrow-view-select-escrow">
        <input onChange={(e) => setEscrow(e.target.value)} value={escrow} />
        <button onClick={() => setMainEscrow(escrow)} disabled={!escrow}> Search Escrow </button>
      </div>
      <span> Paste either the address from the "Escrow created" field or a new one</span>
      <span> <b>Address: </b> {escrow} </span>
      <span> <b>Status: </b> {escrowStatus}</span>
      <span> <b>Balance: </b> {balance}</span>
      <span> <b>Recording Oracle: </b> {recordingOracle}</span>
      <span> <b>Recording Oracle Stake: </b> {recordingOracleStake}%</span>
      <span> <b>Reputation Oracle: </b> {reputationOracle}</span>
      <span> <b>Reputation Oracle Stake: </b> {reputationOracleStake}%</span>
      {exchangeUrl && <span> <a href={exchangeUrl} rel="noreferrer noopener" target="_blank"> Exchange </a></span> }
      <span>
        {!manifestUrl && <b> Manifest </b>}
        {manifestUrl && <a href={manifestUrl} rel="noreferrer noopener" target="_blank"> Manifest URL </a>}
       </span>
      <span>
        {!finalResultsUrl && <b> Final Results </b>}
        {finalResultsUrl && <a href={finalResultsUrl} rel="noreferrer noopener" target="_blank"> Final Results </a>}
     </span>
      { escrowStatus === 'Launched' && (
        <EscrowControls escrowAddr={escrow} onUpdate={() => setMainEscrow(escrow)} />
        )}
    </div>
  )
}


function EscrowControls({escrowAddr, onUpdate}) {
  const [recOracleAddr, setRecOracleAddr] = useState(REC_ORACLE_ADDRESS)
  const [recOracleStake, setRecOracleStake] = useState(10)
  const [repOracleAddr, setRepOracleAddr] = useState(REP_ORACLE_ADDRESS)
  const [repOracleStake, setRepOracleStake] = useState(10)
  const [manifestUrl, setManifestUrl] = useState('')
  const [hmt, setHmt] = useState(0);

  const web3 = getWeb3();
  const Escrow = new web3.eth.Contract(EscrowABI, escrowAddr);
  const Token = new web3.eth.Contract(HMTokenABI, HMT_ADDRESS);

  const fundEscrow = async () => {
    if (hmt <= 0) {
      return;
    }
    const accounts = await web3.eth.getAccounts();

    const value = web3.utils.toWei(hmt, 'ether');
    await Token.methods.transfer(escrowAddr, value).send({from: accounts[0]});

    onUpdate();
  }

  const setupEscrow = async () => {
    const accounts = await web3.eth.getAccounts();

    await Escrow.methods.setup(
      repOracleAddr,
      recOracleAddr,
      repOracleStake,
      recOracleStake,
      manifestUrl,
      manifestUrl
    ).send({from: accounts[0]})

    onUpdate();
  }


  return (
    <>
      <div>
        <p> Fund the escrow: </p>
        <input onChange={(e) => setHmt(e.target.value)} />
        <button onClick={() => fundEscrow(hmt)}> Fund </button>
      </div>
      <div>
        <div>
          <p> Recording Oracle </p>
          <input onChange={(e) => setRecOracleAddr(e.target.value)} value={recOracleAddr} />
        </div>
        <div>
          <p> Recording Oracle Stake </p>
          <input onChange={(e) => setRecOracleStake(e.target.value)} value={recOracleStake} />
        </div>
        <div>
          <p> Reputation Oracle </p>
          <input onChange={(e) => setRepOracleAddr(e.target.value)} value={repOracleAddr} />
        </div>
        <div>
          <p> Reputation Oracle Stake </p>
          <input onChange={(e) => setRepOracleStake(e.target.value)} value={repOracleStake} />
        </div>
        <div>
          <p> Manifest URL </p>
          <input onChange={(e) => setManifestUrl(e.target.value)} value={manifestUrl} />
        </div>
        <div>
            <button onClick={setupEscrow}> Setup Escrow </button>
        </div>
      </div>
    </>
  );
}
