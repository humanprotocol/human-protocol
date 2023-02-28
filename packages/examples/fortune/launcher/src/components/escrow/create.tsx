import React, { useState, useEffect } from 'react';
import { ESCROW_FACTORY_ADDRESS, ESCROW_FACTORY_MX_ADDRESS } from '../../constants/constants';
import { useGetAccountInfo, useGetIsLoggedIn, useTrackTransactionStatus } from '@multiversx/sdk-dapp/hooks';
import EscrowFactory from '../mx/service/escrow-factory.service';
import { FactoryInterface } from '../escrow-interface.service';
import { Web3EscrowFactory } from '../web3/service/escrow-factory.service';
import { Address } from '@multiversx/sdk-core/out';

export default function CreateEscrow() {
  const isMxLoggedIn = useGetIsLoggedIn();
  const { address } = useGetAccountInfo();
  const [escrow, setEscrow] = useState('');
  const [lastEscrow, setLastEscrow] = useState('');
  const [escrowContractAddress, setEscrowContractAddress] = useState('');
  const [escrowFactory, setEscrowFactory] = useState<FactoryInterface>(
    !Boolean(address) ? new Web3EscrowFactory() : new EscrowFactory()
  );

  const [sessionId, setSessionId] = useState<string | null>(null);

  const handleSuccessCreation = async () => {
    const transactions = transactionStatus.transactions;
    if (transactions !== undefined) {
      const lastTxHash = transactions[0].hash;
      const resp = await escrowFactory.getTxOutcome(lastTxHash);
      setLastEscrow(resp.firstValue?.valueOf().toString());
      setEscrow(resp.firstValue?.valueOf().toString());
    }
    setSessionId(null);
  };

  const handleFailureCreation = () => {
    setSessionId(null);
  };

  const transactionStatus = useTrackTransactionStatus({
    transactionId: sessionId,
    onSuccess: handleSuccessCreation,
    onFail: handleFailureCreation,
    onCancelled: handleFailureCreation
  });


  useEffect(() => {
    if (isMxLoggedIn) {
      setEscrowContractAddress(ESCROW_FACTORY_MX_ADDRESS);
      setEscrowFactory(new EscrowFactory());
    } else {
      setEscrowContractAddress(ESCROW_FACTORY_ADDRESS)
    }
  }, [isMxLoggedIn]);

  useEffect(() => {
    (async function () {
      let userAddress: Address | null = null;
      if (address !== undefined) {
        userAddress = new Address(address);
      }

      const lastEscrowAddr = await escrowFactory.getLastEscrowAddress(userAddress);
      setLastEscrow(lastEscrowAddr);
    })();
  }, [escrowFactory, address]);

  const create = async () => {
    let addr;
    if (Boolean(address)) {
      addr = new Address(address);
    } else {
      addr = null;
    }

    const resp = await escrowFactory.createJob(addr);

    if (escrowFactory instanceof EscrowFactory) {
      setSessionId(resp.sessionId);
    } else {
      setEscrow(resp);
      setLastEscrow(resp);
    }
  };

  return (
    <div className="escrow-create">
      <span> Factory address {escrowContractAddress}</span>
      <span> Last escrow created {lastEscrow} </span>
      <span> Escrow created: {escrow} </span>
      <button onClick={create}> Create the Escrow </button>
    </div>
  );
}
