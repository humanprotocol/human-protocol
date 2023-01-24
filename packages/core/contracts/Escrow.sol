// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';

import './interfaces/IRewardPool.sol';
import './interfaces/IEscrow.sol';
import './utils/SafeMath.sol';

contract Escrow is IEscrow {
    using SafeMath for uint256;

    bytes4 private constant FUNC_SELECTOR_BALANCE_OF =
        bytes4(keccak256('balanceOf(address)'));
    bytes4 private constant FUNC_SELECTOR_TRANSFER =
        bytes4(keccak256('transfer(address,uint256)'));

    event IntermediateStorage(string _url, string _hash);
    event Pending(string manifest, string hash);
    event BulkTransfer(uint256 indexed _txId, uint256 _bulkCount);

    EscrowStatuses public override status;

    address public reputationOracle;
    address public recordingOracle;
    address public launcher;
    address payable public canceler;

    uint256 public reputationOracleStake;
    uint256 public recordingOracleStake;
    uint256 private constant BULK_MAX_VALUE = 1000000000 * (10 ** 18);
    uint32 private constant BULK_MAX_COUNT = 100;

    address public token;

    string public manifestUrl;
    string public manifestHash;
    uint256 public remainingFortunes;

    string public finalResultsUrl;
    string public finalResultsHash;

    uint256 public duration;

    uint256[] public finalAmounts;
    bool public bulkPaid;

    mapping(address => bool) public areTrustedHandlers;

    constructor(
        address _token,
        address payable _canceler,
        uint256 _duration,
        address[] memory _handlers
    ) {
        token = _token;
        status = EscrowStatuses.Launched;
        duration = _duration.add(block.timestamp); // solhint-disable-line not-rely-on-time
        launcher = msg.sender;
        canceler = _canceler;
        areTrustedHandlers[_canceler] = true;
        areTrustedHandlers[msg.sender] = true;
        addTrustedHandlers(_handlers);
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

    function addTrustedHandlers(address[] memory _handlers) public {
        require(
            areTrustedHandlers[msg.sender],
            'Address calling cannot add trusted handlers'
        );
        for (uint256 i = 0; i < _handlers.length; i++) {
            areTrustedHandlers[_handlers[i]] = true;
        }
    }

    // The escrower puts the Token in the contract without an agentless
    // and assigsn a reputation oracle to payout the bounty of size of the
    // amount specified
    function setup(
        address _reputationOracle,
        address _recordingOracle,
        uint256 _reputationOracleStake,
        uint256 _recordingOracleStake,
        string memory _url,
        string memory _hash,
        uint256 _fortunesRequested
    ) public trusted notExpired {
        require(
            _reputationOracle != address(0),
            'Invalid or missing token spender'
        );
        require(
            _recordingOracle != address(0),
            'Invalid or missing token spender'
        );
        require(_fortunesRequested > 0, 'Invalid or missing fortunes');
        uint256 totalStake = _reputationOracleStake.add(_recordingOracleStake);
        require(totalStake >= 0 && totalStake <= 100, 'Stake out of bounds');
        require(
            status == EscrowStatuses.Launched,
            'Escrow not in Launched status state'
        );

        reputationOracle = _reputationOracle;
        recordingOracle = _recordingOracle;
        areTrustedHandlers[reputationOracle] = true;
        areTrustedHandlers[recordingOracle] = true;

        reputationOracleStake = _reputationOracleStake;
        recordingOracleStake = _recordingOracleStake;

        manifestUrl = _url;
        manifestHash = _hash;
        remainingFortunes = _fortunesRequested;
        status = EscrowStatuses.Pending;
        emit Pending(manifestUrl, manifestHash);
    }

    function abort() public trusted notComplete notPaid {
        if (getBalance() != 0) {
            cancel();
        }
        selfdestruct(canceler);
    }

    function cancel()
        public
        trusted
        notBroke
        notComplete
        notPaid
        returns (bool)
    {
        _safeTransfer(canceler, getBalance());
        status = EscrowStatuses.Cancelled;
        return true;
    }

    function complete() public notExpired {
        require(
            msg.sender == reputationOracle || areTrustedHandlers[msg.sender],
            'Address calling is not trusted'
        );
        require(status == EscrowStatuses.Paid, 'Escrow not in Paid state');
        status = EscrowStatuses.Complete;
    }

    function storeResults(
        string memory _url,
        string memory _hash
    ) public trusted notExpired {
        require(
            status == EscrowStatuses.Pending ||
                status == EscrowStatuses.Partial,
            'Escrow not in Pending or Partial status state'
        );
        emit IntermediateStorage(_url, _hash);
    }

    function bulkPayOut(
        address[] memory _recipients,
        uint256[] memory _amounts,
        string memory _url,
        string memory _hash,
        uint256 _txId
    ) public trusted notBroke notLaunched notPaid notExpired returns (bool) {
        require(
            _recipients.length == _amounts.length,
            "Amount of recipients and values don't match"
        );
        require(_recipients.length < BULK_MAX_COUNT, 'Too many recipients');

        uint256 balance = getBalance();
        bulkPaid = false;
        uint256 aggregatedBulkAmount = 0;
        for (uint256 i; i < _amounts.length; i++) {
            aggregatedBulkAmount += _amounts[i];
        }
        require(aggregatedBulkAmount < BULK_MAX_VALUE, 'Bulk value too high');

        if (balance < aggregatedBulkAmount) {
            return bulkPaid;
        }

        bool writeOnchain = bytes(_hash).length != 0 || bytes(_url).length != 0;
        if (writeOnchain) {
            // Be sure they are both zero if one of them is
            finalResultsUrl = _url;
            finalResultsHash = _hash;
        }

        (
            uint256 reputationOracleFee,
            uint256 recordingOracleFee
        ) = finalizePayouts(_amounts);

        for (uint256 i = 0; i < _recipients.length; ++i) {
            _safeTransfer(_recipients[i], finalAmounts[i]);
        }

        delete finalAmounts;

        _safeTransfer(reputationOracle, reputationOracleFee);
        _safeTransfer(recordingOracle, recordingOracleFee);

        bulkPaid = true;
        balance = getBalance();
        if (bulkPaid) {
            if (status == EscrowStatuses.Pending) {
                status = EscrowStatuses.Partial;
                remainingFortunes = remainingFortunes.sub(_recipients.length);
            }
            if (
                balance > 0 &&
                status == EscrowStatuses.Partial &&
                remainingFortunes == 0
            ) {
                _safeTransfer(canceler, balance);
                status = EscrowStatuses.Paid;
            }
            if (balance == 0 && status == EscrowStatuses.Partial) {
                status = EscrowStatuses.Paid;
            }
        }
        emit BulkTransfer(_txId, _recipients.length);
        return true;
    }

    function finalizePayouts(
        uint256[] memory _amounts
    ) internal returns (uint256, uint256) {
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
            finalAmounts.push(amount);
        }
        return (reputationOracleFee, recordingOracleFee);
    }

    function _safeTransfer(address to, uint256 value) internal {
        SafeERC20.safeTransfer(IERC20(token), to, value);
    }

    modifier trusted() {
        require(areTrustedHandlers[msg.sender], 'Address calling not trusted');
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
