// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2;

import '../libs/Stakes.sol';

interface IStaking {
    function setMinimumStake(uint256 _minimumStake) external;

    function setLockPeriod(uint32 _lockPeriod) external;

    function hasStake(address _indexer) external view returns (bool);

    function hasAvailableStake(address _indexer) external view returns (bool);

    function getStakedTokens(address _staker) external view returns (uint256);

    function getStaker(
        address _staker
    ) external view returns (Stakes.Staker memory);

    function stake(uint256 _tokens) external;

    function unstake(uint256 _tokens) external;

    function withdraw() external;

    function slash(
        address _slasher,
        address _staker,
        address _escrowAddress,
        uint256 _tokens
    ) external;

    function getListOfStakers()
        external
        view
        returns (address[] memory, Stakes.Staker[] memory);
}
