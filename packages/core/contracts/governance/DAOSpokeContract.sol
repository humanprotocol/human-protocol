// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/utils/structs/Checkpoints.sol';
import '@openzeppelin/contracts/governance/utils/IVotes.sol';
import '@openzeppelin/contracts/utils/Address.sol';

import './MetaHumanGovernor.sol';
import './wormhole/IWormholeRelayer.sol';
import './wormhole/IWormholeReceiver.sol';
import './magistrate/Magistrate.sol';

/**
 * @title DAOSpokeContract
 *   @dev DAOSpokeContract is a contract that handles voting and proposal functionality for a DAO spoke chain.
 *   It integrates with the MetaHumanGovernor contract for governance operations.
 */
contract DAOSpokeContract is IWormholeReceiver, Magistrate {
    using Address for address payable;
    error NotStartedVote();
    error VoteFinished();
    error VoteNotActive();
    error VoteAlreadyCast();
    error InvalidVoteType(uint8 support);
    error OnlyRelayerAllowed();
    error OnlyMessagesFromHub();
    error MessageAlreadyProcessed();
    error InvalidIntendedRecipient();
    error ProposalIdMustBeUnique();
    error VoteNotFinished();
    error RelaySendFailed();
    error ZeroBalance();

    bytes32 public immutable hubContractAddress;
    uint16 public immutable hubContractChainId;
    IVotes public immutable token;
    uint256 public immutable targetSecondsPerBlock;
    IWormholeRelayer public immutable wormholeRelayer;
    uint16 public immutable chainId;

    uint256 internal constant GAS_LIMIT = 500_000;
    mapping(uint256 => RemoteProposal) public proposals;
    mapping(uint256 => ProposalVote) public proposalVotes;
    mapping(bytes32 => bool) public processedMessages;

    struct ProposalVote {
        uint256 againstVotes;
        uint256 forVotes;
        uint256 abstainVotes;
        mapping(address => bool) hasVoted;
    }

    enum VoteType {
        Against,
        For,
        Abstain
    }

    struct RemoteProposal {
        // Blocks provided by the hub chain as to when the local votes should start/finish.
        uint256 proposalCreation;
        uint256 localVoteStart;
        uint256 localVoteEnd;
        uint256 localVoteStartBlock;
        bool voteFinished;
    }

    event VoteCast(
        address indexed voter,
        uint256 proposalId,
        uint8 support,
        uint256 weight,
        string reason
    );

    /**
     * @dev Contract constructor.
     *   @param _hubContractAddress The address of the hub contract.
     *   @param _hubContractChainId The chain ID of the hub contract.
     *   @param _token The address of the token contract used for voting.
     *   @param _targetSecondsPerBlock The target number of seconds per block for block estimation.
     *   @param _chainId The chain ID of the current contract.
     *   @param _wormholeRelayerAddress The address of the wormhole automatic relayer contract used for cross-chain communication.
     *   @param _magistrateAddress The initial magistrate address.
     */
    constructor(
        bytes32 _hubContractAddress,
        uint16 _hubContractChainId,
        IVotes _token,
        uint256 _targetSecondsPerBlock,
        uint16 _chainId,
        address _wormholeRelayerAddress,
        address _magistrateAddress
    ) {
        _transferMagistrate(_magistrateAddress);
        token = _token;
        targetSecondsPerBlock = _targetSecondsPerBlock;
        chainId = _chainId;
        wormholeRelayer = IWormholeRelayer(_wormholeRelayerAddress);
        hubContractAddress = _hubContractAddress;
        hubContractChainId = _hubContractChainId;
    }

    function hasVoted(
        uint256 proposalId,
        address account
    ) public view virtual returns (bool) {
        return proposalVotes[proposalId].hasVoted[account];
    }

    /**
     * @dev Checks if a proposal exists.
     *  @param proposalId The ID of the proposal.
     *  @return A boolean indicating whether the proposal exists.
     */
    function isProposal(uint256 proposalId) public view returns (bool) {
        return proposals[proposalId].localVoteStart != 0;
    }

    /**
     * @dev Casts a vote for a proposal.
     *  @param proposalId The ID of the proposal.
     *  @param support The vote type (0 - Against, 1 - For, 2 - Abstain).
     *  @return The voting weight of the voter.
     */
    function castVote(
        uint256 proposalId,
        uint8 support
    ) public virtual returns (uint256) {
        RemoteProposal storage proposal = proposals[proposalId];
        if (!isProposal(proposalId)) revert NotStartedVote();
        if (proposal.voteFinished) revert VoteFinished();
        if (
            !(block.timestamp >= proposal.localVoteStart &&
                block.timestamp < proposal.localVoteEnd)
        ) revert VoteNotActive();

        uint256 weight = token.getPastVotes(
            msg.sender,
            proposal.localVoteStart
        );
        _countVote(proposalId, msg.sender, support, weight);

        emit VoteCast(msg.sender, proposalId, support, weight, '');

        return weight;
    }

    /**
     * @dev Internal function to count a vote for a proposal.
     *  @param proposalId The ID of the proposal.
     *  @param account The address of the voter.
     *  @param support The vote type (0 - Against, 1 - For, 2 - Abstain).
     *  @param weight The voting weight of the voter.
     */
    function _countVote(
        uint256 proposalId,
        address account,
        uint8 support,
        uint256 weight
    ) internal virtual {
        ProposalVote storage proposalVote = proposalVotes[proposalId];

        if (proposalVote.hasVoted[account]) revert VoteAlreadyCast();
        proposalVote.hasVoted[account] = true;

        if (support == uint8(VoteType.Against)) {
            proposalVote.againstVotes += weight;
        } else if (support == uint8(VoteType.For)) {
            proposalVote.forVotes += weight;
        } else if (support == uint8(VoteType.Abstain)) {
            proposalVote.abstainVotes += weight;
        } else {
            revert InvalidVoteType(support);
        }
    }

    /**
     * @dev Estimates what block number will be the current block on given timestamp.
     *  @return timestampToEstimate Timestamp to estimate the block for.
     */
    function estimateBlockFromTimestamp(
        uint256 timestampToEstimate
    ) internal view returns (uint256) {
        uint256 currentTimestamp = block.timestamp;
        uint256 currentBlock = block.number;
        uint256 estimatedBlock = 0;
        if (timestampToEstimate > currentTimestamp) {
            //future
            uint256 timeDifference = timestampToEstimate - currentTimestamp;
            uint256 blockDifference = timeDifference / targetSecondsPerBlock;
            estimatedBlock = currentBlock + blockDifference;
        } else {
            //past
            uint256 timeDifference = currentTimestamp - timestampToEstimate;
            uint256 blockDifference = timeDifference / targetSecondsPerBlock;
            estimatedBlock = currentBlock - blockDifference;
        }

        return estimatedBlock;
    }

    /**
     * @dev Sends the vote result of a proposal to the hub contract.
     *  @param proposalId The ID of the proposal.
     *  @return A boolean indicating whether the message was sent successfully.
     */
    function _sendVoteResultToHub(uint256 proposalId) internal returns (bool) {
        ProposalVote storage votes = proposalVotes[proposalId];
        bytes memory messageToSend = abi.encode(
            0,
            proposalId,
            votes.forVotes,
            votes.againstVotes,
            votes.abstainVotes
        );
        bytes memory payloadToSend = abi.encode(
            hubContractAddress,
            hubContractChainId,
            msg.sender,
            messageToSend
        );

        uint256 cost = quoteCrossChainMessage(hubContractChainId);
        try
            wormholeRelayer.sendPayloadToEvm{value: cost}(
                hubContractChainId,
                address(uint160(uint256(hubContractAddress))),
                payloadToSend,
                0,
                GAS_LIMIT,
                hubContractChainId,
                magistrate()
            )
        {
            return true;
        } catch {
            return false;
        }
    }

    /**
     * @dev Receives messages from the Wormhole protocol's relay mechanism and processes them accordingly.
     *  This function is intended to be called only by the designated Wormhole relayer.
     *  @param payload The payload of the received message.
     *  @param sourceAddress The address that initiated the message transmission (Hub contract address).
     *  @param sourceChain The chain ID of the source contract.
     *  @param deliveryHash A unique hash representing the delivery of the message to prevent duplicate processing.
     */
    function receiveWormholeMessages(
        bytes memory payload,
        bytes[] memory, // additionalVaas
        bytes32 sourceAddress,
        uint16 sourceChain,
        bytes32 deliveryHash
    ) public payable override {
        if (msg.sender != address(wormholeRelayer)) revert OnlyRelayerAllowed();

        if (
            !(hubContractAddress == sourceAddress &&
                hubContractChainId == sourceChain)
        ) revert OnlyMessagesFromHub();

        if (processedMessages[deliveryHash]) revert MessageAlreadyProcessed();

        (
            address intendedRecipient, //chainId //sender
            ,
            ,
            bytes memory decodedMessage
        ) = abi.decode(payload, (address, uint16, address, bytes));

        if (intendedRecipient != address(this))
            revert InvalidIntendedRecipient();

        processedMessages[deliveryHash] = true;

        uint16 option;
        assembly {
            option := mload(add(decodedMessage, 32))
        }

        if (option == 0) {
            // Begin a proposal on the local chain, with local block times
            (
                ,
                //function selector
                uint256 proposalId,
                uint256 proposalCreationTimestamp,
                uint256 voteStartTimestamp,
                uint256 voteEndTimestamp
            ) = abi.decode(
                    decodedMessage,
                    (uint16, uint256, uint256, uint256, uint256)
                );
            if (isProposal(proposalId)) revert ProposalIdMustBeUnique();

            proposals[proposalId] = RemoteProposal(
                proposalCreationTimestamp,
                voteStartTimestamp,
                voteEndTimestamp,
                estimateBlockFromTimestamp(voteStartTimestamp),
                false
            );
        } else if (option == 1) {
            (, uint256 proposalId) = abi.decode(
                decodedMessage,
                (uint16, uint256)
            );

            proposals[proposalId].voteFinished = true;

            _sendVoteResultToHub(proposalId);
        }
    }

    function sendVoteResultToHub(
        uint256 proposalId
    ) public payable onlyMagistrate {
        if (!proposals[proposalId].voteFinished) revert VoteNotFinished();

        bool ok = _sendVoteResultToHub(proposalId);
        if (!ok) revert RelaySendFailed();
    }

    /**
     * @dev Withdraws the contract's balance to the magistrate address.
     * Can only be called by the magistrate.
     */
    function withdraw() external onlyMagistrate {
        uint256 balance = address(this).balance;
        if (balance == 0) revert ZeroBalance();
        payable(msg.sender).sendValue(balance);
    }

    /**
     * @dev Retrieves the quote for cross chain message delivery.
     *  @return cost Price, in units of current chain currency, that the delivery provider charges to perform the relay
     */
    function quoteCrossChainMessage(
        uint16 targetChain
    ) internal view returns (uint256 cost) {
        (cost, ) = wormholeRelayer.quoteEVMDeliveryPrice(
            targetChain,
            0,
            GAS_LIMIT
        );
    }

    receive() external payable {}
}
