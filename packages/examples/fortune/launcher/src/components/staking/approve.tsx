import React, { useState } from 'react';
import getWeb3 from '../../utils/web3';
import factoryAbi from "@human-protocol/core/abis/EscrowFactory.json";
import hmTokenAbi from '@human-protocol/core/abis/HMToken.json';
import { ESCROW_FACTORY_ADDRESS, HMT_ADDRESS } from "../../constants/constants";

export default function Approve() {
    const web3 = getWeb3();
    const [approveAmount, setApprove] = useState(0);
    const hmToken = new web3.eth.Contract(hmTokenAbi as [], HMT_ADDRESS);
    const factory = new web3.eth.Contract(factoryAbi as [], ESCROW_FACTORY_ADDRESS);
    async function approve(){
        const stakingAddress = await factory.methods.staking().call();
        if (approveAmount <= 0) {
            return;
          }
          const accounts = await web3.eth.getAccounts();
      
          const value = web3.utils.toWei(approveAmount.toString(), 'ether');
          await hmToken.methods.approve(stakingAddress, value).send({from: accounts[0]});
    }
    return (
        <div>
            <p>Approve HMT for staking contract: </p>
            <input type='number' onChange={(e) => setApprove(Number(e.target.value))} />
            <button onClick={() => approve()}> Approve </button>
        </div>
      );
}