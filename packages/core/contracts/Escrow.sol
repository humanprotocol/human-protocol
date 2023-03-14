// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2;

import '@openzeppelin/contracts/utils/Context.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';

import './interfaces/IRewardPool.sol';
import './interfaces/IEscrow.sol';
import './utils/SafeMath.sol';

contract Escrow is IEscrow, Context, ReentrancyGuard {
    using SafeMath for uint256;

    bytes4 private constant FUNC_SELECTOR_BALANCE_OF =
        bytes4(keccak256('balanceOf(address)'));
    bytes4 private constant FUNC_SELECTOR_TRANSFER =
        bytes4(keccak256('transfer(address,uint256)'));

    string constant ERROR_ZERO_ADDRESS = 'Escrow: zero address';

    event Launched(
        address _launcher,
        string _manifest,
        string _hash,
        uint256 _solutionsRequested,
        uint256 _duration
    );
    event Exchanged();
    event IntermediateStorage(address _worker, string _url, string _hash);
    event BulkTransfer(
        uint256 indexed _txId,
        address[] _recipients,
        uint256[] _amounts,
        bool _isPartial
    );
    event Completed();
    event Cancelled();

    EscrowStatuses public override status;

    address public launcher;
    address public exchangeOracle;
    address public recordingOracle;
    address public reputationOracle;
    address public canceler;

    uint256 public recordingOracleStake;
    uint256 public reputationOracleStake;

    uint256 private constant BULK_MAX_VALUE = 1e9 * (10 ** 18);
    uint32 private constant BULK_MAX_COUNT = 100;

    address public token;

    string public manifestUrl;
    string public manifestHash;
    uint256 public remainingSolutions;

    string public finalResultsUrl;
    string public finalResultsHash;

    uint256 public duration;

    constructor(
        address _token,
        address _canceler,
        uint256 _duration,
        address _exchangeOracle,
        address _reputationOracle,
        address _recordingOracle,
        uint256 _reputationOracleStake,
        uint256 _recordingOracleStake,
        string memory _url,
        string memory _hash,
        uint256 _solutionsRequested
    ) {
        require(_token != address(0), ERROR_ZERO_ADDRESS);
        require(_canceler != address(0), ERROR_ZERO_ADDRESS);
        require(_exchangeOracle != address(0), ERROR_ZERO_ADDRESS);
        require(_reputationOracle != address(0), ERROR_ZERO_ADDRESS);
        require(_recordingOracle != address(0), ERROR_ZERO_ADDRESS);
        require(_solutionsRequested > 0, 'Invalid or missing solutions');
        require(
            _reputationOracleStake.add(_recordingOracleStake) <= 100,
            'Stake out of bounds'
        );

        token = _token;
        launcher = _msgSender();
        canceler = _canceler;
        exchangeOracle = _exchangeOracle;
        reputationOracle = _reputationOracle;
        recordingOracle = _recordingOracle;

        reputationOracleStake = _reputationOracleStake;
        recordingOracleStake = _recordingOracleStake;

        manifestUrl = _url;
        manifestHash = _hash;
        remainingSolutions = _solutionsRequested;
        duration = _duration.add(block.timestamp); // solhint-disable-line not-rely-on-time

        status = EscrowStatuses.Launched;
        emit Launched(launcher, _url, _hash, _solutionsRequested, _duration);
    }

    function exchange() external override notExpired {
        require(_msgSender() == exchangeOracle, 'Invalid handler');
        require(
            status == EscrowStatuses.Launched,
            'Escrow not in Launched state'
        );

        status = EscrowStatuses.Exchanged;
        emit Exchanged();
    }

    function storeResults(
        address _worker,
        string memory _url,
        string memory _hash
    ) external override notExpired {
        require(_msgSender() == recordingOracle, 'Invalid handler');
        require(
            status == EscrowStatuses.Exchanged,
            'Escrow not in Exchanged state'
        );

        _storeResult(_url, _hash);

        status = EscrowStatuses.Recorded;
        emit IntermediateStorage(_worker, _url, _hash);
    }

    function bulkPayOut(
        address[] memory _recipients,
        uint256[] memory _amounts,
        uint256 _txId
    ) external override notExpired nonReentrant {
        require(_msgSender() == reputationOracle, 'Invalid handler');
        require(
            status == EscrowStatuses.Recorded,
            'Escrow not in Recorded state'
        );

        require(
            _recipients.length == _amounts.length,
            "Amount of recipients and values don't match"
        );
        require(
            _recipients.length < BULK_MAX_COUNT &&
                _recipients.length <= remainingSolutions,
            'Too many recipients'
        );
        uint256 balance = getBalance();
        uint256 aggregatedBulkAmount = 0;
        for (uint256 i; i < _amounts.length; i++) {
            aggregatedBulkAmount = aggregatedBulkAmount.add(_amounts[i]);
        }
        require(aggregatedBulkAmount < BULK_MAX_VALUE, 'Bulk value too high');
        require(balance < aggregatedBulkAmount, 'Not enough balance to payout');

        (
            uint256[] memory finalAmounts,
            uint256 reputationOracleFee,
            uint256 recordingOracleFee
        ) = _finalizePayouts(_amounts);

        for (uint256 i = 0; i < _recipients.length; ++i) {
            uint256 amount = finalAmounts[i];
            if (amount != 0) {
                _safeTransfer(_recipients[i], amount);
            }
        }

        _safeTransfer(reputationOracle, reputationOracleFee);
        _safeTransfer(recordingOracle, recordingOracleFee);

        balance = getBalance();
        remainingSolutions = remainingSolutions.sub(_recipients.length);

        bool _isPartial = true;

        if (remainingSolutions == 0 || balance == 0) {
            if (balance > 0) {
                _safeTransfer(canceler, balance);
            }
            _isPartial = false;
            status = EscrowStatuses.Paid;
        }

        emit BulkTransfer(_txId, _recipients, finalAmounts, _isPartial);
    }

    function complete() external override notExpired {
        require(_msgSender() == reputationOracle, 'Invalid handler');
        require(status == EscrowStatuses.Paid, 'Escrow not in Paid state');

        status = EscrowStatuses.Completed;
        emit Completed();
    }

    function abort() external override trusted notComplete notPaid {
        cancel();
        selfdestruct(payable(canceler));
    }

    function cancel() public override trusted notComplete notPaid nonReentrant {
        uint256 balance = getBalance();

        if (balance != 0) {
            _safeTransfer(canceler, balance);
        }

        status = EscrowStatuses.Cancelled;
        emit Cancelled();
    }

    function getBalance() public view returns (uint256) {
        (bool success, bytes memory returnData) = token.staticcall(
            abi.encodeWithSelector(FUNC_SELECTOR_BALANCE_OF, address(this))
        );
        if (success) {
            return abi.decode(returnData, (uint256));
        }
        return 0;
    }

    function _finalizePayouts(
        uint256[] memory _amounts
    ) internal view returns (uint256[] memory, uint256, uint256) {
        uint256[] memory finalAmounts = new uint256[](_amounts.length);
        uint256 reputationOracleFee = 0;
        uint256 recordingOracleFee = 0;
        for (uint256 j; j < _amounts.length; j++) {
            uint256 singleReputationOracleFee = reputationOracleStake
                .mul(_amounts[j])
                .div(100);
            uint256 singleRecordingOracleFee = recordingOracleStake
                .mul(_amounts[j])
                .div(100);
            uint256 amount = _amounts[j].sub(singleReputationOracleFee).sub(
                singleRecordingOracleFee
            );
            reputationOracleFee = reputationOracleFee.add(
                singleReputationOracleFee
            );
            recordingOracleFee = recordingOracleFee.add(
                singleRecordingOracleFee
            );
            finalAmounts[j] = amount;
        }
        return (finalAmounts, reputationOracleFee, recordingOracleFee);
    }

    function _safeTransfer(address to, uint256 value) internal {
        SafeERC20.safeTransfer(IERC20(token), to, value);
    }

    function _storeResult(string memory _url, string memory _hash) internal {
        bool writeOnchain = bytes(_hash).length != 0 || bytes(_url).length != 0;
        if (writeOnchain) {
            // Be sure both of them are not zero
            finalResultsUrl = _url;
            finalResultsHash = _hash;
        }
    }

    modifier trusted() {
        require(
            _msgSender() == launcher ||
                _msgSender() == exchangeOracle ||
                _msgSender() == reputationOracle ||
                _msgSender() == recordingOracle,
            'Not trusted handler'
        );
        _;
    }

    modifier notComplete() {
        require(
            status != EscrowStatuses.Completed,
            'Escrow in Completed state'
        );
        _;
    }

    modifier notPaid() {
        require(status != EscrowStatuses.Paid, 'Escrow in Paid state');
        _;
    }

    modifier notExpired() {
        require(duration > block.timestamp, 'Contract expired'); // solhint-disable-line not-rely-on-time
        _;
    }
}
