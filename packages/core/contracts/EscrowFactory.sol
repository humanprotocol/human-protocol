// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';

import './interfaces/IStaking.sol';
import './interfaces/IEscrow.sol';
import './Escrow.sol';

contract EscrowFactory is OwnableUpgradeable, UUPSUpgradeable {
    uint256 constant STANDARD_DURATION = 8640000;
    string constant ERROR_ZERO_ADDRESS = 'EscrowFactory: Zero Address';

    uint256 public counter;
    mapping(address => uint256) public escrowCounters;
    address public lastEscrow;
    address public staking;

    event Launched(address token, address escrow);

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
        uint256 amount,
        uint256 allocationAmount,
        string memory manifestUrl,
        string memory manifestHash,
        uint256 requiredSubmissions,
        address exchangeOracle,
        uint256 exchangeOracleFeePercentage,
        address reputationOracle,
        uint256 reputationOracleFeePercentage,
        address recordingOracle,
        uint256 recordingOracleFeePercentage
    ) public {
        require(
            IStaking(staking).hasAvailableStake(_msgSender()),
            'Job launcher Needs to stake HMT tokens to create an escrow.'
        );
        require(
            IStaking(staking).hasAvailableStake(exchangeOracle),
            'Exchange Oracle needs to stake HMT tokens to create an escrow.'
        );
        require(
            IStaking(staking).hasAvailableStake(reputationOracle),
            'Reputation Oracle needs to stake HMT tokens to create an escrow.'
        );
        require(
            IStaking(staking).hasAvailableStake(recordingOracle),
            'Recording Oracle needs to stake HMT tokens to create an escrow.'
        );

        Escrow escrow = new Escrow(
            token,
            manifestUrl,
            manifestHash,
            requiredSubmissions,
            STANDARD_DURATION,
            _msgSender(),
            IEscrow.OracleWithFee({
                oracle: exchangeOracle,
                feePercentage: exchangeOracleFeePercentage
            }),
            IEscrow.OracleWithFee({
                oracle: reputationOracle,
                feePercentage: reputationOracleFeePercentage
            }),
            IEscrow.OracleWithFee({
                oracle: recordingOracle,
                feePercentage: recordingOracleFeePercentage
            })
        );

        counter++;
        escrowCounters[address(escrow)] = counter;
        lastEscrow = address(escrow);

        // Deposit the escrow
        _safeTransferFrom(token, _msgSender(), lastEscrow, amount);

        // Allocate the staking tokens
        IStaking(staking).allocateFrom(
            _msgSender(),
            lastEscrow,
            allocationAmount
        );

        emit Launched(token, lastEscrow);
    }

    function isChild(address _child) public view returns (bool) {
        return escrowCounters[_child] == counter;
    }

    function hasEscrow(address _address) public view returns (bool) {
        return escrowCounters[_address] != 0;
    }

    function _safeTransferFrom(
        address token,
        address from,
        address to,
        uint256 value
    ) internal {
        SafeERC20.safeTransferFrom(IERC20(token), from, to, value);
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
