import React, { useState, useEffect } from 'react';
import getWeb3 from '../../utils/web3';
import factoryAbi from '@human-protocol/core/abis/EscrowFactory.json';
import { ESCROW_FACTORY_ADDRESS, HMT_ADDRESS } from '../../constants/constants';

export default function CreateEscrow() {
  const [escrow, setEscrow] = useState('');
  const [lastEscrow, setLastEscrow] = useState('');
  const web3 = getWeb3();
  const escrowFactory = new web3.eth.Contract(
    factoryAbi as [],
    ESCROW_FACTORY_ADDRESS
  );

  useEffect(() => {
    (async function () {
      const lastEscrowAddr = await escrowFactory.methods.lastEscrow().call();

      setLastEscrow(lastEscrowAddr);
    })();
  }, [escrowFactory.methods]);

  const create = async () => {
    const accounts = await web3.eth.getAccounts();
    const mainAccount = accounts[0];

    const createdEscrow = await escrowFactory.methods
      .createEscrow(HMT_ADDRESS, [mainAccount])
      .send({ from: mainAccount });
    setEscrow(createdEscrow.events.Launched.returnValues.escrow);
  };

  return (
    <div className="escrow-create">
      <span> Factory address {ESCROW_FACTORY_ADDRESS}</span>
      <span> Last escrow created {lastEscrow} </span>
      <span> Escrow created: {escrow} </span>
      <button onClick={create}> Create the Escrow </button>
    </div>
  );
}
