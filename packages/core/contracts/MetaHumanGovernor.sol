// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";
import "./CrossChainGovernorCountingSimple.sol";
import "./wormhole/IWormholeRelayer.sol";
import "./wormhole/IWormholeReceiver.sol";
import "./magistrate/Magistrate.sol";
import "./libs/WormholeMessageHandler.sol";

import "./Errors.sol";

/**
 * @title MetaHumanGovernor
 *   @dev MetaHumanGovernor is a contract that serves as a governance system for MetaHuman-related operations. It extends multiple contracts to incorporate various functionalities.
 * 
 *   This is the hub contract in the MetaHuman governance smart contracts infrastructure.
 *   It's based on OpenZeppelin's {Governor} implementation along with basic extensions.
 *   For more details check out [OpenZeppelin's documentation](https://docs.openzeppelin.com/contracts/4.x/api/governance#governor).
 */
contract MetaHumanGovernor is
    Governor,
    GovernorSettings,
    CrossChainGovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    GovernorTimelockControl,
    Magistrate,
    IWormholeReceiver
{
    
    IWormholeRelayer public immutable wormholeRelayer;
    uint256 internal constant GAS_LIMIT = 500_000;
    uint256 public immutable secondsPerBlock;
    uint16 public immutable chainId;

    mapping(bytes32 => bool) public processedMessages;
    mapping(uint256 => bool) public collectionStarted;
    mapping(uint256 => bool) public collectionFinished;

    /**
     * @dev Contract constructor.
     *  @param _token The address of the token contract used for voting.
     *  @param _timelock The address of the timelock contract used for delayed execution.
     *  @param _spokeContracts An array of CrossChainAddress structs representing the spoke contracts.
     *  @param _chainId The chain ID of the current contract.
     *  @param _wormholeRelayerAddress The address of the wormhole automatic relayer contract used for cross-chain communication.
     */
    constructor(
        IVotes _token,
        TimelockController _timelock,
        CrossChainAddress[] memory _spokeContracts,
        uint16 _chainId,
        address _wormholeRelayerAddress,
        address _magistrateAddress,
        uint256 _secondsPerBlock
    )
        Governor("MetaHumanGovernor")
        GovernorSettings(1, /* 1 block */ 20 * 15, /* 20 blocks per minute * 15 minutes (polygon mumbai) */ 0) //TODO:prod in production voting delay, voting period, proposal threshold needs to be changed to value of choice. Depending on block time on selected hub chain and desired period
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(4) //TODO:prod change quorum fraction to value of choice
        GovernorTimelockControl(_timelock)
        CrossChainGovernorCountingSimple(_spokeContracts)
        Magistrate(_magistrateAddress)
    {
        chainId = _chainId;
        wormholeRelayer = IWormholeRelayer(_wormholeRelayerAddress);
        secondsPerBlock = _secondsPerBlock;
    }

    /**
     * @dev Allows the magistrate address to withdraw all funds from the contract
     */
    function withdrawFunds() public onlyMagistrate {
        payable(msg.sender).transfer(address(this).balance);
    }

    function receiveWormholeMessages(
    bytes memory payload,
    bytes[] memory additionalVaas,
    bytes32 sourceAddress,
    uint16 sourceChain,
    bytes32 deliveryHash
    ) public payable override {
        WormholeMessageHandler.receiveWormholeMessages(
            wormholeRelayer,
            processedMessages,
            payload,
            additionalVaas,
            sourceAddress,
            sourceChain,
            deliveryHash,
            spokeContractsMapping, 
            spokeVotes, 
            spokeContracts,
            collectionFinished
        );
    }

    /**
     * @dev Executes operations before the execution of a proposal.
     * @param proposalId The ID of the proposal.
     * @param targets The array of target addresses.
     * @param values The array of values to be sent in the transactions.
     * @param calldatas The array of calldata for the transactions.
     * @param descriptionHash The hash of the proposal description.
     */
    function _beforeExecute(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override {
        WormholeMessageHandler._finishCollectionPhase(spokeVotes, spokeContracts, collectionFinished, proposalId);

        if (!collectionFinished[proposalId]){
            revert Errors.CollectionUnfinished(); 
        }

        super._beforeExecute(proposalId, targets, values, calldatas, descriptionHash);
    }

    /**
     * @dev Retrieves the quote for cross chain message delivery.
     *  @return cost Price, in units of current chain currency, that the delivery provider charges to perform the relay
     */
    function quoteCrossChainMessage(uint16 targetChain, uint256 valueToSend)
        internal
        view
        returns (uint256 cost)
    {
        (cost,) = wormholeRelayer.quoteEVMDeliveryPrice(targetChain, valueToSend, GAS_LIMIT);
    }

     /**
     @dev Requests the voting data from all of the spoke chains.
     @param proposalId The ID of the proposal.
    */
    function requestCollections(uint256 proposalId) public {

        if (block.number <= proposalDeadline(proposalId)) {
            revert Errors.PeriodNotOver(); 
        }

        if (collectionStarted[proposalId]) {
            revert Errors.CollectionStarted(); 
        }

        collectionStarted[proposalId] = true;


        uint spokeContractsLength = spokeContracts.length;
        // Get a price of sending the message back to hub
        uint256 sendMessageToHubCost = quoteCrossChainMessage(chainId, 0);

        // Sends an empty message to each of the aggregators.
        // If they receive a message, it is their cue to send data back
        for (uint16 i = 1; i <= spokeContractsLength; ++i) {
            // Using "1" as the function selector
            bytes memory message = abi.encode(1, proposalId);
            bytes memory payload = abi.encode(
                spokeContracts[i-1].contractAddress,
                spokeContracts[i-1].chainId,
                msg.sender,
                message
            );

            uint256 cost = quoteCrossChainMessage(spokeContracts[i-1].chainId, sendMessageToHubCost);

            wormholeRelayer.sendPayloadToEvm{value: cost}(
                spokeContracts[i-1].chainId,
                address(uint160(uint256(spokeContracts[i-1].contractAddress))),
                payload,
                sendMessageToHubCost, // send value to enable the spoke to send back vote result
                GAS_LIMIT,
                spokeContracts[i-1].chainId,
                msg.sender
            );

        }
    }

     /**
     * @dev Estimates timestamp when given block number should be the current block.
     *  @return blockToEstimate Block to estimate the timestamp for.
     */
    function estimateTimestampFromBlock(uint256 blockToEstimate)
        internal
        view
        returns (uint256)
    {
        uint256 currentTimestamp = block.timestamp;
        uint256 currentBlock = block.number;
        uint256 estimatedTimestamp = 0;
        if (blockToEstimate > currentBlock) {
            //future
            uint256 blockDifference = blockToEstimate - currentBlock;
            uint256 timeDifference = blockDifference * secondsPerBlock;
            estimatedTimestamp = currentTimestamp + timeDifference;
        } else {
            //past
            uint256 blockDifference = currentBlock - blockToEstimate;
            uint256 timeDifference = blockDifference * secondsPerBlock;
            estimatedTimestamp = currentTimestamp - timeDifference;
        }

        return estimatedTimestamp;
    }

    /**
     * @dev Creates and publishes a proposal to the spoke contracts.
     *  This function can be executed only by the magistrate address
     *  @param targets The array of target addresses.
     *  @param values The array of values to be sent in the transactions.
     *  @param calldatas The array of calldata for the transactions.
     *  @param description The description of the proposal.
     *  @return The ID of the created proposal.
     */
    function crossChainPropose(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata calldatas,
        string calldata description
    ) public payable virtual onlyMagistrate returns (uint256) {
        uint256 proposalId = super.propose(targets, values, calldatas, description);

        //create snapshot of current spokes
        createSnapshot(proposalId);

        uint256 voteStartTimestamp = estimateTimestampFromBlock(proposalSnapshot(proposalId));
        uint256 voteEndTimestamp = estimateTimestampFromBlock(proposalDeadline(proposalId));

        // Sends the proposal to all of the other spoke contracts
        if (spokeContractsSnapshots[proposalId].length > 0) {
            // Iterate over every spoke contract and send a message
            uint256 spokeContractsLength = spokeContractsSnapshots[proposalId].length;
            for (uint16 i = 1; i <= spokeContractsLength; ++i) {
                bytes memory message = abi.encode(
                    0, // Function selector "0" for destination contract
                    proposalId,
                    block.timestamp, // proposal creation timestamp
                    voteStartTimestamp, //vote start timestamp
                    voteEndTimestamp //vote end timestamp
                );

                bytes memory payload = abi.encode(
                    spokeContractsSnapshots[proposalId][i - 1].contractAddress,
                    spokeContractsSnapshots[proposalId][i - 1].chainId,
                    bytes32(uint256(uint160(address(this)))),
                    message
                );

                uint256 cost = quoteCrossChainMessage(spokeContractsSnapshots[proposalId][i - 1].chainId, 0);

                wormholeRelayer.sendPayloadToEvm{value: cost}(
                    spokeContractsSnapshots[proposalId][i - 1].chainId,
                    address(uint160(uint256(spokeContractsSnapshots[proposalId][i - 1].contractAddress))),
                    payload,
                    0, // no receiver value needed
                    GAS_LIMIT
                );
            }
        }
        return proposalId;
    }

    // The following functions are overrides required by Solidity.

    /**
     * @dev Retrieves the voting delay period.
     *  @return The duration of the voting delay in blocks.
     */
    function votingDelay() public view override(IGovernor, GovernorSettings) returns (uint256) {
        return super.votingDelay();
    }

    /**
     * @dev Retrieves the voting period duration.
     *  @return The duration of the voting period in blocks.
     */
    function votingPeriod() public view override(IGovernor, GovernorSettings) returns (uint256) {
        return super.votingPeriod();
    }

    /**
     * @dev Retrieves the quorum required for voting.
     *  @param blockNumber The block number to calculate the quorum for.
     *  @return The required quorum percentage.
     */
    function quorum(uint256 blockNumber)
        public
        view
        override(IGovernor, GovernorVotesQuorumFraction)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }

    /**
     * @dev Retrieves the state of a proposal.
     *  @param proposalId The ID of the proposal.
     *  @return The current state of the proposal.
     */
    function state(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (ProposalState)
    {
        ProposalState calculatedState = super.state(proposalId);
        if (
            (calculatedState == ProposalState.Succeeded || calculatedState == ProposalState.Defeated)
                && !collectionFinished[proposalId]
        ) {
            return ProposalState.Pending;
        }
        return calculatedState;
    }

    /**
    @dev This is mocked to just revert. Left for compatibility reasons. The only way to create a proposal is [crossChainPropose](#crosschainpropose)
    */
    function propose(address[] memory, uint256[] memory, bytes[] memory, string memory)
    public
    pure
    override(Governor, IGovernor)
    returns (uint256)
    {
        revert Errors.CrossChainProposeOnly(); 
    }

    /**
     * @dev Retrieves the proposal threshold required for creating a proposal.
     *  @return The minimum number of votes required for a proposal to succeed.
     */
    function proposalThreshold() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.proposalThreshold();
    }

    /**
     * @dev Executes a proposal.
     *  @param proposalId The ID of the proposal.
     *  @param targets The array of target addresses.
     *  @param values The array of values to be sent in the transactions.
     *  @param calldatas The array of calldata for the transactions.
     */
    function _execute(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) {
        super._execute(proposalId, targets, values, calldatas, descriptionHash);
    }
    
    /**
     * @dev Cancels a proposal.
     *  @param targets The array of target addresses.
     *  @param values The array of values to be sent in the transactions.
     *  @param calldatas The array of calldata for the transactions.
     *  @param descriptionHash The hash of the proposal description.
     *  @return The ID of the canceled proposal.
     */
    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    /**
     * @dev Retrieves the executor address.
     *  @return The address of the executor.
     */
    function _executor() internal view override(Governor, GovernorTimelockControl) returns (address) {
        return super._executor();
    }

    /**
     * @dev Checks if a contract supports a given interface.
     *  @param interfaceId The interface identifier.
     *  @return A boolean indicating whether the interface is supported.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
