// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2;

import './Escrow.sol';
import './interfaces/IStaking.sol';

contract EscrowFactory {
    // all Escrows will have this duration.
    uint256 constant STANDARD_DURATION = 8640000;
    string constant ERROR_ZERO_ADDRESS = 'EscrowFactory: Zero Address';

    uint256 public counter;
    mapping(address => uint256) public escrowCounters;
    address public lastEscrow;
    address public eip20;
    address public staking;
    event Launched(address eip20, address escrow);

    constructor(address _eip20, address _staking) {
        require(_eip20 != address(0), ERROR_ZERO_ADDRESS);
        eip20 = _eip20;
        require(_staking != address(0), ERROR_ZERO_ADDRESS);
        staking = _staking;
    }

    function createEscrow(
        address[] memory trustedHandlers
    ) public returns (address) {
        bool hasAvailableStake = IStaking(staking).hasAvailableStake(
            msg.sender
        );
        require(
            hasAvailableStake == true,
            'Needs to stake HMT tokens to create an escrow.'
        );

        Escrow escrow = new Escrow(
            eip20,
            payable(msg.sender),
            STANDARD_DURATION,
            trustedHandlers
        );
        counter++;
        escrowCounters[address(escrow)] = counter;
        lastEscrow = address(escrow);
        emit Launched(eip20, lastEscrow);
        return lastEscrow;
    }

    function isChild(address _child) public view returns (bool) {
        return escrowCounters[_child] == counter;
    }

    function hasEscrow(address _address) public view returns (bool) {
        return escrowCounters[_address] != 0;
    }
}
