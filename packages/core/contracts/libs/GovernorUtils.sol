// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.9;

// import "@openzeppelin/contracts/governance/IGovernor.sol";
// import "../CrossChainGovernorCountingSimple.sol";
// import "../wormhole/IWormholeRelayer.sol";
// import "../Errors.sol";

// library GovernanceUtils {

//     struct GovernorData {
//         IWormholeRelayer wormholeRelayer;
//         uint256 gasLimit; 
//         uint256 secondsPerBlock;
//         uint16 chainId; 
//     }

//     function quoteCrossChainMessage(GovernorData storage data, uint16 targetChain, uint256 valueToSend)
//         internal
//         view
//         returns (uint256 cost)
//     {
//         (cost,) = data.wormholeRelayer.quoteEVMDeliveryPrice(targetChain, valueToSend, data.gasLimit);
//     }

//     function requestCollections(
//         IWormholeRelayer wormholeRelayer,
//         mapping(uint256 => bool) storage collectionStarted,
//         mapping(uint256 => CrossChainGovernorCountingSimple.CrossChainAddress[]) storage spokeContractsSnapshots,
//         uint16 chainId,
//         uint256 proposalId,
//         uint256 proposalDeadline
//     ) external {
//         if (block.number <= proposalDeadline(proposalId)) {
//             revert Errors.PeriodNotOver(); 
//         }

//         if (collectionStarted[proposalId]) {
//             revert Errors.CollectionStarted(); 
//         }

//         collectionStarted[proposalId] = true;


//         uint spokeContractsLength = spokeContracts.length;
//         // Get a price of sending the message back to hub
//         uint256 sendMessageToHubCost = quoteCrossChainMessage(chainId, 0);

//         // Sends an empty message to each of the aggregators.
//         // If they receive a message, it is their cue to send data back
//         for (uint16 i = 1; i <= spokeContractsLength; ++i) {
//             // Using "1" as the function selector
//             bytes memory message = abi.encode(1, proposalId);
//             bytes memory payload = abi.encode(
//                 spokeContracts[i-1].contractAddress,
//                 spokeContracts[i-1].chainId,
//                 msg.sender,
//                 message
//             );

//             uint256 cost = quoteCrossChainMessage(spokeContracts[i-1].chainId, sendMessageToHubCost);

//             wormholeRelayer.sendPayloadToEvm{value: cost}(
//                 spokeContracts[i-1].chainId,
//                 address(uint160(uint256(spokeContracts[i-1].contractAddress))),
//                 payload,
//                 sendMessageToHubCost, // send value to enable the spoke to send back vote result
//                 GAS_LIMIT,
//                 spokeContracts[i-1].chainId,
//                 msg.sender
//             );

//         }

//     }

//     function crossChainPropose(
//         IGovernor governor,
//         address[] memory targets,
//         uint256[] memory values,
//         bytes[] memory calldatas,
//         string memory description,
//         uint256[] storage snapshot,
//         CrossChainGovernorCountingSimple.CrossChainAddress[] storage spokeContracts,
//         IWormholeRelayer wormholeRelayer,
//         uint16 chainId
//     ) external returns (uint256) {
//          uint256 proposalId = super.propose(targets, values, calldatas, description);

//         //create snapshot of current spokes
//         createSnapshot(proposalId);

//         uint256 voteStartTimestamp = estimateTimestampFromBlock(proposalSnapshot(proposalId));
//         uint256 voteEndTimestamp = estimateTimestampFromBlock(proposalDeadline(proposalId));

//         // Sends the proposal to all of the other spoke contracts
//         if (spokeContractsSnapshots[proposalId].length > 0) {
//             // Iterate over every spoke contract and send a message
//             uint256 spokeContractsLength = spokeContractsSnapshots[proposalId].length;
//             for (uint16 i = 1; i <= spokeContractsLength; ++i) {
//                 bytes memory message = abi.encode(
//                     0, // Function selector "0" for destination contract
//                     proposalId,
//                     block.timestamp, // proposal creation timestamp
//                     voteStartTimestamp, //vote start timestamp
//                     voteEndTimestamp //vote end timestamp
//                 );

//                 bytes memory payload = abi.encode(
//                     spokeContractsSnapshots[proposalId][i - 1].contractAddress,
//                     spokeContractsSnapshots[proposalId][i - 1].chainId,
//                     bytes32(uint256(uint160(address(this)))),
//                     message
//                 );

//                 uint256 cost = quoteCrossChainMessage(spokeContractsSnapshots[proposalId][i - 1].chainId, 0);

//                 wormholeRelayer.sendPayloadToEvm{value: cost}(
//                     spokeContractsSnapshots[proposalId][i - 1].chainId,
//                     address(uint160(uint256(spokeContractsSnapshots[proposalId][i - 1].contractAddress))),
//                     payload,
//                     0, // no receiver value needed
//                     GAS_LIMIT
//                 );
//             }
//         }
//         return proposalId;
//     }
    
// }