import React, { useState, useEffect } from "react";
import getWeb3 from "./../web3";
import factoryFile from "../build/contracts/EscrowFactory.json";
import { ESCROW_FACTORY_ADDRESS } from "../constants";

export default function CreateEscrow({ onEscrowCreated }) {
  const factoryAbi = factoryFile.abi;
  const [escrow, setEscrow] = useState("");
  const [lastEscrow, setLastEscrow] = useState("");
  const web3 = getWeb3();
  const escrowFactory = new web3.eth.Contract(
    factoryAbi,
    ESCROW_FACTORY_ADDRESS
  );

  useEffect(() => {
    const init = async () => {
      const lastEscrowAddr = await escrowFactory.methods.lastEscrow().call();
  
      setLastEscrow(lastEscrowAddr);
    };

    init();
  }, []);

  const create = async () => {
    const accounts = await web3.eth.getAccounts();
    const mainAccount = accounts[0];

    escrowFactory.once("Launched", null, function (error, event) {
      const {
        returnValues: { escrow },
      } = event;
      setEscrow(escrow);
      setLastEscrow(escrow);
    });

    await escrowFactory.methods
      .createEscrow([mainAccount])
      .send({ from: mainAccount });
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
