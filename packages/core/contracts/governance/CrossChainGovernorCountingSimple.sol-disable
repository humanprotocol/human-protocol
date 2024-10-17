// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/governance/Governor.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

/**
 * @title CrossChainGovernorCountingSimple
 *   @dev CrossChainGovernorCountingSimple is an abstract contract that provides counting and vote functionality for a cross-chain governor.
 *   It extends the Governor and Ownable contracts.
 */
abstract contract CrossChainGovernorCountingSimple is Governor, Ownable {
    mapping(bytes32 => mapping(uint16 => bool)) public spokeContractsMapping;
    CrossChainAddress[] public spokeContracts;
    mapping(uint256 => mapping(bytes32 => mapping(uint16 => bool)))
        public spokeContractsMappingSnapshots;
    mapping(uint256 => CrossChainAddress[]) public spokeContractsSnapshots;
    mapping(uint256 => mapping(bytes32 => mapping(uint16 => SpokeProposalVote)))
        public spokeVotes;
    mapping(uint256 => ProposalVote) private _proposalVotes;

    struct CrossChainAddress {
        bytes32 contractAddress;
        uint16 chainId;
    }

    struct SpokeProposalVote {
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        bool initialized;
    }

    /**
     * @dev Supported vote types. Matches Governor Bravo ordering.
     */
    enum VoteType {
        Against,
        For,
        Abstain
    }

    struct ProposalVote {
        uint256 againstVotes;
        uint256 forVotes;
        uint256 abstainVotes;
        mapping(address => bool) hasVoted;
    }

    event SpokesUpdated(CrossChainAddress[] indexed spokes);

    constructor(
        CrossChainAddress[] memory _spokeContracts
    ) Ownable(msg.sender) {
        updateSpokeContracts(_spokeContracts);
    }

    /**
     * @dev Creates the spoke contracts snapshot for given proposalId.
     *   @param proposalId id of a proposal that will use the snapshot.
     */
    function createSnapshot(uint256 proposalId) internal {
        uint256 spokeContractsLength = spokeContracts.length;
        for (uint256 i = 1; i <= spokeContractsLength; ++i) {
            CrossChainAddress memory addressToSnapshot = spokeContracts[i - 1];
            spokeContractsMappingSnapshots[proposalId][
                addressToSnapshot.contractAddress
            ][addressToSnapshot.chainId] = true;
        }
        spokeContractsSnapshots[proposalId] = spokeContracts;
    }

    /**
     * @dev Updates the spoke contracts.
     *   @param _spokeContracts An array of CrossChainAddress structs representing the spoke contracts.
     */
    function updateSpokeContracts(
        CrossChainAddress[] memory _spokeContracts
    ) public onlyOwner {
        uint256 spokeContractsLength = spokeContracts.length;
        //clear existing mapping
        for (uint256 i = 1; i <= spokeContractsLength; ++i) {
            CrossChainAddress memory addressToRemove = spokeContracts[i - 1];
            spokeContractsMapping[addressToRemove.contractAddress][
                addressToRemove.chainId
            ] = false;
        }
        delete spokeContracts;
        uint256 newSpokeContractsLength = _spokeContracts.length;
        for (uint256 i = 1; i <= newSpokeContractsLength; ++i) {
            CrossChainAddress memory addressToAdd = _spokeContracts[i - 1];
            if (
                spokeContractsMapping[addressToAdd.contractAddress][
                    addressToAdd.chainId
                ] == true
            ) {
                //check if duplicate
                revert('Duplicates are not allowed');
            }
            spokeContractsMapping[addressToAdd.contractAddress][
                addressToAdd.chainId
            ] = true;
            spokeContracts.push(addressToAdd);
        }

        emit SpokesUpdated(spokeContracts);
    }

    /**
     * @dev See {IGovernor-COUNTING_MODE}.
     */
    // solhint-disable-next-line func-name-mixedcase
    function COUNTING_MODE()
        public
        pure
        virtual
        override
        returns (string memory)
    {
        return 'support=bravo&quorum=for,abstain';
    }

    /**
     * @dev See {IGovernor-hasVoted}.
     */
    function hasVoted(
        uint256 proposalId,
        address account
    ) public view virtual override returns (bool) {
        return _proposalVotes[proposalId].hasVoted[account];
    }

    /**
     * @dev Retrieves the vote counts for a proposal.
     * @param proposalId The ID of the proposal.
     * @return againstVotes Against vote count.
     * @return forVotes For vote count.
     * @return abstainVotes Abstain vote count.
     */
    function proposalVotes(
        uint256 proposalId
    )
        public
        view
        virtual
        returns (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes)
    {
        ProposalVote storage proposalVote = _proposalVotes[proposalId];

        uint256 sumAgainstVotes = proposalVote.againstVotes;
        uint256 sumForVotes = proposalVote.forVotes;
        uint256 sumAbstainVotes = proposalVote.abstainVotes;

        uint256 spokeContractsLength = spokeContracts.length;
        for (uint16 i = 1; i <= spokeContractsLength; ++i) {
            CrossChainAddress memory currentContract = spokeContracts[i - 1];
            SpokeProposalVote storage v = spokeVotes[proposalId][
                currentContract.contractAddress
            ][currentContract.chainId];
            sumAgainstVotes += v.againstVotes;
            sumForVotes += v.forVotes;
            sumAbstainVotes += v.abstainVotes;
        }

        return (sumAgainstVotes, sumForVotes, sumAbstainVotes);
    }

    /**
     * @dev See {Governor-_quorumReached}.
     */
    function _quorumReached(
        uint256 proposalId
    ) internal view virtual override returns (bool) {
        ProposalVote storage proposalVote = _proposalVotes[proposalId];
        uint256 abstainVotes = proposalVote.abstainVotes;
        uint256 forVotes = proposalVote.forVotes;

        uint256 spokeContractsLength = spokeContracts.length;
        for (uint16 i = 1; i <= spokeContractsLength; ++i) {
            CrossChainAddress memory currentContract = spokeContracts[i - 1];
            SpokeProposalVote storage v = spokeVotes[proposalId][
                currentContract.contractAddress
            ][currentContract.chainId];
            abstainVotes += v.abstainVotes;
            forVotes += v.forVotes;
        }

        return quorum(proposalSnapshot(proposalId)) <= forVotes + abstainVotes;
    }

    /**
     * @dev See {Governor-_voteSucceeded}. In this module, the forVotes must be strictly over the againstVotes.
     */
    function _voteSucceeded(
        uint256 proposalId
    ) internal view virtual override returns (bool) {
        ProposalVote storage proposalVote = _proposalVotes[proposalId];
        uint256 againstVotes = proposalVote.againstVotes;
        uint256 forVotes = proposalVote.forVotes;

        uint256 spokeContractsLength = spokeContracts.length;
        for (uint16 i = 1; i <= spokeContractsLength; ++i) {
            CrossChainAddress memory currentContract = spokeContracts[i - 1];
            SpokeProposalVote storage v = spokeVotes[proposalId][
                currentContract.contractAddress
            ][currentContract.chainId];
            againstVotes += v.againstVotes;
            forVotes += v.forVotes;
        }
        return forVotes > againstVotes;
    }

    /**
     * @dev See {Governor-_countVote}. In this module, the support follows the `VoteType` enum (from Governor Bravo).
     */
    function _countVote(
        uint256 proposalId,
        address account,
        uint8 support,
        uint256 weight,
        bytes memory // params
    ) internal virtual override {
        ProposalVote storage proposalVote = _proposalVotes[proposalId];

        require(
            !proposalVote.hasVoted[account],
            'GovernorVotingSimple: vote already cast'
        );
        proposalVote.hasVoted[account] = true;

        if (support == uint8(VoteType.Against)) {
            proposalVote.againstVotes += weight;
        } else if (support == uint8(VoteType.For)) {
            proposalVote.forVotes += weight;
        } else if (support == uint8(VoteType.Abstain)) {
            proposalVote.abstainVotes += weight;
        } else {
            revert('GovernorVotingSimple: invalid value for enum VoteType');
        }
    }
}
