// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2;

import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';

import '../interfaces/IStaking.sol';
import '../Escrow.sol';

contract EscrowFactoryV0 is OwnableUpgradeable, UUPSUpgradeable {
    // all Escrows will have this duration.
    uint256 constant STANDARD_DURATION = 8640000;
    string constant ERROR_ZERO_ADDRESS = 'EscrowFactory: Zero Address';

    uint256 public counter;
    mapping(address => uint256) public escrowCounters;
    address public lastEscrow;
    address public eip20;
    address public staking;
    event Launched(address eip20, address escrow);

    function initialize(
        address _eip20,
        address _staking
    ) external payable virtual initializer {
        __Ownable_init_unchained();
        __EscrowFactory_init_unchained(_eip20, _staking);
    }

    function __EscrowFactory_init_unchained(
        address _eip20,
        address _staking
    ) internal onlyInitializing {
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

    // solhint-disable-next-line no-empty-blocks
    function _authorizeUpgrade(address) internal override onlyOwner {}

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[43] private __gap;
}
