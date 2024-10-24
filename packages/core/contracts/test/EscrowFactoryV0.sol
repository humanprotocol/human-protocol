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
    address public staking;

    event Launched(address token, address escrow);
    event LaunchedV2(address token, address escrow, string jobRequesterId);

    function initialize(address _staking) external payable virtual initializer {
        __Ownable_init_unchained();
        __EscrowFactory_init_unchained(_staking);
    }

    function __EscrowFactory_init_unchained(
        address _staking
    ) internal onlyInitializing {
        require(_staking != address(0), ERROR_ZERO_ADDRESS);
        staking = _staking;
    }

    function createEscrow(
        address token,
        address[] memory trustedHandlers,
        string memory jobRequesterId
    ) public returns (address) {
        uint256 hasAvailableStake = IStaking(staking).getAvailableStake(
            msg.sender
        );
        require(
            hasAvailableStake > 0,
            'Needs to stake HMT tokens to create an escrow.'
        );

        Escrow escrow = new Escrow(
            token,
            msg.sender,
            payable(msg.sender),
            STANDARD_DURATION,
            trustedHandlers
        );
        counter++;
        escrowCounters[address(escrow)] = counter;
        lastEscrow = address(escrow);
        emit LaunchedV2(token, lastEscrow, jobRequesterId);
        return lastEscrow;
    }

    // solhint-disable-next-line no-empty-blocks
    function _authorizeUpgrade(address) internal override onlyOwner {}

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[46] private __gap;
}
