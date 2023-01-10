// SPDX-License-Identifier: MIT
pragma solidity >=0.6.2;

import './utils/SafeMath.sol';
import './interfaces/IStaking.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

contract Reputation is Ownable {
    using SafeMath for int256;
    using Stakes for Stakes.Staker;

    struct Worker {
        address workerAddress;
        int256 reputation;
    }

    // Staking contract address
    address public staking;

    uint256 public MIN_STAKE = 1;
    int256 private constant MIN_REPUTATION = 1;
    int256 private constant MAX_REPUTATION = 100;
    mapping(address => int256) public reputations;

    constructor(address _staking) {
        require(_staking != address(0), 'Zero address provided');
        staking = _staking;
    }

    function addReputations(Worker[] memory _workers) public {
        Stakes.Staker memory staker = IStaking(staking).getStaker(msg.sender);
        require(
            staker.tokensAvailable() > MIN_STAKE,
            'Needs to stake HMT tokens to modify reputations.'
        );

        for (uint256 i = 0; i < _workers.length; i++) {
            if (
                reputations[_workers[i].workerAddress] +
                    _workers[i].reputation >
                MAX_REPUTATION ||
                (reputations[_workers[i].workerAddress] == 0 &&
                    50 + _workers[i].reputation > MAX_REPUTATION)
            ) {
                reputations[_workers[i].workerAddress] = MAX_REPUTATION;
            } else if (
                (reputations[_workers[i].workerAddress] == 0 &&
                    50 + _workers[i].reputation < MIN_REPUTATION) ||
                (reputations[_workers[i].workerAddress] +
                    _workers[i].reputation <
                    MIN_REPUTATION &&
                    reputations[_workers[i].workerAddress] != 0)
            ) {
                reputations[_workers[i].workerAddress] = MIN_REPUTATION;
            } else {
                if (reputations[_workers[i].workerAddress] == 0) {
                    reputations[_workers[i].workerAddress] =
                        50 +
                        _workers[i].reputation;
                } else {
                    reputations[_workers[i].workerAddress] =
                        reputations[_workers[i].workerAddress] +
                        _workers[i].reputation;
                }
            }
        }
    }

    function getReputations(
        address[] memory _workers
    ) public view returns (Worker[] memory) {
        Worker[] memory returnedValues = new Worker[](_workers.length);

        for (uint256 i = 0; i < _workers.length; i++) {
            returnedValues[i] = Worker(_workers[i], reputations[_workers[i]]);
        }

        return returnedValues;
    }

    function getRewards(
        int256 balance,
        address[] memory _workers
    ) public view returns (int256[] memory) {
        int256[] memory returnedValues = new int256[](_workers.length);
        int256 totalReputation = 0;

        for (uint256 i = 0; i < _workers.length; i++) {
            totalReputation += reputations[_workers[i]];
        }

        for (uint256 i = 0; i < _workers.length; i++) {
            returnedValues[i] =
                (balance * reputations[_workers[i]]) /
                totalReputation;
        }

        return returnedValues;
    }

    function updateStakingAmount(uint256 amount) public onlyOwner {
        MIN_STAKE = amount;
    }
}
