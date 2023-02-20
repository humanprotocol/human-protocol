import React, { useState, useEffect } from 'react';
import { ESCROW_FACTORY_ADDRESS, ESCROW_FACTORY_MX_ADDRESS } from '../../constants/constants';
import { useGetAccountInfo, useGetIsLoggedIn } from '@multiversx/sdk-dapp/hooks';
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

    let createdEscrow = await escrowFactory.createJob(addr);
    setEscrow(createdEscrow);
    setLastEscrow(createdEscrow);
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
