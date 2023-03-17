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

    string private constant ERROR_ZERO_ADDRESS = 'Escrow: zero address';
    /*
     * @TODO: Oracle fee percentage maximum threshold could be re-defined.
     */
    uint256 private constant MAX_ORACLE_FEE_PERCENTAGE = 100;
    uint256 private constant BULK_MAX_VALUE = 1e9 * (10 ** 18);
    uint32 private constant BULK_MAX_COUNT = 100;

    event Launched(
        address _launcher,
        string _manifestUrl,
        string _manifestHash,
        uint256 _requiredSubmissions,
        uint256 _duration
    );
    event Exchanged(string _url, string _hash);
    event Recorded(string _url, string _hash);
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

    uint256 public exchangeOracleFeePercentage;
    uint256 public recordingOracleFeePercentage;
    uint256 public reputationOracleFeePercentage;

    address public token;

    string public manifestUrl;
    string public manifestHash;
    uint256 public remainingSubmissions;
    uint256 public remainingPayouts;

    string public rawResultsUrl;
    string public rawResultsHash;
    string public finalResultsUrl;
    string public finalResultsHash;

    uint256 public duration;

    constructor(
        address _token,
        string memory _manifestUrl,
        string memory _manifestHash,
        uint256 _requiredSubmissions,
        uint256 _duration,
        address _canceler,
        OracleWithFee memory _exchangeOracle,
        OracleWithFee memory _reputationOracle,
        OracleWithFee memory _recordingOracle
    ) {
        require(_token != address(0), ERROR_ZERO_ADDRESS);

        require(bytes(_manifestUrl).length != 0, 'Missing manifest url');
        require(bytes(_manifestHash).length != 0, 'Missing manifest hash');
        require(_requiredSubmissions != 0, 'Missing required submissions');
        require(_duration != 0, 'Missing duration');

        require(_canceler != address(0), ERROR_ZERO_ADDRESS);
        require(_exchangeOracle.oracle != address(0), ERROR_ZERO_ADDRESS);
        require(_reputationOracle.oracle != address(0), ERROR_ZERO_ADDRESS);
        require(_recordingOracle.oracle != address(0), ERROR_ZERO_ADDRESS);
        require(
            _exchangeOracle
                .feePercentage
                .add(_reputationOracle.feePercentage)
                .add(_recordingOracle.feePercentage) <=
                MAX_ORACLE_FEE_PERCENTAGE,
            'Fee percentage out of bounds'
        );

        token = _token;
        launcher = _msgSender();
        canceler = _canceler;
        exchangeOracle = _exchangeOracle.oracle;
        reputationOracle = _reputationOracle.oracle;
        recordingOracle = _recordingOracle.oracle;

        exchangeOracleFeePercentage = _exchangeOracle.feePercentage;
        reputationOracleFeePercentage = _reputationOracle.feePercentage;
        recordingOracleFeePercentage = _recordingOracle.feePercentage;

        manifestUrl = _manifestUrl;
        manifestHash = _manifestHash;
        remainingSubmissions = _requiredSubmissions;
        remainingPayouts = _requiredSubmissions;
        duration = _duration.add(block.timestamp); // solhint-disable-line not-rely-on-time

        status = EscrowStatuses.Launched;
        emit Launched(
            launcher,
            _manifestUrl,
            _manifestHash,
            _requiredSubmissions,
            _duration
        );
    }

    function exchange(
        string memory _url,
        string memory _hash
    ) external override notExpired {
        require(_msgSender() == exchangeOracle, 'Invalid handler');
        require(bytes(_url).length != 0, 'Missing url');
        require(bytes(_hash).length != 0, 'Missing hash');
        require(
            status == EscrowStatuses.Launched,
            'Escrow not in Launched state'
        );

        rawResultsUrl = _url;
        rawResultsHash = _hash;
        status = EscrowStatuses.Exchanged;
        emit Exchanged(_url, _hash);
    }

    function record(
        string memory _url,
        string memory _hash
    ) external override notExpired {
        require(_msgSender() == recordingOracle, 'Invalid handler');
        require(bytes(_url).length != 0, 'Missing url');
        require(bytes(_hash).length != 0, 'Missing hash');
        require(
            status == EscrowStatuses.Exchanged,
            'Escrow not in Exchanged state'
        );

        finalResultsUrl = _url;
        finalResultsHash = _hash;
        remainingSubmissions = remainingSubmissions - 1;

        if (remainingSubmissions == 0) {
            status = EscrowStatuses.Recorded;
        }
        emit Recorded(_url, _hash);
    }

    function bulkPayOut(
        uint256 _txId,
        address[] memory _recipients,
        uint256[] memory _amounts
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
            _recipients.length <= BULK_MAX_COUNT &&
                _recipients.length <= remainingPayouts,
            'Too many recipients'
        );
        uint256 balance = getBalance();
        uint256 aggregatedBulkAmount = 0;
        for (uint256 i; i < _amounts.length; i++) {
            aggregatedBulkAmount = aggregatedBulkAmount.add(_amounts[i]);
        }
        require(aggregatedBulkAmount < BULK_MAX_VALUE, 'Bulk value too high');
        require(
            aggregatedBulkAmount <= balance,
            'Not enough balance to payout'
        );

        (
            uint256[] memory finalAmounts,
            uint256 exchangeOracleFee,
            uint256 reputationOracleFee,
            uint256 recordingOracleFee
        ) = _finalizePayouts(_amounts);

        for (uint256 i = 0; i < _recipients.length; ++i) {
            uint256 amount = finalAmounts[i];
            if (amount != 0) {
                _safeTransfer(_recipients[i], amount);
            }
        }

        _safeTransfer(exchangeOracle, exchangeOracleFee);
        _safeTransfer(reputationOracle, reputationOracleFee);
        _safeTransfer(recordingOracle, recordingOracleFee);

        remainingPayouts = remainingPayouts.sub(_recipients.length);

        bool _isPartial = true;

        if (remainingPayouts == 0) {
            balance = getBalance();

            if (balance != 0) {
                _safeTransfer(canceler, balance);
            }

            _isPartial = false;
            status = EscrowStatuses.Completed;
            emit Completed();
        }

        emit BulkTransfer(_txId, _recipients, finalAmounts, _isPartial);
    }

    function cancel() public override nonReentrant {
        require(
            _msgSender() == launcher ||
                _msgSender() == exchangeOracle ||
                _msgSender() == reputationOracle ||
                _msgSender() == recordingOracle,
            'Not trusted handler'
        );
        require(
            status != EscrowStatuses.Completed,
            'Escrow in Completed state'
        );

        uint256 balance = getBalance();

        if (balance != 0) {
            _safeTransfer(canceler, balance);
        }

        uint256 ethBalance = address(this).balance;

        if (ethBalance != 0) {
            (bool sent, ) = canceler.call{value: ethBalance}('');
            require(sent, 'Failed to send Ether');
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
    ) internal view returns (uint256[] memory, uint256, uint256, uint256) {
        uint256[] memory finalAmounts = new uint256[](_amounts.length);
        uint256 exchangeOracleFee = 0;
        uint256 reputationOracleFee = 0;
        uint256 recordingOracleFee = 0;
        for (uint256 j; j < _amounts.length; j++) {
            uint256 totalOracleFee = 0;

            {
                uint256 singleExchangeOracleFee = exchangeOracleFeePercentage
                    .mul(_amounts[j])
                    .div(100);
                exchangeOracleFee = exchangeOracleFee.add(
                    singleExchangeOracleFee
                );
                totalOracleFee = totalOracleFee.add(singleExchangeOracleFee);
            }

            {
                uint256 singleReputationOracleFee = reputationOracleFeePercentage
                        .mul(_amounts[j])
                        .div(100);
                reputationOracleFee = reputationOracleFee.add(
                    singleReputationOracleFee
                );
                totalOracleFee = totalOracleFee.add(singleReputationOracleFee);
            }

            {
                uint256 singleRecordingOracleFee = recordingOracleFeePercentage
                    .mul(_amounts[j])
                    .div(100);
                recordingOracleFee = recordingOracleFee.add(
                    singleRecordingOracleFee
                );
                totalOracleFee = totalOracleFee.add(singleRecordingOracleFee);
            }

            finalAmounts[j] = _amounts[j].sub(totalOracleFee);
        }
        return (
            finalAmounts,
            exchangeOracleFee,
            reputationOracleFee,
            recordingOracleFee
        );
    }

    function _safeTransfer(address to, uint256 value) internal {
        SafeERC20.safeTransfer(IERC20(token), to, value);
    }

    modifier notExpired() {
        require(duration > block.timestamp, 'Contract expired'); // solhint-disable-line not-rely-on-time
        _;
    }
}
