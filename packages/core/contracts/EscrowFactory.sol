// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2;

import './Escrow.sol';
import './interfaces/IStaking.sol';

contract EscrowFactory {
    // all Escrows will have this duration.
    uint256 constant STANDARD_DURATION = 8640000;

    // Owner address
    address public owner;

    uint256 public counter;
    mapping(address => uint256) public escrowCounters;
    address public lastEscrow;
    address public eip20;
    address public staking;
    event Launched(address eip20, address escrow, uint256 counter);

    constructor(address _eip20) {
        eip20 = _eip20;
        owner = msg.sender;
    }

    function setStaking(address _staking) external onlyOwner {
        require(staking == address(0), 'Staking already set');
        staking = _staking;
    }

    function createEscrow(
        address[] memory trustedHandlers
    ) public returns (address) {
        require(staking != address(0), 'Staking is not configured');
        bool hasAvailableStake = IStaking(staking).hasAvailableStake(
            msg.sender
        );
        require(
            hasAvailableStake == true,
            'Needs to stake HMT tokens to create an escrow.'
        );

        Escrow escrow = new Escrow(
            eip20,
            staking,
            payable(msg.sender),
            STANDARD_DURATION,
            trustedHandlers
        );
        counter++;
        escrowCounters[address(escrow)] = counter;
        lastEscrow = address(escrow);
        emit Launched(eip20, lastEscrow, counter);
        return lastEscrow;
    }

    function isChild(address _child) public view returns (bool) {
        return escrowCounters[_child] == counter;
    }

    function hasEscrow(address _address) public view returns (bool) {
        return escrowCounters[_address] != 0;
    }

    modifier onlyOwner() {
        require(owner == msg.sender, 'Caller is not owner');
        _;
    }
}
