// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/utils/ReentrancyGuard.sol';

import './interfaces/IEscrow.sol';
import './utils/SafeMath.sol';

contract Escrow is IEscrow, ReentrancyGuard {
    using SafeMath for uint256;

    bytes4 private constant FUNC_SELECTOR_BALANCE_OF =
        bytes4(keccak256('balanceOf(address)'));

    string constant ERROR_ZERO_ADDRESS = 'Escrow: zero address';

    uint256 private constant BULK_MAX_VALUE = 1e9 * (10 ** 18);
    uint32 private constant BULK_MAX_COUNT = 100;

    event TrustedHandlerAdded(address _handler);
    event IntermediateStorage(string _url, string _hash);
    event Pending(string manifest, string hash);
    event BulkTransfer(
        uint256 indexed _txId,
        address[] _recipients,
        uint256[] _amounts,
        bool _isPartial
    );
    event Cancelled();
    event Completed();

    EscrowStatuses public override status;

    address public reputationOracle;
    address public recordingOracle;
    address public exchangeOracle;
    address public launcher;
    address payable public canceler;
    address public escrowFactory;

    uint8 public reputationOracleFeePercentage;
    uint8 public recordingOracleFeePercentage;
    uint8 public exchangeOracleFeePercentage;

    address public token;

    string public manifestUrl;
    string public manifestHash;

    string public intermediateResultsUrl;

    string public finalResultsUrl;
    string public finalResultsHash;

    uint256 public duration;

    mapping(address => bool) public areTrustedHandlers;

    constructor(
        address _token,
        address _launcher,
        address payable _canceler,
        uint256 _duration,
        address[] memory _handlers
    ) {
        require(_token != address(0), ERROR_ZERO_ADDRESS);
        require(_canceler != address(0), ERROR_ZERO_ADDRESS);

        token = _token;
        status = EscrowStatuses.Launched;
        duration = _duration.add(block.timestamp); // solhint-disable-line not-rely-on-time
        launcher = _launcher;
        canceler = _canceler;
        escrowFactory = msg.sender;
        areTrustedHandlers[_launcher] = true;
        areTrustedHandlers[_canceler] = true;
        _addTrustedHandlers(_handlers);
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

    function addTrustedHandlers(
        address[] memory _handlers
    ) public override trusted {
        _addTrustedHandlers(_handlers);
    }

    function _addTrustedHandlers(address[] memory _handlers) internal {
        for (uint256 i = 0; i < _handlers.length; i++) {
            require(_handlers[i] != address(0), ERROR_ZERO_ADDRESS);
            areTrustedHandlers[_handlers[i]] = true;
            emit TrustedHandlerAdded(_handlers[i]);
        }
    }

    // The escrower puts the Token in the contract without an agentless
    // and assigsn a reputation oracle to payout the bounty of size of the
    // amount specified
    function setup(
        address _reputationOracle,
        address _recordingOracle,
        address _exchangeOracle,
        uint8 _reputationOracleFeePercentage,
        uint8 _recordingOracleFeePercentage,
        uint8 _exchangeOracleFeePercentage,
        string memory _url,
        string memory _hash
    ) external override trusted notExpired {
        require(
            _reputationOracle != address(0),
            'Invalid reputation oracle address'
        );
        require(
            _recordingOracle != address(0),
            'Invalid recording oracle address'
        );
        require(
            _exchangeOracle != address(0),
            'Invalid exchange oracle address'
        );
        uint256 _totalFeePercentage = uint256(_reputationOracleFeePercentage) +
            uint256(_recordingOracleFeePercentage) +
            uint256(_exchangeOracleFeePercentage);
        require(_totalFeePercentage <= 100, 'Percentage out of bounds');

        require(
            status == EscrowStatuses.Launched,
            'Escrow not in Launched status state'
        );

        reputationOracle = _reputationOracle;
        recordingOracle = _recordingOracle;
        exchangeOracle = _exchangeOracle;

        reputationOracleFeePercentage = _reputationOracleFeePercentage;
        recordingOracleFeePercentage = _recordingOracleFeePercentage;
        exchangeOracleFeePercentage = _exchangeOracleFeePercentage;

        manifestUrl = _url;
        manifestHash = _hash;
        status = EscrowStatuses.Pending;
        emit Pending(manifestUrl, manifestHash);
    }

    function abort() external override trusted notComplete notPaid {
        if (getBalance() != 0) {
            cancel();
        }
        selfdestruct(canceler);
    }

    function cancel()
        public
        override
        trusted
        notBroke
        notComplete
        notPaid
        nonReentrant
        returns (bool)
    {
        _safeTransfer(canceler, getBalance());
        status = EscrowStatuses.Cancelled;
        emit Cancelled();
        return true;
    }

    function complete() external override notExpired trustedOrReputationOracle {
        require(status == EscrowStatuses.Paid, 'Escrow not in Paid state');
        status = EscrowStatuses.Complete;
        emit Completed();
    }

    function storeResults(
        string memory _url,
        string memory _hash
    ) external override trustedOrRecordingOracle notExpired {
        require(
            status == EscrowStatuses.Pending ||
                status == EscrowStatuses.Partial,
            'Escrow not in Pending or Partial status state'
        );
        require(bytes(_url).length != 0, "URL can't be empty");
        require(bytes(_hash).length != 0, "Hash can't be empty");

        intermediateResultsUrl = _url;

        emit IntermediateStorage(_url, _hash);
    }

    /**
     * @dev Performs bulk payout to multiple workers
     * Escrow needs to be complted / cancelled, so that it can be paid out.
     * Every recipient is paid with the amount after reputation and recording oracle fees taken out.
     * If the amount is less than the fee, the recipient is not paid.
     * If the fee is zero, reputation, and recording oracle are not paid.
     * Payout will fail if any of the transaction fails.
     * If the escrow is fully paid out, meaning that the balance of the escrow is 0, it'll set as Paid.
     * If the escrow is partially paid out, meaning that the escrow still has remaining balance, it'll set as Partial.
     * This contract is only callable if the contract is not broke, not launched, not paid, not expired, by trusted parties.
     *
     * @param _recipients Array of recipients
     * @param _amounts Array of amounts to be paid to each recipient.
     * @param _url URL storing results as transaction details
     * @param _hash Hash of the results
     * @param _txId Transaction ID
     */
    function bulkPayOut(
        address[] memory _recipients,
        uint256[] memory _amounts,
        string memory _url,
        string memory _hash,
        uint256 _txId
    )
        external
        override
        trustedOrReputationOracle
        notBroke
        notLaunched
        notPaid
        notExpired
        nonReentrant
    {
        require(
            _recipients.length == _amounts.length,
            "Amount of recipients and values don't match"
        );
        require(_amounts.length > 0, 'Amounts should not be empty');
        require(_recipients.length < BULK_MAX_COUNT, 'Too many recipients');
        require(
            status != EscrowStatuses.Complete &&
                status != EscrowStatuses.Cancelled,
            'Invalid status'
        );

        uint256 balance = getBalance();
        uint256 aggregatedBulkAmount = 0;
        for (uint256 i; i < _amounts.length; i++) {
            require(_amounts[i] > 0, 'Amount should be greater than zero');
            aggregatedBulkAmount = aggregatedBulkAmount.add(_amounts[i]);
        }
        require(aggregatedBulkAmount < BULK_MAX_VALUE, 'Bulk value too high');
        require(aggregatedBulkAmount <= balance, 'Not enough balance');

        require(bytes(_url).length != 0, "URL can't be empty");
        require(bytes(_hash).length != 0, "Hash can't be empty");

        finalResultsUrl = _url;
        finalResultsHash = _hash;

        (
            uint256[] memory finalAmounts,
            uint256 reputationOracleFee,
            uint256 recordingOracleFee,
            uint256 exchangeOracleFee
        ) = finalizePayouts(_amounts);

        for (uint256 i = 0; i < _recipients.length; ++i) {
            if (finalAmounts[i] > 0) {
                _safeTransfer(_recipients[i], finalAmounts[i]);
            }
        }

        if (reputationOracleFee > 0) {
            _safeTransfer(reputationOracle, reputationOracleFee);
        }
        if (recordingOracleFee > 0) {
            _safeTransfer(recordingOracle, recordingOracleFee);
        }
        if (exchangeOracleFee > 0) {
            _safeTransfer(exchangeOracle, exchangeOracleFee);
        }

        balance = getBalance();

        bool isPartial;
        if (balance == 0) {
            status = EscrowStatuses.Paid;
            isPartial = false;
        } else {
            status = EscrowStatuses.Partial;
            isPartial = true;
        }

        emit BulkTransfer(_txId, _recipients, finalAmounts, isPartial);
    }

    function finalizePayouts(
        uint256[] memory _amounts
    ) internal view returns (uint256[] memory, uint256, uint256, uint256) {
        uint256[] memory finalAmounts = new uint256[](_amounts.length);
        uint256 reputationOracleFee = 0;
        uint256 recordingOracleFee = 0;
        uint256 exchangeOracleFee = 0;
        for (uint256 j; j < _amounts.length; j++) {
            uint256 amount = _amounts[j];
            uint256 amountFee = 0;

            {
                uint256 singleReputationOracleFee = uint256(
                    reputationOracleFeePercentage
                ).mul(amount).div(100);
                reputationOracleFee = reputationOracleFee.add(
                    singleReputationOracleFee
                );
                amountFee = amountFee.add(singleReputationOracleFee);
            }

            {
                uint256 singleRecordingOracleFee = uint256(
                    recordingOracleFeePercentage
                ).mul(_amounts[j]).div(100);
                recordingOracleFee = recordingOracleFee.add(
                    singleRecordingOracleFee
                );
                amountFee = amountFee.add(singleRecordingOracleFee);
            }

            {
                uint256 singleExchangeOracleFee = uint256(
                    exchangeOracleFeePercentage
                ).mul(_amounts[j]).div(100);
                exchangeOracleFee = exchangeOracleFee.add(
                    singleExchangeOracleFee
                );
                amountFee = amountFee.add(singleExchangeOracleFee);
            }

            finalAmounts[j] = amount.sub(amountFee);
        }
        return (
            finalAmounts,
            reputationOracleFee,
            recordingOracleFee,
            exchangeOracleFee
        );
    }

    function _safeTransfer(address to, uint256 value) internal {
        SafeERC20.safeTransfer(IERC20(token), to, value);
    }

    modifier trusted() {
        require(areTrustedHandlers[msg.sender], 'Address calling not trusted');
        _;
    }

    modifier trustedOrReputationOracle() {
        require(
            areTrustedHandlers[msg.sender] || msg.sender == reputationOracle,
            'Address calling not trusted'
        );
        _;
    }

    modifier trustedOrRecordingOracle() {
        require(
            areTrustedHandlers[msg.sender] || msg.sender == recordingOracle,
            'Address calling not trusted'
        );
        _;
    }

    modifier notBroke() {
        require(getBalance() != 0, 'Token contract out of funds');
        _;
    }

    modifier notComplete() {
        require(
            status != EscrowStatuses.Complete,
            'Escrow in Complete status state'
        );
        _;
    }

    modifier notPaid() {
        require(status != EscrowStatuses.Paid, 'Escrow in Paid status state');
        _;
    }

    modifier notLaunched() {
        require(
            status != EscrowStatuses.Launched,
            'Escrow in Launched status state'
        );
        _;
    }

    modifier notExpired() {
        require(duration > block.timestamp, 'Contract expired'); // solhint-disable-line not-rely-on-time
        _;
    }
}
