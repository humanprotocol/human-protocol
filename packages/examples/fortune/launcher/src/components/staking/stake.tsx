import React, { useState } from 'react';
import getWeb3 from '../../utils/web3';
import { Contract } from 'web3-eth-contract';
import stakingAbi from '@human-protocol/core/abis/Staking.json';
import factoryAbi from "@human-protocol/core/abis/EscrowFactory.json";
import { ESCROW_FACTORY_ADDRESS } from "../../constants/constants";

export default function Stake() {
    const web3 = getWeb3();
    const [stakeAmount, setStake] = useState(0);
    const factory = new web3.eth.Contract(factoryAbi as [], ESCROW_FACTORY_ADDRESS);
    let staking: Contract;
    
    async function stake(){
        const stakingAddress = await factory.methods.staking().call();
        if(!staking){
            staking = new web3.eth.Contract(stakingAbi as [], stakingAddress);
        }
        if (stakeAmount <= 0) {
            return;
        }
        const accounts = await web3.eth.getAccounts();
    
        const value = web3.utils.toWei(stakeAmount.toString(), 'ether');
        await staking.methods.stake(value).send({from: accounts[0]});
    }
    return (
        <div>
            <p>HMT staking amount(You need to be approved as a staker before): </p>
            <input type='number' onChange={(e) => setStake(Number(e.target.value))} />
            <button onClick={() => stake()}> Stake </button>
        </div>
      );
}