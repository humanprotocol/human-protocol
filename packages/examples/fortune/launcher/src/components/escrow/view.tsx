import React, { useState } from 'react';
import axios from 'axios';
import EscrowABI from '@human-protocol/core/abis/Escrow.json';
import { REC_ORACLE_ADDRESS, REP_ORACLE_ADDRESS} from '../../constants/constants';
import { EscrowInterface } from '../escrow-interface.service';
import { Web3EscrowContract } from '../web3/service/escrow.service';
import { useGetIsLoggedIn } from '@multiversx/sdk-dapp/hooks';
import { EscrowService } from '../mx/service/escrow.service';


const statusesMap = ['Launched', 'Pending', 'Partial', 'Paid', 'Complete', 'Cancelled'];

export default function Escrow() {

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
  const isMxLoggedId = useGetIsLoggedIn();



  const setMainEscrow = async (address: string) => {
    setEscrow(address);

    var Escrow: EscrowInterface;
    if (isMxLoggedId) {
      Escrow = new EscrowService(address);
    } else {
      Escrow = new Web3EscrowContract(EscrowABI as [], address);
    }

    const escrowSt = await Escrow.getStatus();
    setEscrowStatus(statusesMap[escrowSt]);

    const recOracleAddr = await Escrow.getRecordingOracle();
    setRecordingOracle(recOracleAddr);

    const recOracleStake = await Escrow.getRecordingOracleStake();
    setRecordingOracleStake(recOracleStake);

    const repOracleAddr = await Escrow.getReputationOracle();
    setReputationOracle(repOracleAddr);

    const repOracleStake = await Escrow.getReputationOracleStake();
    setReputationOracleStake(repOracleStake);

    const finalResults = await Escrow.getFinalResults();
    setFinalResultsUrl(finalResults);

    const manifest = await Escrow.getManifest();
    setManifestUrl(manifest);

    if (manifest) {
      const exchangeOracleUrl = (await axios.get(manifest)).data.exchange_oracle_url;
      setExchangeUrl(`${exchangeOracleUrl}?address=${address}`);
    }

    const balance = await Escrow.getBalance();
    setBalance(balance);
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
        <EscrowControls escrowAddr={escrow} onUpdate={() => setMainEscrow(escrow)} isMxLoggedId={isMxLoggedId} />
        )}
    </div>
  )
}


function EscrowControls({escrowAddr, onUpdate, isMxLoggedId}: any) {
  const [recOracleAddr, setRecOracleAddr] = useState(REC_ORACLE_ADDRESS)
  const [recOracleStake, setRecOracleStake] = useState(10)
  const [repOracleAddr, setRepOracleAddr] = useState(REP_ORACLE_ADDRESS)
  const [repOracleStake, setRepOracleStake] = useState(10)
  const [manifestUrl, setManifestUrl] = useState('')
  const [hmt, setHmt] = useState(0);

  const Escrow = isMxLoggedId ? new EscrowService(escrowAddr) : new Web3EscrowContract(EscrowABI as [], escrowAddr);

  const fundEscrow = async () => {
    if (hmt <= 0) {
      return;
    }
    await Escrow.fundEscrow(hmt);

    onUpdate();
  }

  const setupEscrow = async () => {
    const payload = {
      reputation_oracle: repOracleAddr,
      recording_oracle: recOracleAddr,
      reputation_oracle_stake: repOracleStake,
      recording_oracle_stake: recOracleStake,
      url: manifestUrl,
      hash: manifestUrl
    };
    await Escrow.setupEscrow(payload);

    onUpdate();
  }

  return (
    <>
      <div>
        <p> Fund the escrow: </p>
        <input onChange={(e) => setHmt(Number(e.target.value))} />
        <button onClick={() => fundEscrow()}> Fund </button>
      </div>
      <div>
        <div>
          <p> Recording Oracle </p>
          <input onChange={(e) => setRecOracleAddr(e.target.value)} value={recOracleAddr} />
        </div>
        <div>
          <p> Recording Oracle Stake </p>
          <input onChange={(e) => setRecOracleStake(Number(e.target.value))} value={recOracleStake} />
        </div>
        <div>
          <p> Reputation Oracle </p>
          <input onChange={(e) => setRepOracleAddr(e.target.value)} value={repOracleAddr} />
        </div>
        <div>
          <p> Reputation Oracle Stake </p>
          <input onChange={(e) => setRepOracleStake(Number(e.target.value))} value={repOracleStake} />
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
