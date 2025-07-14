// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/governance/Governor.sol';
import '@openzeppelin/contracts/governance/extensions/GovernorSettings.sol';
import '@openzeppelin/contracts/governance/extensions/GovernorVotes.sol';
import '@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol';
import '@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol';
import '@openzeppelin/contracts/utils/Address.sol';
import './CrossChainGovernorCountingSimple.sol';
import './DAOSpokeContract.sol';
import './wormhole/IWormholeRelayer.sol';
import './wormhole/IWormholeReceiver.sol';
import './magistrate/Magistrate.sol';

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
    using Address for address payable;

    error MessageAlreadyProcessed();
    error OnlyRelayerAllowed();
    error InvalidIntendedRecipient();
    error ProposalAlreadyInitialized();
    error CollectionPhaseUnfinished();
    error RequestAfterVotePeriodOver();
    error CollectionPhaseAlreadyStarted();
    error OnlyMessagesFromSpokeReceived();

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
     *  @param _wormholeRelayerAddress The address of the wormhole automatic relayer contract used for cross-chain communication
     */
    constructor(
        IVotes _token,
        TimelockController _timelock,
        CrossChainAddress[] memory _spokeContracts,
        uint16 _chainId,
        address _wormholeRelayerAddress,
        address _magistrateAddress,
        uint256 _secondsPerBlock,
        uint48 _votingDelayInSeconds,
        uint32 _votingPeriodInSeconds,
        uint256 _proposalThreshold,
        uint256 _quorumFraction
    )
        Governor('MetaHumanGovernor')
        GovernorSettings(
            _votingDelayInSeconds,
            _votingPeriodInSeconds,
            _proposalThreshold
        )
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(_quorumFraction)
        GovernorTimelockControl(_timelock)
        CrossChainGovernorCountingSimple(_spokeContracts)
        Magistrate(_magistrateAddress)
    {
        chainId = _chainId;
        wormholeRelayer = IWormholeRelayer(_wormholeRelayerAddress);
        secondsPerBlock = _secondsPerBlock;
    }

    function cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) public override(Governor) returns (uint256) {
        uint256 proposalId = hashProposal(
            targets,
            values,
            calldatas,
            descriptionHash
        );

        if (spokeContractsSnapshots[proposalId].length > 0) {
            revert('Please use crossChainCancel for proposals with spokes.');
        }

        return super.cancel(targets, values, calldatas, descriptionHash);
    }

    function crossChainCancel(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata calldatas,
        bytes32 descriptionHash
    ) external payable returns (uint256) {
        uint256 proposalId = super.cancel(
            targets,
            values,
            calldatas,
            descriptionHash
        );
        bytes memory message = abi.encode(uint16(2), proposalId); // selector 2 = cancel
        _sendCrossChainMessageToSpokes(proposalId, message, address(this), 2);
        return proposalId;
    }

    /**
     * @dev Receives messages from the Wormhole protocol's relay mechanism and processes them accordingly.
     *  This function is intended to be called only by the designated Wormhole relayer.
     *  @param payload The payload of the received message.
     *  @param sourceAddress The address that initiated the message transmission (HelloWormhole contract address).
     *  @param sourceChain The chain ID of the source contract.
     *  @param deliveryHash A unique hash representing the delivery of the message to prevent duplicate processing.
     */
    function receiveWormholeMessages(
        bytes calldata payload,
        bytes[] calldata, // additionalVaas
        bytes32 sourceAddress, // address that called 'sendPayloadToEvm' (HelloWormhole contract address)
        uint16 sourceChain,
        bytes32 deliveryHash // this can be stored in a mapping deliveryHash => bool to prevent duplicate deliveries
    ) public payable override {
        if (msg.sender != address(wormholeRelayer)) {
            revert OnlyRelayerAllowed();
        }

        if (processedMessages[deliveryHash]) {
            revert MessageAlreadyProcessed();
        }

        (
            address intendedRecipient, //chainId
            ,
            ,
            bytes memory decodedMessage
        ) = abi.decode(payload, (address, uint16, address, bytes));

        if (intendedRecipient != address(this)) {
            revert InvalidIntendedRecipient();
        }

        processedMessages[deliveryHash] = true;
        // Gets a function selector option
        uint16 option;
        assembly {
            option := mload(add(decodedMessage, 32))
        }

        if (option == 0) {
            onReceiveSpokeVotingData(
                sourceChain,
                sourceAddress,
                decodedMessage
            );
        }
    }

    /**
     * @dev Processes the received voting data from the spoke contracts.
     * @param emitterChainId The chain ID of the emitter contract.
     * @param emitterAddress The address of the emitter contract.
     * @param payload The message payload.
     */
    function onReceiveSpokeVotingData(
        uint16 emitterChainId,
        bytes32 emitterAddress,
        bytes memory payload
    ) internal virtual {
        (
            ,
            // uint16 option
            uint256 _proposalId,
            uint256 _for,
            uint256 _against,
            uint256 _abstain
        ) = abi.decode(payload, (uint16, uint256, uint256, uint256, uint256));

        if (
            !spokeContractsMappingSnapshots[_proposalId][emitterAddress][
                emitterChainId
            ]
        ) {
            revert OnlyMessagesFromSpokeReceived();
        }

        require(
            spokeContractsMappingSnapshots[_proposalId][emitterAddress][
                emitterChainId
            ],
            'Only messages from the spoke contracts can be received!'
        );

        // As long as the received data isn't already initialized...
        if (
            spokeVotes[_proposalId][emitterAddress][emitterChainId].initialized
        ) {
            revert ProposalAlreadyInitialized();
        } else {
            // Add it to the map (while setting initialized true)
            spokeVotes[_proposalId][emitterAddress][
                emitterChainId
            ] = SpokeProposalVote(_for, _against, _abstain, true);

            _finishCollectionPhase(_proposalId);
        }
    }

    /**
     * @dev Checks if the collection phase for a proposal has finished.
     *  @param proposalId The ID of the proposal.
     */
    function _finishCollectionPhase(uint256 proposalId) internal {
        bool phaseFinished = true;
        uint256 spokeContractsLength = spokeContractsSnapshots[proposalId]
            .length;
        for (uint16 i = 1; i <= spokeContractsLength && phaseFinished; ++i) {
            phaseFinished =
                phaseFinished &&
                spokeVotes[proposalId][
                    spokeContractsSnapshots[proposalId][i - 1].contractAddress
                ][spokeContractsSnapshots[proposalId][i - 1].chainId]
                    .initialized;
        }

        collectionFinished[proposalId] = phaseFinished;
    }

    /**
     * @dev Requests the voting data from all of the spoke chains.
     *  @param proposalId The ID of the proposal.
     */
    function requestCollections(uint256 proposalId) public payable {
        if (block.timestamp < proposalDeadline(proposalId)) {
            revert RequestAfterVotePeriodOver();
        }

        if (collectionStarted[proposalId]) {
            revert CollectionPhaseAlreadyStarted();
        }

        collectionStarted[proposalId] = true;

        uint256 spokeContractsLength = spokeContractsSnapshots[proposalId]
            .length;

        // If there are no spoke contracts, finish the collection phase
        if (spokeContractsLength == 0) {
            _finishCollectionPhase(proposalId);
        }

        bytes memory message = abi.encode(uint16(1), proposalId); // selector 1 = requestCollections
        _sendCrossChainMessageToSpokes(proposalId, message, msg.sender, 1);
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
    ) external payable virtual onlyMagistrate returns (uint256) {
        uint256 proposalId = super.propose(
            targets,
            values,
            calldatas,
            description
        );

        //create snapshot of current spokes
        createSnapshot(proposalId);

        uint256 voteStartTimestamp = proposalSnapshot(proposalId);
        uint256 voteEndTimestamp = proposalDeadline(proposalId);

        bytes memory message = abi.encode(
            uint16(0), // selector 0 = propose
            proposalId,
            block.timestamp,
            voteStartTimestamp,
            voteEndTimestamp
        );
        _sendCrossChainMessageToSpokes(proposalId, message, address(this), 0);
        return proposalId;
    }

    /**
     * @dev Internal function to send a cross-chain message to all spoke contracts for a given proposal.
     * @param proposalId The ID of the proposal.
     * @param message The encoded message to send.
     * @param sender The address to set as msg.sender in the payload (for requestCollections, otherwise address(this)).
     * @param selector The function selector (0: propose, 1: requestCollections, 2: cancel).
     */
    function _sendCrossChainMessageToSpokes(
        uint256 proposalId,
        bytes memory message,
        address sender,
        uint16 selector
    ) internal {
        uint256 spokeContractsLength = spokeContractsSnapshots[proposalId]
            .length;
        uint256 sendMessageToHubCost = _quoteCrossChainMessage(chainId, 0);
        bool isRequestCollectionsMessage = (selector == 1);
        for (uint16 i = 1; i <= spokeContractsLength; ++i) {
            uint16 spokeChainId = spokeContractsSnapshots[proposalId][i - 1]
                .chainId;
            address spokeAddress = address(
                uint160(
                    uint256(
                        spokeContractsSnapshots[proposalId][i - 1]
                            .contractAddress
                    )
                )
            );
            bytes memory payload = abi.encode(
                spokeAddress,
                spokeChainId,
                sender,
                message
            );
            uint256 cost = _quoteCrossChainMessage(
                spokeChainId,
                isRequestCollectionsMessage ? sendMessageToHubCost : 0
            );
            wormholeRelayer.sendPayloadToEvm{value: cost}(
                spokeChainId,
                spokeAddress,
                payload,
                isRequestCollectionsMessage ? sendMessageToHubCost : 0,
                GAS_LIMIT,
                spokeChainId,
                magistrate()
            );
        }
    }

    /**
     * @dev Retrieves the quote for cross chain message delivery.
     *  @return cost Price, in units of current chain currency, that the delivery provider charges to perform the relay
     */
    function _quoteCrossChainMessage(
        uint16 targetChain,
        uint256 valueToSend
    ) internal view returns (uint256 cost) {
        (cost, ) = wormholeRelayer.quoteEVMDeliveryPrice(
            targetChain,
            valueToSend,
            GAS_LIMIT
        );
    }

    // The following functions are overrides required by Solidity.

    /**
     * @dev Retrieves the voting delay period.
     *  @return The duration of voting delay in seconds.
     */
    function votingDelay()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.votingDelay(); // Ensure this returns time in seconds
    }

    /**
     * @dev Retrieves the voting period duration.
     *  @return The duration of the voting period in seconds
     */
    function votingPeriod()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.votingPeriod(); // Ensure this returns time in seconds
    }

    /**
     * @dev Retrieves the quorum required for voting.
     *  @param snapshotTime The timestamp (snapshot) at which to calculate the quorum
     *  @return The required quorum percentage.
     */
    function quorum(
        uint256 snapshotTime
    )
        public
        view
        override(Governor, GovernorVotesQuorumFraction)
        returns (uint256)
    {
        return super.quorum(snapshotTime);
    }

    /**
     * @dev Retrieves the state of a proposal, ensuring that once the main voting period ends,
     * the proposal cannot be canceled regardless of the collection status from spoke chains.
     *
     * @param proposalId The ID of the proposal.
     * @return The current state of the proposal.
     */
    function state(
        uint256 proposalId
    )
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (ProposalState)
    {
        ProposalState calculatedState = super.state(proposalId);

        // Check if the main voting period has ended
        if (
            calculatedState == ProposalState.Succeeded ||
            calculatedState == ProposalState.Defeated
        ) {
            return calculatedState;
        }

        // Check if the collection phase has finished
        if (
            block.timestamp > proposalDeadline(proposalId) &&
            !collectionFinished[proposalId]
        ) {
            return ProposalState.Pending;
        }

        return calculatedState;
    }

    /**
     * @dev This is mocked to just revert. Left for compatibility reasons. The only way to create a proposal is [crossChainPropose](#crosschainpropose)
     */
    function propose(
        address[] memory,
        uint256[] memory,
        bytes[] memory,
        string memory
    ) public pure override(Governor) returns (uint256) {
        revert('Please use crossChainPropose instead.');
    }

    /**
     * @dev Retrieves the proposal threshold required for creating a proposal.
     *  @return The minimum number of votes required for a proposal to succeed.
     */
    function proposalThreshold()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.proposalThreshold();
    }

    /**
     * @dev Function to queue a proposal to the timelock.
     */
    function queue(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) public virtual override returns (uint256) {
        uint256 proposalId = hashProposal(
            targets,
            values,
            calldatas,
            descriptionHash
        );

        require(
            state(proposalId) == ProposalState.Succeeded,
            'Governor: proposal not successful'
        );

        return super.queue(targets, values, calldatas, descriptionHash);
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
    function _executor()
        internal
        view
        override(Governor, GovernorTimelockControl)
        returns (address)
    {
        return super._executor();
    }

    function _queueOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint48) {
        return
            super._queueOperations(
                proposalId,
                targets,
                values,
                calldatas,
                descriptionHash
            );
    }

    function _executeOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) {
        _finishCollectionPhase(proposalId);

        if (!collectionFinished[proposalId]) {
            revert CollectionPhaseUnfinished();
        }

        super._executeOperations(
            proposalId,
            targets,
            values,
            calldatas,
            descriptionHash
        );
    }

    /**
     * @dev Checks if a contract supports a given interface.
     *  @param interfaceId The interface identifier.
     *  @return A boolean indicating whether the interface is supported.
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(Governor) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function proposalNeedsQueuing(
        uint256 proposalId
    )
        public
        view
        virtual
        override(Governor, GovernorTimelockControl)
        returns (bool)
    {
        return super.proposalNeedsQueuing(proposalId);
    }
}
