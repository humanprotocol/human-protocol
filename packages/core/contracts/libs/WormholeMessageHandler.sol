// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../CrossChainGovernorCountingSimple.sol"; 
import "../wormhole/IWormholeRelayer.sol";
import "../Errors.sol";

library WormholeMessageHandler {
        function receiveWormholeMessages(
            IWormholeRelayer wormholeRelayer,
            mapping(bytes32 => bool) storage processedMessages,
            bytes memory payload,
            bytes[] memory additionalVaas, 
            bytes32 sourceAddress, 
            uint16 sourceChain,
            bytes32 deliveryHash,
            mapping(bytes32 => mapping(uint16 => bool)) storage spokeContractsMapping, 
            mapping(uint256 => mapping(bytes32 => mapping(uint16 => CrossChainGovernorCountingSimple.SpokeProposalVote))) storage spokeVotes, 
            CrossChainGovernorCountingSimple.CrossChainAddress[] storage spokeContracts,
            mapping(uint256 => bool) storage collectionFinished
        )public {
            if (msg.sender != address(wormholeRelayer)) {
                revert Errors.RelayerOnly(); 
            } 

            if (!spokeContractsMapping[sourceAddress][sourceChain]) {
                revert Errors.OnlySpokeMessages();
            }

            if (processedMessages[deliveryHash]){
                revert Errors.AlreadyProcessed();
            }

            (
            address intendedRecipient,
            ,//chainId
            ,//sender
            bytes memory decodedMessage
            ) = abi.decode(payload, (address, uint16, address, bytes));

        
            assembly {
                if iszero(eq(intendedRecipient, address())) {
                    revert(0, 0)
                }
            }
            processedMessages[deliveryHash] = true;
            uint16 option;
            assembly {
                option := mload(add(decodedMessage, 32))
            }

            if (option == 0) {
                onReceiveSpokeVotingData(
                    sourceChain, 
                    sourceAddress, 
                    decodedMessage, 
                    spokeContracts, 
                    spokeVotes,
                    collectionFinished 
                );
            }

        }

        function onReceiveSpokeVotingData(
            uint16 emitterChainId, 
            bytes32 emitterAddress, 
            bytes memory payload,
            CrossChainGovernorCountingSimple.CrossChainAddress[] storage spokeContracts,
            mapping(uint256 => mapping(bytes32 => mapping(uint16 => CrossChainGovernorCountingSimple.SpokeProposalVote))) storage spokeVotes,
            mapping(uint256 => bool) storage collectionFinished 
        ) internal {
                (
            , // uint16 option
            uint256 _proposalId,
            uint256 _for,
            uint256 _against,
            uint256 _abstain
            ) = abi.decode(payload, (uint16, uint256, uint256, uint256, uint256));
            if (spokeVotes[_proposalId][emitterAddress][emitterChainId].initialized) {
                revert Errors.AlreadyInitialized();
            } else {
                spokeVotes[_proposalId][emitterAddress][emitterChainId] = CrossChainGovernorCountingSimple.SpokeProposalVote(
                    _for,
                    _against,
                    _abstain,
                    true
                );

                _finishCollectionPhase(spokeVotes, spokeContracts, collectionFinished, _proposalId);
            }

        }

  
        function _finishCollectionPhase(
            mapping(uint256 => mapping(bytes32 => mapping(uint16 => CrossChainGovernorCountingSimple.SpokeProposalVote))) storage spokeVotes, 
            CrossChainGovernorCountingSimple.CrossChainAddress[] storage spokeContracts, 
            mapping(uint256 => bool) storage collectionFinished, 
            uint256 proposalId) internal {
                bool phaseFinished = true;
                uint spokeContractsLength = spokeContracts.length;
                for (uint16 i = 1; i <= spokeContractsLength && phaseFinished; ++i) {
                    phaseFinished =
                    phaseFinished &&
                    spokeVotes[proposalId][spokeContracts[i-1].contractAddress][spokeContracts[i-1].chainId].initialized;
                }

                collectionFinished[proposalId] = phaseFinished;
        }






}