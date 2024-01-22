pragma solidity 0.8.20;

import "forge-std/test.sol";
import "../src/Staking.sol";
import "../src/HMToken.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract StakingUtils is Test {
    address owner = vm.addr(1);
    address operator = vm.addr(2);
    address operator2 = vm.addr(3);
    address operator3 = vm.addr(4);
    address exchangeOracle = vm.addr(5);
    address reputationOracle = vm.addr(6);
    address recordingOracle = vm.addr(7);

    address[7] accounts = [owner, operator, operator2, operator3, exchangeOracle, reputationOracle, recordingOracle];
}
