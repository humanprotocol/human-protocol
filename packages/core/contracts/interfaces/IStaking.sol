// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import '../libs/Stakes.sol';

interface IStaking {
    function setMinimumStake(uint256 _minimumStake) external;

    function setLockPeriod(uint32 _lockPeriod) external;

    function getAvailableStake(address _staker) external view returns (uint256);

    function getStakedTokens(address _staker) external view returns (uint256);

    function stake(uint256 _tokens) external;

    function unstake(uint256 _tokens) external;

    function withdraw() external;

    function slash(
        address _slasher,
        address _staker,
        address _escrowAddress,
        uint256 _tokens
    ) external;

    function getListOfStakers(
        uint256 _startIndex,
        uint256 _limit
    ) external view returns (address[] memory, Stakes.Staker[] memory);

    function withdrawFees() external;

    function addSlasher(address _slasher) external;

    function removeSlasher(address _slasher) external;
}
