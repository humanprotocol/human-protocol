pragma solidity 0.8.20;

import "forge-std/test.sol";
import "../src/Staking.sol";
import "../src/HMToken.sol";
import "../src/EscrowFactory.sol";
import "../src/RewardPool.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract CoreUtils is Test {
    Staking public staking;
    EscrowFactory public escrowFactory;
    Escrow public escrow;
    HMToken public hmToken;
    RewardPool public rewardPool;

    address owner = makeAddr("owner");
    address validator = makeAddr("validator");
    address validator2 = makeAddr("validator2");
    address operator = makeAddr("operator");
    address operator2 = makeAddr("operator2");
    address operator3 = makeAddr("operator3");
    address exchangeOracle = makeAddr("exchangeOracle");
    address reputationOracle = makeAddr("reputationOracle");
    address recordingOracle = makeAddr("recordingOracle");
    address externalAccount = makeAddr("externalAccount");
    address launcher = makeAddr("launcher");
    address externalAddress = makeAddr("externalAddress");
    address[] restAccounts = new address[](2);
    address[] trustedHandlers = new address[](2);

    address[11] accounts = [
        owner,
        validator,
        operator,
        operator2,
        operator3,
        exchangeOracle,
        reputationOracle,
        recordingOracle,
        validator2,
        externalAccount,
        launcher
    ];

    uint256 public minimumStake = 2;
    uint256 public lockPeriod = 2;
    uint256 rewardFee = 2;
    string jobRequesterId = "job-requester-id";

    /**
     * @dev init a large number of recipients and amounts
     */
    function _initRecipientsAndAmounts(uint16 _maxRecipients)
        internal
        pure
        returns (address[] memory, uint256[] memory)
    {
        address[] memory recipients = new address[](_maxRecipients);
        uint256[] memory amounts = new uint256[](_maxRecipients);

        for (uint256 i = 0; i < _maxRecipients; i++) {
            recipients[i] = vm.addr(i);
            amounts[i] = 1;
        }
        return (recipients, amounts);
    }

    /**
     * @dev init Trusted Handlers addresses
     */
    function _initTrustedHandlers() internal {
        trustedHandlers[0] = vm.addr(55);
        trustedHandlers[1] = vm.addr(56);
    }

    /**
     * @dev stake and create escrow
     */
    function stakeAndCreateEscrow(uint256 amount, address token) internal returns (Escrow) {
        staking.stake(amount);
        address[] memory trustedHandlers = new address[](3);
        trustedHandlers[0] = accounts[1];
        trustedHandlers[1] = accounts[6];
        trustedHandlers[2] = accounts[7];
        address escrowAddress = escrowFactory.createEscrow(address(token), trustedHandlers, jobRequesterId);
        return Escrow(escrowAddress);
    }
}
