// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface ISpokeInteractionManager {

    function onReceiveSpokeVotingData(uint16 emitterChainId, bytes32 emitterAddress, bytes memory payload) external;
    



}