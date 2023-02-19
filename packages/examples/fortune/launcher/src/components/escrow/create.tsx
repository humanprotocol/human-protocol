import React, { useState, useEffect } from 'react';
import factoryAbi from '@human-protocol/core/abis/EscrowFactory.json';
import { ESCROW_FACTORY_ADDRESS, ESCROW_FACTORY_MX_ADDRESS } from '../../constants/constants';
import { useGetIsLoggedIn } from '@multiversx/sdk-dapp/hooks';
import EscrowFactory from '../mx/service/escrow-factory.service';
import { FactoryInterface } from '../escrow-interface.service';
import { Web3EscrowFactory } from '../web3/service/escrow-factory.service';

export default function CreateEscrow() {
  const [escrow, setEscrow] = useState('');
  const [lastEscrow, setLastEscrow] = useState('');
  const [escrowContractAddress, setEscrowContractAddress] = useState('');
  const [escrowFactory, setEscrowFactory] = useState<FactoryInterface>(
    new Web3EscrowFactory(
      factoryAbi as [],
      ESCROW_FACTORY_ADDRESS
    )
  );
  const isMxLoggedId = useGetIsLoggedIn();

  useEffect(() => {
    if (isMxLoggedId) {
      setEscrowContractAddress(ESCROW_FACTORY_MX_ADDRESS);
      setEscrowFactory(new EscrowFactory());
    } else {
      setEscrowContractAddress(ESCROW_FACTORY_ADDRESS)
    }
  }, [isMxLoggedId]);

  useEffect(() => {
    (async function () {
      const lastEscrowAddr = await escrowFactory.getLastEscrowAddress();
      setLastEscrow(lastEscrowAddr);
    })();
  }, [escrowFactory]);

  const create = async () => {
    let createdEscrow = await escrowFactory.createJob();
    setEscrow(createdEscrow.events.Launched.returnValues.escrow);
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
