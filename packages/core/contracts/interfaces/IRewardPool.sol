// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2;

interface IRewardPool {
    /**
     * @dev Keep track of slashers how much they slashed per allocations
     */
    struct Reward {
        address escrowAddress;
        address slasher;
        uint256 tokens; // Tokens allocated to a escrowAddress
    }

    function addReward(
        address _escrowAddress,
        address slasher,
        uint256 tokens
    ) external;

    function getRewards(address _escrowAddress)
        external
        view
        returns (Reward[] memory);

    function distributeReward(address _escrowAddress) external;
}
