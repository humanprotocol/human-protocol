// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import '@openzeppelin/contracts-upgradeable/governance/GovernorUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/governance/IGovernorUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/governance/extensions/GovernorSettingsUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/governance/extensions/GovernorVotesUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/governance/extensions/GovernorVotesQuorumFractionUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/governance/extensions/GovernorTimelockControlUpgradeable.sol';
import './CrossChainGovernorCountingSimple.sol';
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
    GovernorUpgradeable,
    GovernorSettingsUpgradeable,
    CrossChainGovernorCountingSimple,
    GovernorVotesUpgradeable,
    GovernorVotesQuorumFractionUpgradeable,
    GovernorTimelockControlUpgradeable,
    Magistrate,
    IWormholeReceiver
{
    error MessageAlreadyProcessed();
    error OnlyRelayerAllowed();
    error InvalidIntendedRecipient();
    error ProposalAlreadyInitialized();
    error CollectionPhaseUnfinished();
    error RequestAfterVotePeriodOver();
    error CollectionPhaseAlreadyStarted();
    error OnlyMessagesFromSpokeReceived();
    error UseCrossChainCancel();
    error UseCrossChainPropose();
    error ProposalNotSuccessful();
    error ZeroBalance();

    IWormholeRelayer public wormholeRelayer;
    uint256 internal constant GAS_LIMIT = 500_000;
    uint256 public secondsPerBlock;
    uint16 public chainId;

    mapping(bytes32 => bool) public processedMessages;
    mapping(uint256 => bool) public collectionStarted;
    mapping(uint256 => bool) public collectionFinished;

    uint256[50] private __gap;

    /**
     * @dev Contract constructor.
     *  @param _token The address of the token contract used for voting.
     *  @param _timelock The address of the timelock contract used for delayed execution.
     *  @param _spokeContracts An array of CrossChainAddress structs representing the spoke contracts.
     *  @param _chainId The chain ID of the current contract.
     *  @param _wormholeRelayerAddress The address of the wormhole automatic relayer contract used for cross-chain communication
     */
    function initialize(
        IVotesUpgradeable _token,
        TimelockControllerUpgradeable _timelock,
        CrossChainAddress[] memory _spokeContracts,
        uint16 _chainId,
        address _wormholeRelayerAddress,
        address _magistrateAddress,
        uint256 _secondsPerBlock,
        uint48 _votingDelayInSeconds,
        uint32 _votingPeriodInSeconds,
        uint256 _proposalThreshold,
        uint256 _quorumFraction
    ) public initializer {
        __Governor_init('MetaHumanGovernor');
        __GovernorSettings_init(
            _votingDelayInSeconds,
            _votingPeriodInSeconds,
            _proposalThreshold
        );
        __CrossChainGovernorCountingSimple_init(_spokeContracts);
        __GovernorVotes_init(_token);
        __GovernorVotesQuorumFraction_init(_quorumFraction);
        __GovernorTimelockControl_init(_timelock);
        __Magistrate_init(_magistrateAddress);

        chainId = _chainId;
        wormholeRelayer = IWormholeRelayer(_wormholeRelayerAddress);
        secondsPerBlock = _secondsPerBlock;
    }

    function cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    )
        public
        override(GovernorUpgradeable, IGovernorUpgradeable)
        returns (uint256)
    {
        uint256 proposalId = hashProposal(
            targets,
            values,
            calldatas,
            descriptionHash
        );

        if (spokeContractsSnapshots[proposalId].length > 0) {
            revert UseCrossChainCancel();
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
        _sendCrossChainMessageToSpokes(proposalId, message, address(this));
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
        for (uint16 i = 0; i < spokeContractsLength && phaseFinished; ++i) {
            phaseFinished =
                phaseFinished &&
                spokeVotes[proposalId][
                    spokeContractsSnapshots[proposalId][i].contractAddress
                ][spokeContractsSnapshots[proposalId][i].chainId].initialized;
        }

        collectionFinished[proposalId] = phaseFinished;
    }

    /**
     * @dev Requests the voting data from all of the spoke chains.
     *  @param proposalId The ID of the proposal.
     */
    function requestCollections(uint256 proposalId) external payable {
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
        _sendCrossChainMessageToSpokes(proposalId, message, msg.sender);
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
        _sendCrossChainMessageToSpokes(proposalId, message, address(this));
        return proposalId;
    }

    /**
     * @dev Internal function to send a cross-chain message to all spoke contracts for a given proposal.
     * @param proposalId The ID of the proposal.
     * @param message The encoded message to send.
     * @param sender The address to set as msg.sender in the payload (for requestCollections, otherwise address(this)).
     */
    function _sendCrossChainMessageToSpokes(
        uint256 proposalId,
        bytes memory message,
        address sender
    ) internal {
        uint256 spokeContractsLength = spokeContractsSnapshots[proposalId]
            .length;
        for (uint16 i = 0; i < spokeContractsLength; ++i) {
            uint16 spokeChainId = spokeContractsSnapshots[proposalId][i]
                .chainId;
            address spokeAddress = address(
                uint160(
                    uint256(
                        spokeContractsSnapshots[proposalId][i].contractAddress
                    )
                )
            );
            bytes memory payload = abi.encode(
                spokeAddress,
                spokeChainId,
                sender,
                message
            );
            uint256 cost = _quoteCrossChainMessage(spokeChainId, 0);
            wormholeRelayer.sendPayloadToEvm{value: cost}(
                spokeChainId,
                spokeAddress,
                payload,
                0,
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
        override(IGovernorUpgradeable, GovernorSettingsUpgradeable)
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
        override(IGovernorUpgradeable, GovernorSettingsUpgradeable)
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
        override(IGovernorUpgradeable, GovernorVotesQuorumFractionUpgradeable)
        returns (uint256)
    {
        return super.quorum(snapshotTime);
    }

    /**
     * @dev Retrieves the state of a proposal.
     *
     * @param proposalId The ID of the proposal.
     * @return The current state of the proposal.
     */
    function state(
        uint256 proposalId
    )
        public
        view
        override(GovernorUpgradeable, GovernorTimelockControlUpgradeable)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }

    /**
     * @dev This is mocked to just revert. Left for compatibility reasons. The only way to create a proposal is [crossChainPropose](#crosschainpropose)
     */
    function propose(
        address[] memory,
        uint256[] memory,
        bytes[] memory,
        string memory
    )
        public
        pure
        override(GovernorUpgradeable, IGovernorUpgradeable)
        returns (uint256)
    {
        revert UseCrossChainPropose();
    }

    /**
     * @dev Retrieves the proposal threshold required for creating a proposal.
     *  @return The minimum number of votes required for a proposal to succeed.
     */
    function proposalThreshold()
        public
        view
        override(GovernorUpgradeable, GovernorSettingsUpgradeable)
        returns (uint256)
    {
        return super.proposalThreshold();
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
    )
        internal
        override(GovernorUpgradeable, GovernorTimelockControlUpgradeable)
        returns (uint256)
    {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    /**
     * @dev Retrieves the executor address.
     *  @return The address of the executor.
     */
    function _executor()
        internal
        view
        override(GovernorUpgradeable, GovernorTimelockControlUpgradeable)
        returns (address)
    {
        return super._executor();
    }

    function _execute(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    )
        internal
        override(GovernorUpgradeable, GovernorTimelockControlUpgradeable)
    {
        _finishCollectionPhase(proposalId);

        if (!collectionFinished[proposalId]) {
            revert CollectionPhaseUnfinished();
        }

        super._execute(proposalId, targets, values, calldatas, descriptionHash);
    }

    /**
     * @dev Checks if a contract supports a given interface.
     *  @param interfaceId The interface identifier.
     *  @return A boolean indicating whether the interface is supported.
     */
    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        override(GovernorUpgradeable, GovernorTimelockControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Withdraws the contract's balance to the magistrate address.
     * Can only be called by the magistrate.
     */
    function withdraw() external onlyMagistrate {
        uint256 balance = address(this).balance;
        if (balance == 0) {
            revert ZeroBalance();
        }
        payable(msg.sender).transfer(balance);
    }

    receive() external payable override(GovernorUpgradeable) {}
}
