pragma solidity 0.8.20;

import "forge-std/test.sol";
import "../src/Staking.sol";
import "../src/HMToken.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract CoreUtils2 is Test {
    address owner = vm.addr(1);
    address public validator = vm.addr(2);
    address validator2 = vm.addr(9);
    address operator = vm.addr(3);
    address operator2 = vm.addr(4);
    address operator3 = vm.addr(5);
    address exchangeOracle = vm.addr(6);
    address reputationOracle = vm.addr(7);
    address recordingOracle = vm.addr(8);
    address externalAccount = vm.addr(10);

    address[10] accounts = [
        owner,
        validator,
        operator,
        operator2,
        operator3,
        exchangeOracle,
        reputationOracle,
        recordingOracle,
        validator2,
        externalAccount
    ];

    uint256 public minimumStake = 2;
    uint256 public lockPeriod = 2;
    uint256 rewardFee = 2;
    string jobRequesterId = "job-requester-id";

    function _initTrustedHandlers() internal view returns (address[] memory) {
        address[] memory trustedHandlers = new address[](1);
        trustedHandlers[0] = validator;
        return trustedHandlers;
    }
}
