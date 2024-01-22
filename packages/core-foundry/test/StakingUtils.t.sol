pragma solidity 0.8.20;

import "forge-std/test.sol";
import "../src/Staking.sol";
import "../src/HMToken.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract StakingUtils is Test {
    address owner = vm.addr(1);
    address validator = vm.addr(2);
    address operator = vm.addr(3);
    address operator2 = vm.addr(4);
    address operator3 = vm.addr(5);
    address exchangeOracle = vm.addr(6);
    address reputationOracle = vm.addr(7);
    address recordingOracle = vm.addr(8);

    address[8] accounts =
        [owner, validator, operator, operator2, operator3, exchangeOracle, reputationOracle, recordingOracle];

    string jobRequesterId = "job-requester-id";

    function _initTrustedHandlers() internal returns (address[] memory){
        address[] memory trustedHandlers = new address[](1);
        trustedHandlers[0] = validator;
        return trustedHandlers;
    }
}
