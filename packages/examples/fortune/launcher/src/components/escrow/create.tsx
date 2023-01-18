import React, { useState, useEffect } from 'react';
import getWeb3 from '../../utils/web3';
import factoryAbi from '@human-protocol/core/abis/EscrowFactory.json';
import { ESCROW_FACTORY_ADDRESS } from '../../constants/constants';

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
      .createEscrow([mainAccount])
      .send({ from: mainAccount });
    setEscrow(createdEscrow.events.Launched.returnValues.escrow);
  };

  return (
    <div className="escrow-create">
      <div className="mb-4">
        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
          Select Network
        </label>
        <select className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
          <option value={1}>Mainnet</option>
          <option value={56}>BSC</option>
          <option value={137}>Polygon</option>
        </select>
      </div>
      <div className="mb-4">
        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
          Title
        </label>
        <input className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" />
      </div>
      <div className="mb-4">
        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
          Description
        </label>
        <textarea
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          rows={4}
        />
      </div>
      <div className="mb-4">
        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
          Fortunes requested
        </label>
      </div>
      <div className="mb-4">
        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
          Token for funding
        </label>
      </div>
      <div className="mb-4">
        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
          Fund amount
        </label>
        <input className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" />
      </div>
      <div className="mb-4">
        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
          Job requester address
        </label>
        <input className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" />
      </div>
      <button className="w-full text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 font-medium rounded-full text-sm px-5 py-2.5 text-center mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
        Create Escrow
      </button>
      {/* <span> Factory address {ESCROW_FACTORY_ADDRESS}</span>
      <span> Last escrow created {lastEscrow} </span>
      <span> Escrow created: {escrow} </span>
      <button onClick={create}> Create the Escrow </button> */}
    </div>
  );
}
